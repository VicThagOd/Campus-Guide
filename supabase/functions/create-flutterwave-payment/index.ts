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
  paymentType: "pdf" | "cbt";
  userId: string;
  email: string;
  name: string;
  course: string;
}

// Build a unique tx_ref for Flutterwave
function buildTxRef(paymentType: "pdf" | "cbt"): string {
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
    const { amount, paymentType, userId, email, name, course } = payload;

    if (!userId || !email || !name || !course || (paymentType !== "pdf" && paymentType !== "cbt")) {
      return new Response("Missing required payment fields.", { status: 400, headers: CORS_HEADERS });
    }

    const expectedAmount = PRODUCT_AMOUNTS[paymentType];
    if (Math.round(amount * 100) !== Math.round(expectedAmount * 100)) {
      return new Response("Payment amount does not match the selected product.", {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const txRef = buildTxRef(paymentType);
    // Flutterwave appends ?tx_ref=...&transaction_id=...&status=... to redirect_url
    const redirectUrl = `${publicBaseUrl.replace(/\/$/, "")}/payment/confirm?product=${paymentType}`;

    // Save pending payment record (used by webhook to link userId)
    const { error: pendingError } = await supabase.from("pending_payments").insert({
      reference: txRef,
      user_id: userId,
      email,
      payment_type: paymentType,
    });
    if (pendingError) {
      console.error("Failed to save pending payment", pendingError);
      return new Response("Could not initialize payment.", { status: 500, headers: CORS_HEADERS });
    }

    // ----- FLUTTERWAVE STANDARD INITIALIZATION -----
    // Docs: https://developer.flutterwave.com/docs/collecting-payments/standard
    const flwResponse = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: amount,           // Flutterwave takes the amount in full Naira (not kobo)
        currency: "NGN",
        redirect_url: redirectUrl,
        customer: {
          email,
          name,
        },
        customizations: {
          title: paymentType === "pdf" ? "Past Questions PDF" : "CBT Access",
          description: paymentType === "pdf"
            ? "Past Questions PDF access"
            : "30-day live CBT access",
        },
        meta: {
          userId,
          course,
          paymentType,
        },
      }),
    });

    const flwJson = await flwResponse.json();
    // Flutterwave returns: { status: "success", data: { link: "https://checkout.flutterwave.com/..." } }
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
