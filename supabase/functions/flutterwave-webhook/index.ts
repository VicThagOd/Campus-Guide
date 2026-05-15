// supabase/functions/flutterwave-webhook/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const PRODUCT_AMOUNTS = { pdf: 2010.75, cbt: 2010.75 } as const;
type PaymentType = "pdf" | "cbt";

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
    // 1. Get the raw body (needed for logging, but no HMAC)
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    console.log("=== Webhook received ===");
    console.log("Event:", body.event);
    console.log("Status:", body.data?.status);

    // 2. Signature verification (direct string comparison)
    const webhookSecret = Deno.env.get("FLW_WEBHOOK_SECRET");
    const signatureHeader = req.headers.get("verif-hash") || "";

    console.log("verif-hash header:", signatureHeader);
    console.log("Secret from env exists:", !!webhookSecret);

    if (!webhookSecret || signatureHeader !== webhookSecret) {
      console.warn("Invalid signature – rejecting");
      return new Response("Invalid signature", { status: 401 });
    }

    // 3. Only process successful charge.completed
    if (body.event !== "charge.completed" || body.data?.status !== "successful") {
      console.log("Ignoring non-successful charge event");
      return new Response("OK", { status: 200 });
    }

    const flwTransactionId = body.data.id;
    console.log("Transaction ID:", flwTransactionId);

    // 4. Idempotency
    const { data: processed } = await supabase
      .from("processed_webhooks")
      .select("trans_ref")
      .eq("trans_ref", String(flwTransactionId))
      .maybeSingle();

    if (processed) {
      console.log("Already processed – skipping");
      return new Response("OK", { status: 200 });
    }

    // 5. Verify with Flutterwave API (recommended best practice)
    const secretKey = Deno.env.get("FLW_SECRET_KEY");
    if (!secretKey) {
      console.error("Missing FLW_SECRET_KEY");
      return new Response("Server error", { status: 500 });
    }

    const verifyUrl = `https://api.flutterwave.com/v3/transactions/${flwTransactionId}/verify`;
    const verifyRes = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const verifyJson = await verifyRes.json();

    if (!verifyRes.ok || verifyJson?.data?.status !== "successful") {
      console.warn("Verification failed", verifyJson);
      return new Response("OK", { status: 200 });
    }

    const txn = verifyJson.data;
    const txRef = txn.tx_ref;
    console.log("Verified tx_ref:", txRef, "Amount:", txn.amount);

    // 6. Match pending payment
    const { data: pending } = await supabase
      .from("pending_payments")
      .select("user_id, email, payment_type")
      .eq("reference", txRef)
      .maybeSingle();

    if (!pending) {
      console.log("No pending payment found for", txRef);
      return new Response("OK", { status: 200 });
    }

    // 7. Amount check
    const expected = PRODUCT_AMOUNTS[pending.payment_type as PaymentType];
    if (Math.abs(txn.amount - expected) > 0.01) {
      console.warn("Amount mismatch – expected", expected, "got", txn.amount);
      return new Response("OK", { status: 200 });
    }

    // 8. Grant access
    await grantUserAccess(pending.user_id, pending.email, pending.payment_type as PaymentType);
    console.log("Access granted for", pending.user_id);

    // 9. Record processed and clean up
    await supabase.from("processed_webhooks").insert({
      trans_ref: String(flwTransactionId),
      product_type: pending.payment_type,
      user_id: pending.user_id,
    });
    await supabase.from("pending_payments").delete().eq("reference", txRef);

    console.log("Webhook completed successfully");
    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error("Webhook error:", error?.message, error?.stack);
    return new Response("Error", { status: 500 });
  }
});