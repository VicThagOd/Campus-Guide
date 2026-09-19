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

interface TicketItem {
  tierName: string;
  tierPrice: number;
  quantity: number;
  tierId?: string;
}

interface CreatePaymentPayload {
  amount: number;
  paymentType: "pdf" | "cbt" | "ticket" | "inspection" | "tier" | "pageant";
  userId?: string;
  email: string;
  name: string;
  course?: string;
  eventId?: string;
  tierId?: string;
  tierName?: string;
  ticketPrice?: number;
  items?: TicketItem[];
  accommodationId?: string;
  whatsappNumber?: string;
  contestantId?: string;
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
    const publicBaseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://campusguide.ng";

    if (!secretKey) {
      return new Response("Flutterwave payment environment is not configured.", {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    const payload = (await req.json()) as CreatePaymentPayload;
    const {
      amount,
      paymentType,
      email,
      name,
      eventId,
      tierId,
      tierName,
      ticketPrice,
      items,
      accommodationId,
      whatsappNumber,
      contestantId,
    } = payload;

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const userId = (payload.userId && UUID_REGEX.test(payload.userId))
      ? payload.userId
      : "00000000-0000-0000-0000-000000000000";
    const course = payload.course || "General";

    if (!email || !name) {
      return new Response("Missing required payment fields (email, name).", { status: 400, headers: CORS_HEADERS });
    }

    // Verify amount based on product type
    let basePrice = 0;
    if (paymentType === "cbt" || paymentType === "pdf") {
      basePrice = 2000;
    } else if (paymentType === "inspection") {
      basePrice = 5000;
      if (!accommodationId || !whatsappNumber) {
        return new Response("Missing accommodation inspection details.", { status: 400, headers: CORS_HEADERS });
      }
    } else if (paymentType === "pageant") {
      basePrice = 1000;
    } else if (paymentType === "ticket") {
      if (!eventId) {
        return new Response("Missing event ticket details.", { status: 400, headers: CORS_HEADERS });
      }
      
      if (items && Array.isArray(items) && items.length > 0) {
        basePrice = items.reduce((sum, it) => sum + ((Number(it.tierPrice) || 0) * (Number(it.quantity) || 1)), 0);
      } else if (tierName) {
        // Fetch tier price from the database
        const { data: tier, error: tierError } = await supabase
          .from("event_tiers")
          .select("tier_price")
          .eq("event_id", eventId)
          .eq("tier_name", tierName)
          .single();

        if (tierError || !tier) {
          return new Response("Event tier details not found.", { status: 400, headers: CORS_HEADERS });
        }
        basePrice = Number(tier.tier_price) || 0;
      } else {
        // Fetch standard ticket price from the events table
        const { data: event, error: eventError } = await supabase
          .from("events")
          .select("ticket_price")
          .eq("id", eventId)
          .single();

        if (eventError || !event) {
          return new Response("Event details not found.", { status: 400, headers: CORS_HEADERS });
        }
        basePrice = Number(event.ticket_price) || 0;
      }
    } else if (paymentType === "tier") {
      if (!eventId || !tierName || !whatsappNumber) {
        return new Response("Missing event tier ticket details.", { status: 400, headers: CORS_HEADERS });
      }
      // Fetch tier price from the database
      const { data: tier, error: tierError } = await supabase
        .from("event_tiers")
        .select("tier_price")
        .eq("event_id", eventId)
        .eq("tier_name", tierName)
        .single();

      if (tierError || !tier) {
        return new Response("Event tier details not found.", { status: 400, headers: CORS_HEADERS });
      }
      basePrice = Number(tier.tier_price) || 0;
    } else {
      return new Response("Invalid payment type.", { status: 400, headers: CORS_HEADERS });
    }

    // Calculate Flutterwave processing fee (1.4% for local transactions)
    const flwFee = basePrice * 0.014;
    const expectedAmount = paymentType === "pageant" ? 1000 : (basePrice + flwFee);

    // Verify amount is within a reasonable difference (allowing minor rounding differences, card fees, or flat price)
    if (paymentType === "pageant") {
      if (Math.abs(amount - 1000) > 50.0 && Math.abs(amount - 1014) > 50.0) {
        return new Response(`Pageant payment amount mismatch. Expected ₦1,000.`, {
          status: 400,
          headers: CORS_HEADERS,
        });
      }
    } else if (paymentType === "cbt" || paymentType === "pdf") {
      if (amount < 1950 || amount > 2100) {
        return new Response(`Payment amount does not match the product cost (expected: ₦${expectedAmount.toFixed(2)}).`, {
          status: 400,
          headers: CORS_HEADERS,
        });
      }
    } else if (paymentType === "inspection") {
      if (amount < 4900 || amount > 5200) {
        return new Response(`Payment amount mismatch for accommodation inspection. Expected ₦5,000.`, {
          status: 400,
          headers: CORS_HEADERS,
        });
      }
    } else {
      if (Math.abs(amount - expectedAmount) > 100.0 && Math.abs(amount - basePrice) > 100.0) {
        return new Response(`Payment amount does not match the product cost (expected: ₦${expectedAmount.toFixed(2)}).`, {
          status: 400,
          headers: CORS_HEADERS,
        });
      }
    }

    const txRef = buildTxRef(paymentType);
    const redirectUrl = `${publicBaseUrl.replace(/\/$/, "")}/payment/confirm?product=${paymentType}`;

    // Save pending payment record (with metadata JSONB for ticket/inspection/pageant parameter pass)
    const { error: pendingError } = await supabase.from("pending_payments").insert({
      reference: txRef,
      user_id: userId,
      email,
      payment_type: paymentType,
      metadata: {
        eventId,
        tierId,
        tierName,
        ticketPrice: basePrice,
        items,
        accommodationId,
        whatsappNumber,
        contestantId,
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
              : paymentType === "pageant"
              ? "Pageant Registration"
              : "Event Ticket Purchase",
          description:
            paymentType === "pdf"
              ? "Past Questions PDF access"
              : paymentType === "cbt"
              ? "30-day live CBT access"
              : paymentType === "inspection"
              ? "Hostel Inspection fee payment"
              : paymentType === "pageant"
              ? "Mr & Mrs Campus Guide Contestant Fee"
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
          contestantId,
        },
      }),
    });

    const flwJson = await flwResponse.json();
    const checkoutUrl = flwJson?.data?.link;

    if (!flwResponse.ok || !checkoutUrl) {
      console.error("Flutterwave initialize error", flwJson);
      // Clean up pending payment
      await supabase.from("pending_payments").delete().eq("reference", txRef);
      const errMsg = flwJson?.message || "Could not initialize Flutterwave payment.";
      return new Response(errMsg, { status: 502, headers: CORS_HEADERS });
    }

    return Response.json({ checkoutUrl, reference: txRef }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error("Payment initialization exception:", error);
    return new Response(error?.message || "Payment initialization failed.", { status: 500, headers: CORS_HEADERS });
  }
});
