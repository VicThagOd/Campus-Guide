import { supabase } from "./supabaseClient";

export interface UserAccess {
  pdf_access: boolean;
  cbt_access: boolean;
  cbt_expires_at: string | null;
}

const defaultAccess: UserAccess = {
  pdf_access: false,
  cbt_access: false,
  cbt_expires_at: null,
};

// Fetch access flags from Supabase for the logged-in user
export async function fetchUserAccess(userId: string): Promise<UserAccess> {
  const { data, error } = await supabase
    .from("user_access")
    .select("pdf_access, cbt_access, cbt_expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !data) return defaultAccess;

  // If CBT access exists but is expired, treat as no access
  if (data.cbt_access && data.cbt_expires_at) {
    const expired = Date.now() > new Date(data.cbt_expires_at).getTime();
    if (expired) {
      return { ...data, cbt_access: false };
    }
  }

  return data as UserAccess;
}

export function isCbtAccessExpired(cbtExpiresAt: string | null): boolean {
  if (!cbtExpiresAt) return false;
  return Date.now() > new Date(cbtExpiresAt).getTime();
}
