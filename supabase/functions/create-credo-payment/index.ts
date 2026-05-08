// supabase/functions/create-credo-payment/index.ts
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

// Build a unique reference for your system (optional – Credo can generate one)
function buildReference(paymentType: "pdf" | "cbt"): string {
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
    const publicKey = Deno.env.get("CREDO_PUBLIC_KEY");
    const secretKey = Deno.env.get("CREDO_SECRET_KEY");
    const publicBaseUrl = Deno.env.get("PUBLIC_SITE_URL");

    if (!publicKey || !secretKey || !publicBaseUrl) {
      return new Response("Credo payment environment is not configured.", {
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

    const reference = buildReference(paymentType);
    const callbackUrl = `${publicBaseUrl.replace(/\/$/, "")}/payment/confirm?product=${paymentType}&reference=${reference}`;

    // Save pending payment record (used by webhook to link userId)
    const { error: pendingError } = await supabase.from("pending_payments").insert({
      reference,
      user_id: userId,
      email,
      payment_type: paymentType,
    });
    if (pendingError) {
      console.error("Failed to save pending payment", pendingError);
      return new Response("Could not initialize payment.", { status: 500, headers: CORS_HEADERS });
    }

    // ----- CREDO INITIALIZATION -----
    const credoInitUrl = "https://api.credocentral.com/transaction/initialize";
    const credoResponse = await fetch(credoInitUrl, {
      method: "POST",
      headers: {
        "Authorization": publicKey,          // Uses PUBLIC KEY
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),    // Convert to kobo (lowest currency unit)
        email,
        currency: "NGN",
        bearer: 0,                           // Customer bears fee
        channels: ["CARD", "BANK"],          // Allow both card and bank transfer
        initializeAccount: 0,                // No virtual account
        reference,                           // Your reference
        callbackUrl,
        metadata: {
          customFields: [
            { variable_name: "userId", value: userId, display_name: "User ID" },
            { variable_name: "course", value: course, display_name: "Course" },
            { variable_name: "paymentType", value: paymentType, display_name: "Product Type" }
          ]
        }
      }),
    });

    const credoJson = await credoResponse.json();
    const checkoutUrl = credoJson?.data?.authorizationUrl;
    const credoReference = credoJson?.data?.credoReference; // e.g., vs_xxxxxx

    if (!credoResponse.ok || !checkoutUrl) {
      console.error("Credo initialize error", credoJson);
      // Clean up pending payment
      await supabase.from("pending_payments").delete().eq("reference", reference);
      return new Response("Could not initialize Credo payment.", { status: 502, headers: CORS_HEADERS });
    }

    // Store credoReference for later webhook matching (optional)
    await supabase.from("pending_payments").update({ credo_ref: credoReference }).eq("reference", reference);

    return Response.json({ checkoutUrl, reference }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error(error);
    return new Response("Payment initialization failed.", { status: 500, headers: CORS_HEADERS });
  }
});