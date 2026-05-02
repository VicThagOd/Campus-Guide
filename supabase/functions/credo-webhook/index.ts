import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.177.0/encoding/hex.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function sha512(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-512", data);
  return new TextDecoder().decode(encode(new Uint8Array(hash)));
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { event, data } = body;

    // 1. Verify signature
    const signature = req.headers.get("x-credo-signature") ?? "";
    const secretKey = Deno.env.get("CREDO_WEBHOOK_TOKEN")!;
    const businessCode = data?.businessCode ?? "";
    const expected = await sha512(secretKey + businessCode);
    if (signature !== expected) {
      return new Response("Invalid signature", { status: 401 });
    }

    // 2. Only handle successful transactions
    if (event !== "transaction.successful" || data.status !== 0) {
      return new Response("OK", { status: 200 });
    }

    // 3. Idempotency check
    const { data: existing } = await supabase
      .from("processed_webhooks")
      .select("trans_ref")
      .eq("trans_ref", data.transRef)
      .single();
    if (existing) return new Response("OK", { status: 200 });

    // 4. Verify transaction with Credo
    const verifyRes = await fetch(
      `https://api.credocentral.com/transaction/${data.transRef}/verify`,
      { headers: { Authorization: secretKey } },
    );
    const verifyJson = await verifyRes.json();
    const txn = verifyJson.data;
    if (!txn || txn.status !== 0) {
      return new Response("Unverified", { status: 200 });
    }

    // 5. Determine type from amount
    // Both PDF and CBT now cost 2010.75, use 201075 for PDF and 201076 for CBT to distinguish
    const amount = txn.transAmount;
    const type = amount === 201075 ? "pdf" : amount === 201076 ? "cbt" : null;
    if (!type) return new Response("Unknown amount", { status: 200 });

    // 6. Grab unused code
    const { data: codeRow } = await supabase
      .from("unlock_codes")
      .select("*")
      .eq("type", type)
      .eq("used", false)
      .limit(1)
      .single();

    if (!codeRow) {
      // Notify admin — codes running low
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Campus Guide <onboarding@resend.dev>",
          to: Deno.env.get("ADMIN_EMAIL"),
          subject: "⚠️ Campus Guide: Codes Running Low",
          html: `<p>No unused ${type.toUpperCase()} codes left. Add more immediately.</p>`,
        }),
      });
      return new Response("OK", { status: 200 });
    }

    // 7. Mark code as used
    const expiresAt = type === "cbt"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const customerEmail = data.customer?.customerEmail ?? data.customerId;

    await supabase
      .from("unlock_codes")
      .update({
        used: true,
        used_by_email: customerEmail,
        used_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .eq("code", codeRow.code);

    // 8. Record processed webhook
    await supabase
      .from("processed_webhooks")
      .insert({ trans_ref: data.transRef });

    // 9. Send email with code
    const emailHtml = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#2F4EA2">Campus Guide — Your Unlock Code</h2>
        <p>Thank you for your purchase! Here is your unique unlock code:</p>
        <div style="font-size:2rem;font-weight:700;letter-spacing:4px;
          background:#f4f4f4;padding:16px;border-radius:8px;text-align:center;
          color:#2F4EA2;margin:24px 0">
          ${codeRow.code}
        </div>
        ${type === "cbt"
          ? `<p>This code expires <strong>30 days from first use</strong>. You will need to purchase a new code to renew your subscription.</p>`
          : `<p>This is a <strong>one-time permanent unlock</strong>. It never expires.</p>`
        }
        <p><strong>How to use:</strong> Visit Campus Guide → click your product → enter this code to unlock access.</p>
        <p style="color:#888;font-size:0.875rem">Need help? WhatsApp: ${Deno.env.get("WHATSAPP_NUMBER")}</p>
      </div>
    `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Campus Guide <onboarding@resend.dev>",
        to: customerEmail,
        subject: "Your Campus Guide Unlock Code",
        html: emailHtml,
      }),
    });

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Error", { status: 500 });
  }
});