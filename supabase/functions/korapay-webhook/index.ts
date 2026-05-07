import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.177.0/encoding/hex.ts";

const PRODUCT_AMOUNTS = { pdf: 2010.75, cbt: 2010.75 } as const;
type PaymentType = "pdf" | "cbt";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function verifySignature(payload: string, signature: string, key: string): Promise<boolean> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payload));
  return new TextDecoder().decode(encode(new Uint8Array(signed))) === signature;
}

function parseReference(reference: string): { paymentType: PaymentType } | null {
  const match = /^cg_(pdf|cbt)_\d+$/.exec(reference);
  return match ? { paymentType: match[1] as PaymentType } : null;
}

async function grantUserAccess(userId: string, email: string, paymentType: PaymentType) {
  const expiresAt = paymentType === "cbt"
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data: existing } = await supabase
    .from("user_access")
    .select("pdf_access, cbt_access, cbt_expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await supabase.from("user_access").upsert([{
    user_id: userId,
    email,
    pdf_access: paymentType === "pdf" ? true : (existing?.pdf_access ?? false),
    cbt_access: paymentType === "cbt" ? true : (existing?.cbt_access ?? false),
    cbt_expires_at: paymentType === "cbt" ? expiresAt : (existing?.cbt_expires_at ?? null),
    updated_at: new Date().toISOString(),
  }], { onConflict: "user_id" });

  if (error) throw error;
}

const ok = () => new Response("OK", { status: 200 });

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();

    // Verify signature
    const isValid = await verifySignature(
      rawBody,
      req.headers.get("x-korapay-signature") ?? "",
      Deno.env.get("KORAPAY_ENCRYPTION_KEY") ?? "",
    );
    if (!isValid) return new Response("Invalid signature", { status: 401 });

    const { event, data } = JSON.parse(rawBody);

    if (event !== "charge.success" || data?.status !== "success") return ok();

    const reference = data?.reference;
    if (!reference) return new Response("Missing reference", { status: 400 });

    // Idempotency check
    const { data: processed } = await supabase
      .from("processed_webhooks")
      .select("trans_ref")
      .eq("trans_ref", reference)
      .maybeSingle();
    if (processed) return ok();

    // Verify with Korapay
    const verifyRes = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${reference}`, {
      headers: { Authorization: `Bearer ${Deno.env.get("KORAPAY_SECRET_KEY")}` },
    });
    const txn = (await verifyRes.json())?.data;

    if (!verifyRes.ok || txn?.status !== "success") {
      console.error("Korapay verify failed", txn);
      return ok();
    }

    const parsed = parseReference(reference);
    if (!parsed) {
      console.error("Unknown reference", reference);
      return ok();
    }

    const userId = txn.metadata?.userId ?? "";
    if (!userId) {
      console.error("Missing userId", reference);
      return ok();
    }

    const customerEmail = txn.customer?.email ?? "";
    if (!customerEmail) {
      console.error("Missing email", reference);
      return ok();
    }

    // Verify amount
    if (Math.abs(Number(txn.amount) - PRODUCT_AMOUNTS[parsed.paymentType]) > 0.01) {
      console.error("Amount mismatch", { expected: PRODUCT_AMOUNTS[parsed.paymentType], got: txn.amount });
      return ok();
    }

    // Grant access and record
    await grantUserAccess(userId, customerEmail, parsed.paymentType);
    await supabase.from("processed_webhooks").insert({
      trans_ref: reference,
      product_type: parsed.paymentType,
      user_id: userId,
    });

    return ok();
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
});