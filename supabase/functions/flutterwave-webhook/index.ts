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

async function sendPushAlertNotification(title: string, message: string, url = "https://campusguide.ng") {
  const apiKey = Deno.env.get("PUSHALERT_API_KEY");
  if (!apiKey) {
    console.warn("PushAlert API key not configured in Edge Function secrets.");
    return;
  }
  try {
    const cleanTitle = title.trim().slice(0, 64);
    const cleanMessage = message.trim().slice(0, 192);

    const formData = new URLSearchParams();
    formData.append("title", cleanTitle);
    formData.append("message", cleanMessage);
    formData.append("url", url);
    formData.append("icon", "https://campusguide.ng/icon-192x192.png");

    const res = await fetch("https://api.pushalert.co/rest/v1/send", {
      method: "POST",
      headers: {
        "Authorization": `api_key=${apiKey}`,
        "api_key": apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });
    if (!res.ok) {
      console.error("PushAlert notification dispatch failed:", await res.text());
    } else {
      const data = await res.json().catch(() => null);
      console.log("PushAlert notification dispatched successfully:", data);
    }
  } catch (err) {
    console.error("PushAlert alert dispatch error:", err);
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
      // Grant CBT/PDF access
      const accessUserId = (pending.user_id && pending.user_id !== "00000000-0000-0000-0000-000000000000" && pending.user_id !== "anonymous_user")
        ? pending.user_id
        : null;

      if (accessUserId) {
        await grantUserAccess(accessUserId, pending.email, pending.payment_type);
      } else {
        const { data: profile } = await supabase.from("profiles").select("id").eq("email", pending.email).maybeSingle();
        if (profile?.id) {
          await grantUserAccess(profile.id, pending.email, pending.payment_type);
        }
      }
      console.log(`Access granted to ${pending.payment_type} for user: ${pending.user_id}`);
      
      // Send Telegram notification
      await sendTelegramAlert(
        `🔔 <b>New Access Granted</b>\n- Type: ${pending.payment_type === "cbt" ? "CBT practice keys" : "PDF Past Questions"}\n- User: ${pending.email}\n- Amount: ₦${txn.amount}`
      );

    } else if (pending.payment_type === "inspection") {
      const inspectionUserId = (!pending.user_id || pending.user_id === "anonymous_user" || pending.user_id === "00000000-0000-0000-0000-000000000000") ? null : pending.user_id;

      // Insert verified hostel inspection fee payment
      const { error: insError } = await supabase.from("inspection_payments").insert({
        user_id: inspectionUserId,
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

      // Send PushAlert notification to Admin subscribers
      await sendPushAlertNotification(
        "🏠 New Accommodation Inspection Paid!",
        `A student paid ₦${txn.amount} for hostel inspection (${metadata.whatsappNumber || pending.email}). Open dashboard to review.`
      );

    } else if (pending.payment_type === "ticket" || pending.payment_type === "tier") {
      const receiptNumber = createReceiptNumber();
      const purchaserUserId = (!pending.user_id || pending.user_id === "anonymous_user" || pending.user_id === "00000000-0000-0000-0000-000000000000") ? null : pending.user_id;
      const purchaserName = txn.customer?.name || pending.email;
      const purchaserEmail = pending.email;
      const ticketRows: any[] = [];

      if (metadata.items && Array.isArray(metadata.items) && metadata.items.length > 0) {
        for (const item of metadata.items) {
          const qty = Number(item.quantity) || 1;
          const tierPrice = Number(item.tierPrice) || 0;
          const tierName = String(item.tierName || "Regular");

          for (let i = 0; i < qty; i++) {
            ticketRows.push({
              event_id: metadata.eventId,
              user_id: purchaserUserId,
              tier_name: tierName,
              tier_price: tierPrice,
              ticket_code: createTicketCode(),
              payment_reference: String(flwTransactionId),
              whatsapp_number: metadata.whatsappNumber || '',
              checked_in: false,
              receipt_number: receiptNumber,
              purchaser_name: purchaserName,
              purchaser_email: purchaserEmail,
            });
          }
        }
      } else {
        const tierName = String(metadata.tierName || "Regular");
        const ticketPrice = Number(metadata.ticketPrice || metadata.basePrice || txn.amount);
        ticketRows.push({
          event_id: metadata.eventId,
          user_id: purchaserUserId,
          tier_name: tierName,
          tier_price: ticketPrice,
          ticket_code: createTicketCode(),
          payment_reference: String(flwTransactionId),
          whatsapp_number: metadata.whatsappNumber || '',
          checked_in: false,
          receipt_number: receiptNumber,
          purchaser_name: purchaserName,
          purchaser_email: purchaserEmail,
        });
      }

      // Insert purchased tickets
      const { error: ticketError } = await supabase.from("event_tickets").insert(ticketRows);

      if (ticketError) throw ticketError;
      console.log(`Created ${ticketRows.length} event ticket(s) under receipt ${receiptNumber}`);

      const ticketCodesList = ticketRows.map((t) => t.ticket_code).join(", ");
      // Send Telegram notification to admin/organizers
      await sendTelegramAlert(
        `🎫 <b>New Event Ticket(s) Purchased</b>\n- Qty: ${ticketRows.length}\n- Receipt: <code>${receiptNumber}</code>\n- Codes: <code>${ticketCodesList}</code>\n- Student: ${purchaserEmail} (${purchaserName})\n- Amount: ₦${txn.amount}`
      );
    } else if (pending.payment_type === "pageant") {
      const contestantId = metadata.contestantId;
      if (contestantId) {
        const { error: pageantErr } = await supabase
          .from("pageant_contestants")
          .update({
            payment_status: "completed",
            payment_reference: String(flwTransactionId),
          })
          .eq("id", contestantId);

        if (pageantErr) {
          console.error("Failed to update contestant payment status:", pageantErr);
        } else {
          console.log("Contestant payment completed successfully for id:", contestantId);
        }
      }

      await sendTelegramAlert(
        `👑 <b>New Pageant Contestant Registered & Paid</b>\n- Email: ${pending.email}\n- Amount: ₦${txn.amount}\n- Contestant ID: ${contestantId || "N/A"}`
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
