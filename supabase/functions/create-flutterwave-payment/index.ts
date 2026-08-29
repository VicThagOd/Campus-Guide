// supabase/functions/create-flutterwave-payment/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRODUCT_AMOUNTS = {
  pdf: 2010.75,
  cbt: 2010.75,
} as const;

interface CreatePaymentPayload {
  amount: number;
  paymentType: "pdf" | "cbt" | "ticket" | "inspection";
  userId: string;
  email: string;
  name: string;
  course: string;
  eventId?: string;
  tierName?: string;
  ticketPrice?: number;
  accommodationId?: string;
  whatsappNumber?: string;
}

// Build a unique tx_ref for Flutterwave
function buildTxRef(paymentType: string): string {
  return `cg_${paymentType}_${Date.now()}`;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    const secretKey = Deno.env.get("FLW_SECRET_KEY");
    const publicBaseUrl = Deno.env.get("PUBLIC_SITE_URL");

    if (!secretKey || !publicBaseUrl) {
      return new Response("Flutterwave payment environment is not configured.", {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    const payload = (await req.json()) as CreatePaymentPayload;
    const { amount, paymentType, userId, email, name, course, eventId, tierName, ticketPrice, accommodationId, whatsappNumber } = payload;

    if (!userId || !email || !name || !course) {
      return new Response("Missing required payment fields.", { status: 400, headers: CORS_HEADERS });
    }

    // Verify amount based on product type
    let basePrice = 0;
    if (paymentType === "cbt" || paymentType === "pdf") {
      basePrice = paymentType === "cbt" ? 2000 : 1500;
    } else if (paymentType === "inspection") {
      basePrice = 5000;
      if (!accommodationId || !whatsappNumber) {
        return new Response("Missing accommodation inspection details.", { status: 400, headers: CORS_HEADERS });
      }
    } else if (paymentType === "ticket") {
      if (!eventId || !whatsappNumber) {
        return new Response("Missing event ticket details.", { status: 400, headers: CORS_HEADERS });
      }
      // Fetch ticket price from the database
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("ticket_price")
        .eq("id", eventId)
        .single();

      if (eventError || !event) {
        return new Response("Event details not found.", { status: 400, headers: CORS_HEADERS });
      }
      basePrice = Number(event.ticket_price) || 0;
      if (ticketPrice && Number(ticketPrice) > 0) {
        basePrice = Number(ticketPrice);
      }
    } else {
      return new Response("Invalid payment type.", { status: 400, headers: CORS_HEADERS });
    }

    // Calculate Flutterwave processing fee (1.4% for local transactions)
    const flwFee = basePrice * 0.014;
    const expectedAmount = basePrice + flwFee;

    // Verify amount is within a reasonable difference (allowing minor rounding differences)
    if (Math.abs(amount - expectedAmount) > 5.0) {
      return new Response(`Payment amount does not match the product cost (expected: ₦${expectedAmount.toFixed(2)}).`, {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const txRef = buildTxRef(paymentType);
    const redirectUrl = `${publicBaseUrl.replace(/\/$/, "")}/payment/confirm?product=${paymentType}`;

    // Save pending payment record (with metadata JSONB for ticket/inspection parameter pass)
    const { error: pendingError } = await supabase.from("pending_payments").insert({
      reference: txRef,
      user_id: userId,
      email,
      payment_type: paymentType,
        metadata: {
          eventId,
          tierName,
          ticketPrice,
          accommodationId,
          whatsappNumber,
          basePrice,
        },
    });

    if (pendingError) {
      console.error("Failed to save pending payment", pendingError);
      return new Response("Could not initialize payment.", { status: 500, headers: CORS_HEADERS });
    }

    // ----- FLUTTERWAVE STANDARD INITIALIZATION -----
    const flwResponse = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: amount,
        currency: "NGN",
        redirect_url: redirectUrl,
        customer: {
          email,
          name,
        },
        customizations: {
          title:
            paymentType === "pdf"
              ? "Past Questions PDF"
              : paymentType === "cbt"
              ? "CBT Access"
              : paymentType === "inspection"
              ? "Hostel Inspection"
              : "Event Ticket Purchase",
          description:
            paymentType === "pdf"
              ? "Past Questions PDF access"
              : paymentType === "cbt"
              ? "30-day live CBT access"
              : paymentType === "inspection"
              ? "Hostel Inspection fee payment"
              : "Event gate pass ticket",
        },
        meta: {
          userId,
          course,
          paymentType,
          eventId,
          tierName,
          ticketPrice,
          accommodationId,
        },
      }),
    });

    const flwJson = await flwResponse.json();
    const checkoutUrl = flwJson?.data?.link;

    if (!flwResponse.ok || !checkoutUrl) {
      console.error("Flutterwave initialize error", flwJson);
      // Clean up pending payment
      await supabase.from("pending_payments").delete().eq("reference", txRef);
      return new Response("Could not initialize Flutterwave payment.", { status: 502, headers: CORS_HEADERS });
    }

    return Response.json({ checkoutUrl, reference: txRef }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error(error);
    return new Response("Payment initialization failed.", { status: 500, headers: CORS_HEADERS });
  }
});
