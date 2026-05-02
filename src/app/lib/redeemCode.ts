import { supabase } from "./supabaseClient";

export interface RedeemCodeResult {
  success: boolean;
  error?: string;
  expiresAt?: string | null;
}

export async function redeemCode(
  code: string,
  email: string,
  expectedType: "pdf" | "cbt"
): Promise<RedeemCodeResult> {
  const trimmedCode = code.trim().toUpperCase();

  if (!trimmedCode) {
    return { success: false, error: "Please enter your unlock code." };
  }

  const { data, error } = await supabase
    .from("unlock_codes")
    .select("id, code, type, used, expires_at")
    .eq("code", trimmedCode)
    .single();

  if (error || !data) {
    return { success: false, error: "Invalid code. Check your receipt email." };
  }

  if (data.type !== expectedType) {
    return { success: false, error: "Wrong code type." };
  }

  if (data.used) {
    if (expectedType === "cbt" && data.expires_at) {
      const expiresAt = new Date(data.expires_at).getTime();
      if (Date.now() < expiresAt) {
        return { success: true, expiresAt: data.expires_at };
      }
    }
    return { success: false, error: "Code already used." };
  }

  if (expectedType === "cbt" && data.expires_at) {
    const expiresAt = new Date(data.expires_at).getTime();
    if (Date.now() > expiresAt) {
      return { success: false, error: "Subscription expired. Purchase a new CBT code." };
    }
  }

  const now = new Date();
  const expiresAt = expectedType === "cbt"
    ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { error: updateError } = await supabase
    .from("unlock_codes")
    .update({
      used: true,
      used_by_email: email,
      used_at: now.toISOString(),
      expires_at: expiresAt,
    })
    .eq("code", trimmedCode);

  if (updateError) {
    return { success: false, error: "Failed to redeem code. Please try again." };
  }

  return { success: true, expiresAt };
}
