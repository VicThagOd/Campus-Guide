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

function buildReference(paymentType: "pdf" | "cbt"): string {
  return `cg_${paymentType}_${Date.now()}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    const publicKey = Deno.env.get("KORAPAY_PUBLIC_KEY");
    const secretKey = Deno.env.get("KORAPAY_SECRET_KEY");
    const publicBaseUrl = Deno.env.get("PUBLIC_SITE_URL");

    if (!publicKey || !secretKey || !publicBaseUrl) {
      return new Response("Korapay payment environment is not configured.", {
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
    const redirectUrl = `${publicBaseUrl.replace(/\/$/, "")}/payment/confirm?product=${paymentType}&reference=${reference}`;

    const initializeRes = await fetch("https://api.korapay.com/merchant/api/v1/charges/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: "NGN",
        reference,
        redirect_url: redirectUrl,
        customer: {
          email,
          name,
        },
        metadata: {
          productType: paymentType,
          userId,
          course,
        },
      }),
    });

    const initializeJson = await initializeRes.json();
    const checkoutUrl = initializeJson?.data?.checkout_url;

    if (!initializeRes.ok || !checkoutUrl) {
      console.error("Korapay initialize error", initializeJson);
      return new Response("Could not initialize Korapay payment.", {
        status: 502,
        headers: CORS_HEADERS,
      });
    }

    return Response.json({ checkoutUrl, reference }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error(error);
    return new Response("Payment initialization failed.", { status: 500, headers: CORS_HEADERS });
  }
});