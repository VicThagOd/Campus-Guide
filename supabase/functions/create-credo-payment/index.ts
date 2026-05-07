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

function buildReference(paymentType: "pdf" | "cbt", userId: string): string {
  const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-]/g, "");
  return `cg_${paymentType}_${sanitizedUserId}_${Date.now()}`;
}

function normalizeAmount(amount: number): number {
  return Math.round(amount * 100);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    const publicKey = Deno.env.get("CREDO_PUBLIC_KEY");
    const publicBaseUrl = Deno.env.get("PUBLIC_SITE_URL");
    const credoBaseUrl = Deno.env.get("CREDO_BASE_URL") ?? "https://api.credocentral.com";

    if (!publicKey || !publicBaseUrl) {
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

    if (normalizeAmount(amount) !== normalizeAmount(expectedAmount)) {
      return new Response("Payment amount does not match the selected product.", {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const reference = buildReference(paymentType, userId);
    const redirectUrl = `${publicBaseUrl.replace(/\/$/, "")}/payment/confirm?product=${paymentType}&reference=${reference}`;

    const initializeRes = await fetch(`${credoBaseUrl}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: publicKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: normalizeAmount(amount),
        currency: "NGN",
        reference,
        callbackUrl: redirectUrl,
        email,
        customerFirstName: name,
        channels: ["CARD", "BANK", "USSD", "TRANSFER"],
        bearer: 0,
        initializeAccount: 0,
        metadata: {
          productType: paymentType,
          userId,
          course,
        },
      }),
    });

    const initializeJson = await initializeRes.json();
    const checkoutUrl =
      initializeJson?.data?.authorizationUrl ??
      initializeJson?.data?.checkoutUrl ??
      initializeJson?.data?.authorization_url;

    if (!initializeRes.ok || !checkoutUrl) {
      console.error("Credo initialize error", initializeJson);
      return new Response("Could not initialize Credo payment.", {
        status: 502,
        headers: CORS_HEADERS,
      });
    }

    return Response.json(
      {
        checkoutUrl,
        reference,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error(error);
    return new Response("Payment initialization failed.", { status: 500, headers: CORS_HEADERS });
  }
});
