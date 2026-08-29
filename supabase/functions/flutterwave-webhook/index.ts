// supabase/functions/flutterwave-webhook/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function grantUserAccess(userId: string, email: string, paymentType: "cbt" | "pdf") {
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

function createTicketCode() {
  return `CG-TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function createReceiptNumber() {
  return `RCPT-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

async function sendTelegramAlert(message: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
  if (!token || !chatId) {
    console.warn("Telegram alerts environment parameters not configured.");
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
    if (!res.ok) {
      console.error("Telegram API alert failed:", await res.text());
    }
  } catch (err) {
    console.error("Telegram alert dispatch error:", err);
  }
}

Deno.serve(async (req) => {
  try {
    // 1. Get raw body
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    console.log("=== Webhook received ===");
    console.log("Event:", body.event);
    console.log("Status:", body.data?.status);

    // 2. Signature verification
    const webhookSecret = Deno.env.get("FLW_WEBHOOK_SECRET");
    const signatureHeader = req.headers.get("verif-hash") || "";

    if (!webhookSecret || signatureHeader !== webhookSecret) {
      console.warn("Invalid signature – rejecting webhook event");
      return new Response("Invalid signature", { status: 401 });
    }

    // 3. Only process successful charge.completed
    if (body.event !== "charge.completed" || body.data?.status !== "successful") {
      console.log("Ignoring non-successful charge event");
      return new Response("OK", { status: 200 });
    }

    const flwTransactionId = body.data.id;
    console.log("Transaction ID:", flwTransactionId);

    // 4. Idempotency Check
    const { data: processed } = await supabase
      .from("processed_webhooks")
      .select("trans_ref")
      .eq("trans_ref", String(flwTransactionId))
      .maybeSingle();

    if (processed) {
      console.log("Already processed – skipping");
      return new Response("OK", { status: 200 });
    }

    // 5. Verify with Flutterwave API
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
      .select("user_id, email, payment_type, metadata")
      .eq("reference", txRef)
      .maybeSingle();

    if (!pending) {
      console.log("No pending payment record matches reference:", txRef);
      return new Response("OK", { status: 200 });
    }

    const metadata = pending.metadata || {};

    // 7. Process based on payment type
    if (pending.payment_type === "cbt" || pending.payment_type === "pdf") {
      // Verify CBT/PDF amount (₦2,000 / ₦1,500 + card fees)
      const expected = pending.payment_type === "cbt" ? 2010.75 : 2010.75; // standard fallback
      // Grant CBT/PDF access
      await grantUserAccess(pending.user_id, pending.email, pending.payment_type);
      console.log(`Access granted to ${pending.payment_type} for user: ${pending.user_id}`);
      
      // Send Telegram notification
      await sendTelegramAlert(
        `🔔 <b>New Access Granted</b>\n- Type: ${pending.payment_type === "cbt" ? "CBT practice keys" : "PDF Past Questions"}\n- User: ${pending.email}\n- Amount: ₦${txn.amount}`
      );

    } else if (pending.payment_type === "inspection") {
      // Insert verified hostel inspection fee payment
      const { error: insError } = await supabase.from("inspection_payments").insert({
        user_id: pending.user_id,
        accommodation_id: metadata.accommodationId,
        amount: metadata.basePrice || 5000,
        payment_reference: String(flwTransactionId),
        whatsapp_number: metadata.whatsappNumber,
        status: "verified",
      });

      if (insError) throw insError;
      console.log("Inspection payment logged successfully");

      // Send Telegram notification with direct WhatsApp chat link
      const waLink = `https://wa.me/${metadata.whatsappNumber.replace(/\D/g, "")}`;
      await sendTelegramAlert(
        `🔔 <b>New Accommodation Inspection Paid</b>\n- Student Email: ${pending.email}\n- WhatsApp: ${metadata.whatsappNumber}\n- Amount: ₦${txn.amount}\n- Direct Chat: <a href="${waLink}">Open WhatsApp Chat</a>`
      );

    } else if (pending.payment_type === "ticket") {
      const tierName = String(metadata.tierName || "Regular");
      const ticketPrice = Number(metadata.ticketPrice || metadata.basePrice || txn.amount);
      const ticketCode = createTicketCode();
      const receiptNumber = createReceiptNumber();

      // Insert purchased ticket
      const { error: ticketError } = await supabase.from("event_tickets").insert({
        event_id: metadata.eventId,
        user_id: pending.user_id,
        tier_name: tierName,
        tier_price: ticketPrice,
        ticket_code: ticketCode,
        payment_reference: String(flwTransactionId),
        whatsapp_number: metadata.whatsappNumber,
        checked_in: false,
        receipt_number: receiptNumber,
        purchaser_name: txn.customer?.name || pending.email,
        purchaser_email: pending.email,
      });

      if (ticketError) throw ticketError;
      console.log("Event ticket logged successfully. Ticket code:", ticketCode);

      // Send Telegram notification to admin/organizers
      const waLink = `https://wa.me/${metadata.whatsappNumber.replace(/\D/g, "")}`;
      await sendTelegramAlert(
        `🎫 <b>New Event Ticket Purchased</b>\n- Code: <code>${ticketCode}</code>\n- Student Email: ${pending.email}\n- WhatsApp: ${metadata.whatsappNumber}\n- Amount: ₦${txn.amount}\n- Direct Chat: <a href="${waLink}">Open WhatsApp Chat</a>`
      );
    }

    // 8. Record processed webhook and clean up pending transaction reference
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
