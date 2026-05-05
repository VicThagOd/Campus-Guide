import { supabase } from "./supabaseClient";

export interface RedeemCodeResult {
  success: boolean;
  error?: string;
  expiresAt?: string | null;
}

export async function redeemCode(
  code: string,
  email: string,
  expectedType: "pdf" | "cbt",
  userId?: string
): Promise<RedeemCodeResult> {
  const trimmedCode = code.trim().toUpperCase();

  if (!trimmedCode) {
    return { success: false, error: "Please enter your unlock code." };
  }

  // 1. Look up the code
  const { data, error } = await supabase
    .from("unlock_codes")
    .select("id, code, type, used, used_by_email, expires_at")
    .eq("code", trimmedCode)
    .single();

  if (error || !data) {
    return { success: false, error: "Invalid code. Check your receipt email." };
  }

  // 2. Check type matches
  if (data.type !== expectedType) {
    return {
      success: false,
      error: `Wrong code type. Use a ${expectedType.toUpperCase()} code for this access.`,
    };
  }

  // 3. If already used
  if (data.used) {
    // Allow re-entry of own active CBT code
    if (
      expectedType === "cbt" &&
      data.expires_at &&
      data.used_by_email === email &&
      Date.now() < new Date(data.expires_at).getTime()
    ) {
      // Grant access again (re-fetch case)
      if (userId) {
        await grantUserAccess(userId, email, expectedType, data.expires_at);
      }
      return { success: true, expiresAt: data.expires_at };
    }

    if (
      expectedType === "cbt" &&
      data.expires_at &&
      Date.now() > new Date(data.expires_at).getTime()
    ) {
      return {
        success: false,
        error: "This code has expired. Purchase a new CBT subscription.",
      };
    }

    return { success: false, error: "This code has already been used." };
  }

  // 4. Check if CBT code is somehow pre-expired
  if (expectedType === "cbt" && data.expires_at) {
    if (Date.now() > new Date(data.expires_at).getTime()) {
      return {
        success: false,
        error: "Subscription expired. Purchase a new CBT code.",
      };
    }
  }

  // 5. Calculate expiry
  const now = new Date();
  const expiresAt =
    expectedType === "cbt"
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  // 6. Mark code as used
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

  // 7. Grant access in user_access table
  if (userId) {
    const accessError = await grantUserAccess(userId, email, expectedType, expiresAt);
    if (accessError) {
      return { success: false, error: "Code redeemed but failed to grant access. Contact support." };
    }
  }

  return { success: true, expiresAt };
}

async function grantUserAccess(
  userId: string,
  email: string,
  type: "pdf" | "cbt",
  expiresAt: string | null
): Promise<string | null> {
  const now = new Date().toISOString();

  // Fetch existing access first so we don't overwrite the other type
  const { data: existing } = await supabase
    .from("user_access")
    .select("pdf_access, cbt_access, cbt_expires_at")
    .eq("user_id", userId)
    .single();

  const payload = {
    user_id: userId,
    email,
    pdf_access: type === "pdf" ? true : existing?.pdf_access ?? false,
    cbt_access: type === "cbt" ? true : existing?.cbt_access ?? false,
    cbt_expires_at: type === "cbt" ? expiresAt : existing?.cbt_expires_at ?? null,
    updated_at: now,
  };

  const { error } = await supabase
    .from("user_access")
    .upsert([payload], { onConflict: "user_id" });

  return error ? error.message : null;
}