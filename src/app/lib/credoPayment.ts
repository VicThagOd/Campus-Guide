// supabase/functions/credo-webhook/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.177.0/encoding/hex.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const PRODUCT_AMOUNTS = { pdf: 2010.75, cbt: 2010.75 } as const;
type PaymentType = "pdf" | "cbt";

async function verifySignature(rawBody: string, signatureHeader: string, secret: string): Promise<boolean> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(rawBody));
  const computedSignature = hexEncode(new Uint8Array(signed));
  return computedSignature === signatureHeader;
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
  return expiresAt;
}

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // 1. Verify signature using the webhook token (CG-WH-200)
    const webhookSecret = Deno.env.get("CREDO_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("CREDO_WEBHOOK_SECRET not set");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Credo likely sends signature in header: "x-credo-signature" or "x-signature"
    // Adjust header name if needed (check Credo docs)
    const signatureHeader = req.headers.get("x-credo-signature") ?? req.headers.get("x-signature") ?? "";
    if (!signatureHeader) {
      console.error("Missing signature header");
      return new Response("Missing signature", { status: 401 });
    }

    const isValid = await verifySignature(rawBody, signatureHeader, webhookSecret);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    // 2. Identify event – adjust fields based on Credo's actual webhook payload
    const event = body.event;
    const data = body.data;

    // Only process successful charge events
    if (event !== "charge.success" || data?.status !== "success") {
      return new Response("OK", { status: 200 });
    }

    const credoTransRef = data.transRef; // e.g., vs_xxxxxx
    if (!credoTransRef) {
      return new Response("Missing transRef", { status: 400 });
    }

    // Idempotency check
    const { data: processed } = await supabase
      .from("processed_webhooks")
      .select("trans_ref")
      .eq("trans_ref", credoTransRef)
      .maybeSingle();
    if (processed) return new Response("OK", { status: 200 });

    // 3. Verify transaction via Credo API (critical)
    const secretKey = Deno.env.get("CREDO_SECRET_KEY")!;
    const verifyUrl = `https://api.credocentral.com/transaction/${credoTransRef}/verify`;
    const verifyRes = await fetch(verifyUrl, {
      headers: { Authorization: secretKey },
    });
    const verifyJson = await verifyRes.json();
    const txn = verifyJson?.data;

    if (!verifyRes.ok || txn?.status !== 0) {
      console.error("Credo verification failed", verifyJson);
      return new Response("OK", { status: 200 });
    }

    const businessRef = txn.businessRef; // Our reference sent during init
    if (!businessRef) {
      console.error("No businessRef found");
      return new Response("OK", { status: 200 });
    }

    // Look up pending payment
    const { data: pending } = await supabase
      .from("pending_payments")
      .select("user_id, email, payment_type")
      .eq("reference", businessRef)
      .maybeSingle();

    if (!pending) {
      console.error("No pending payment for reference", businessRef);
      return new Response("OK", { status: 200 });
    }

    const userId = pending.user_id;
    const customerEmail = pending.email;
    const paymentType = pending.payment_type as PaymentType;

    // Amount check (txn.transAmount is in kobo)
    const paidAmountNaira = txn.transAmount / 100;
    if (Math.abs(paidAmountNaira - PRODUCT_AMOUNTS[paymentType]) > 0.01) {
      console.error("Amount mismatch", { expected: PRODUCT_AMOUNTS[paymentType], got: paidAmountNaira });
      return new Response("OK", { status: 200 });
    }

    // Grant access
    await grantUserAccess(userId, customerEmail, paymentType);

    // Record processed webhook
    await supabase.from("processed_webhooks").insert({
      trans_ref: credoTransRef,
      product_type: paymentType,
      user_id: userId,
    });

    // Clean up pending payment
    await supabase.from("pending_payments").delete().eq("reference", businessRef);

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
});