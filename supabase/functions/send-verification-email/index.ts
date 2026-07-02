import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, name, portal, confirmationUrl } = await req.json();

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const portalLabel = portal === "agent"
      ? "Agent Portal"
      : portal === "rider"
      ? "Rider Portal"
      : portal === "business"
      ? "Business Portal"
      : "Individual Portal";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td>
      <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:100%">
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f,#0f2540);padding:28px 32px">
            <p style="margin:0;color:#f97316;font-size:22px;font-weight:700">Danhausa Logistics</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Email Verification — ${portalLabel}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 8px;color:#334155;font-size:15px">Hi ${name},</p>
            <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6">
              Thank you for registering on the Danhausa Logistics ${portalLabel}. Please verify your email address to activate your account.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
              <tr>
                <td style="background:linear-gradient(135deg,#f97316,#ef4444);border-radius:10px;padding:14px 32px">
                  <a href="${confirmationUrl}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:700">
                    Verify My Email Address
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.6">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 24px;color:#f97316;font-size:12px;word-break:break-all">${confirmationUrl}</p>
            <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px">
              <p style="margin:0;color:#92400e;font-size:13px">
                This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0">
            <p style="margin:0;color:#94a3b8;font-size:11px">
              &copy; 2026 Danhausa Logistics &amp; Marketplace &middot; Nigeria
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Danhausa Logistics <notifications@danhausalogistics.com>",
        to: [{ email, name }],
        subject: `Verify your email — Danhausa ${portalLabel}`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(
        JSON.stringify({ error: data.message ?? `Resend error ${res.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-verification-email error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
