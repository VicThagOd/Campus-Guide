import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { hasSupabaseEnv } from '../lib/env';

interface Profile {
  id: string;
  username: string;
  name: string;
  course: string;
  email: string;
  email_opt_in: boolean;
  user_type: string;
  last_login_at: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<{ requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
}

interface SignupData {
  name: string;
  username: string;
  email: string;
  password: string;
  course: string;
  email_opt_in: boolean;
  user_type: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    setProfile(data);
  };

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then((result: any) => {
      const { data: { session } } = result;
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!hasSupabaseEnv) throw new Error("Supabase environment variables are missing.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signup = async (data: SignupData) => {
    if (!hasSupabaseEnv) throw new Error("Supabase environment variables are missing.");
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          username: data.username,
          course: data.course,
          email_opt_in: data.email_opt_in,
          user_type: data.user_type,
        },
      },
    });
    if (error) throw new Error(error.message);
    return { requiresEmailConfirmation: !authData.session };
  };

  const logout = async () => {
    if (!hasSupabaseEnv) {
      setProfile(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setProfile(null);
  };

  const resetPasswordForEmail = async (email: string) => {
    if (!hasSupabaseEnv) throw new Error("Supabase environment variables are missing.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout, resetPasswordForEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
