import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.177.0/encoding/hex.ts";

const PRODUCT_AMOUNTS = {
  pdf: 2010.75,
  cbt: 2010.75,
} as const;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function sha512(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-512", data);
  return new TextDecoder().decode(encode(new Uint8Array(hash)));
}

function parseReference(reference: string): { paymentType: "pdf" | "cbt"; userId: string } | null {
  const match = /^cg_(pdf|cbt)_([a-zA-Z0-9-]+)_\d+$/.exec(reference);
  if (!match) return null;

  return {
    paymentType: match[1] as "pdf" | "cbt",
    userId: match[2],
  };
}

function amountMatches(paymentType: "pdf" | "cbt", rawAmount: unknown): boolean {
  const amount = Number(rawAmount);

  if (!Number.isFinite(amount)) return false;

  const expectedMinor = Math.round(PRODUCT_AMOUNTS[paymentType] * 100);
  const roundedAmount = Math.round(amount);

  if (roundedAmount === expectedMinor) return true;

  return Math.abs(amount - PRODUCT_AMOUNTS[paymentType]) < 0.001;
}

async function grantUserAccess(params: {
  userId: string;
  email: string;
  paymentType: "pdf" | "cbt";
}) {
  const now = new Date();
  const expiresAt =
    params.paymentType === "cbt"
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { data: existing } = await supabase
    .from("user_access")
    .select("pdf_access, cbt_access, cbt_expires_at")
    .eq("user_id", params.userId)
    .maybeSingle();

  const payload = {
    user_id: params.userId,
    email: params.email,
    pdf_access: params.paymentType === "pdf" ? true : existing?.pdf_access ?? false,
    cbt_access: params.paymentType === "cbt" ? true : existing?.cbt_access ?? false,
    cbt_expires_at: params.paymentType === "cbt" ? expiresAt : existing?.cbt_expires_at ?? null,
    updated_at: now.toISOString(),
  };

  const { error } = await supabase.from("user_access").upsert([payload], { onConflict: "user_id" });

  if (error) {
    throw error;
  }

  return expiresAt;
}

Deno.serve(async (req) => {
  try {
    const credoBaseUrl = Deno.env.get("CREDO_BASE_URL") ?? "https://api.credocentral.com";
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const { event, data } = body;

    const signature = req.headers.get("x-credo-signature") ?? "";
    const secretKey = Deno.env.get("CREDO_WEBHOOK_TOKEN") ?? "";
    const businessCode = data?.businessCode ?? "";
    const expected = await sha512(secretKey + businessCode);

    if (!signature || signature !== expected) {
      return new Response("Invalid signature", { status: 401 });
    }

    if (event !== "transaction.successful" || data?.status !== 0) {
      return new Response("OK", { status: 200 });
    }

    const transRef = data?.transRef;

    if (!transRef) {
      return new Response("Missing reference", { status: 400 });
    }

    const { data: existing } = await supabase
      .from("processed_webhooks")
      .select("trans_ref")
      .eq("trans_ref", transRef)
      .maybeSingle();

    if (existing) {
      return new Response("OK", { status: 200 });
    }

    const verifyRes = await fetch(`${credoBaseUrl}/transaction/${transRef}/verify`, {
      headers: { Authorization: Deno.env.get("CREDO_SECRET_KEY") ?? "" },
    });
    const verifyJson = await verifyRes.json();
    const txn = verifyJson?.data;

    if (!verifyRes.ok || !txn || txn.status !== 0) {
      console.error("Credo verify failed", verifyJson);
      return new Response("Unverified", { status: 200 });
    }

    const parsed = parseReference(transRef);

    if (!parsed) {
      return new Response("Unknown reference", { status: 200 });
    }

    if (!amountMatches(parsed.paymentType, txn.transAmount)) {
      console.error("Credo amount mismatch", { expectedType: parsed.paymentType, amount: txn.transAmount });
      return new Response("Amount mismatch", { status: 200 });
    }

    const customerEmail =
      txn.customer?.customerEmail ??
      data?.customer?.customerEmail ??
      txn.email ??
      data?.customerId;

    if (!customerEmail) {
      return new Response("Missing customer email", { status: 200 });
    }

    const expiresAt = await grantUserAccess({
      userId: parsed.userId,
      email: customerEmail,
      paymentType: parsed.paymentType,
    });

    const { error: webhookInsertError } = await supabase
      .from("processed_webhooks")
      .insert({ trans_ref: transRef, product_type: parsed.paymentType, user_id: parsed.userId });

    if (webhookInsertError) {
      throw webhookInsertError;
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (resendKey) {
      const emailHtml = `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
          <h2 style="color:#2F4EA2">Campus Guide Payment Confirmed</h2>
          <p>Your payment has been confirmed and your access is now active.</p>
          <div style="background:#f4f4f4;padding:16px;border-radius:8px;margin:24px 0">
            <p style="font-weight:700;color:#2F4EA2;margin:0 0 8px 0;">
              ${parsed.paymentType === "pdf" ? "Past Questions PDF" : "Live CBT Access"}
            </p>
            ${
              parsed.paymentType === "cbt" && expiresAt
                ? `<p style="margin:0;color:#555;">Access expires on ${new Date(expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.</p>`
                : `<p style="margin:0;color:#555;">You can return to your dashboard and use your access immediately.</p>`
            }
          </div>
          <p style="color:#888;font-size:0.875rem">Need help? WhatsApp: ${Deno.env.get("WHATSAPP_NUMBER") ?? ""}</p>
        </div>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Campus Guide <onboarding@resend.dev>",
          to: customerEmail,
          subject: "Your Campus Guide Access Is Active",
          html: emailHtml,
        }),
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
});
