// supabase/functions/send-approval-email/index.ts
// This function is called by the admin site after approving a receipt.
// It sends a confirmation email to the student via Resend.

Deno.serve(async (req) => {
  try {
    const { email, name, paymentType, cbtExpiresAt } = await req.json();

    if (!email || !name || !paymentType) {
      return new Response("Missing fields", { status: 400 });
    }

    const isPdf = paymentType === "pdf";

    const emailHtml = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#2F4EA2">Campus Guide — Access Approved!</h2>
        <p>Hi ${name},</p>
        <p>Your payment has been verified and your access has been unlocked.</p>
        <div style="background:#f4f4f4;padding:16px;border-radius:8px;margin:24px 0;text-align:center">
          <p style="font-size:1.25rem;font-weight:700;color:#2F4EA2;margin:0">
            ${isPdf ? "Past Questions (PDF) — Permanent Access" : "Live CBT Tests — Monthly Access"}
          </p>
          ${!isPdf && cbtExpiresAt
            ? `<p style="color:#666;margin-top:8px;font-size:0.875rem">
                Access expires: ${new Date(cbtExpiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
               </p>`
            : ""
          }
        </div>
        <p>Log in to Campus Guide and your access will be active immediately.</p>
        <p style="color:#888;font-size:0.875rem">
          Need help? WhatsApp: ${Deno.env.get("WHATSAPP_NUMBER")}
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Campus Guide <onboarding@resend.dev>",
        to: email,
        subject: "Your Campus Guide Access is Now Active!",
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response("Email failed", { status: 500 });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Error", { status: 500 });
  }
});