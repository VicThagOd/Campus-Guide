import { createClient } from '@supabase/supabase-js';
import { resolvedSupabaseAnonKey, resolvedSupabaseUrl } from './env';

export const supabase = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
