// supabase/functions/credo-webhook/index.ts
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
    // Credo may send raw body; we'll parse JSON
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // --- Optional signature verification ---
    // If Credo provides a signature header, add it here.
    // For now, we rely on the verification call below.
    const secretKey = Deno.env.get("CREDO_SECRET_KEY")!;

    // --- Identify event ---
    // Credo's webhook payload structure unknown. Common pattern:
    // { event: "charge.success", data: { transRef, status, amount, ... } }
    // Adjust this based on actual webhook from Credo.
    const event = body.event;
    const data = body.data;

    if (event !== "charge.success" || data?.status !== "success") {
      // Not a successful payment event – ignore
      return new Response("OK", { status: 200 });
    }

    const credoTransRef = data.transRef; // e.g., vs_xxxxxx
    if (!credoTransRef) {
      return new Response("Missing transRef", { status: 400 });
    }

    // Idempotency check using our own reference
    const { data: processed } = await supabase
      .from("processed_webhooks")
      .select("trans_ref")
      .eq("trans_ref", credoTransRef)
      .maybeSingle();
    if (processed) return new Response("OK", { status: 200 });

    // --- Verify with Credo API (critical) ---
    const verifyUrl = `https://api.credocentral.com/transaction/${credoTransRef}/verify`;
    const verifyRes = await fetch(verifyUrl, {
      headers: { Authorization: secretKey }, // SECRET KEY for verification
    });
    const verifyJson = await verifyRes.json();
    const txn = verifyJson?.data;

    if (!verifyRes.ok || txn?.status !== 0) {
      console.error("Credo verification failed", verifyJson);
      return new Response("OK", { status: 200 });
    }

    // Extract our business reference from metadata or from pending_payments table
    const businessRef = txn.businessRef; // This is the reference we sent
    if (!businessRef) {
      console.error("No businessRef in transaction");
      return new Response("OK", { status: 200 });
    }

    // Look up pending payment by our reference
    const { data: pending } = await supabase
      .from("pending_payments")
      .select("user_id, email, payment_type")
      .eq("reference", businessRef)
      .maybeSingle();

    if (!pending) {
      console.error("No pending payment found for reference", businessRef);
      return new Response("OK", { status: 200 });
    }

    const userId = pending.user_id;
    const customerEmail = pending.email;
    const paymentType = pending.payment_type as PaymentType;

    // Verify amount (txn.transAmount is in kobo, we convert to Naira)
    const paidAmountNaira = txn.transAmount / 100;
    if (Math.abs(paidAmountNaira - PRODUCT_AMOUNTS[paymentType]) > 0.01) {
      console.error("Amount mismatch", { expected: PRODUCT_AMOUNTS[paymentType], got: paidAmountNaira });
      return new Response("OK", { status: 200 });
    }

    // Grant access
    const expiresAt = await grantUserAccess(userId, customerEmail, paymentType);

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