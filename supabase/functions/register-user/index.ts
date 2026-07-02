import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PORTAL_META: Record<string, { label: string; table: string; accentColor: string }> = {
  rider:      { label: "Rider Portal",      table: "rider_profiles",      accentColor: "#f97316" },
  agent:      { label: "Agent Portal",      table: "agent_profiles",      accentColor: "#3b82f6" },
  business:   { label: "Business Portal",   table: "business_profiles",   accentColor: "#10b981" },
  individual: { label: "Individual Portal", table: "individual_profiles", accentColor: "#6366f1" },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { portal, email, password, redirectTo, profile } = await req.json();

    const meta = PORTAL_META[portal];
    if (!meta) {
      return new Response(
        JSON.stringify({ error: "Invalid portal" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Creates the auth user and returns the real confirmation link WITHOUT
    // Supabase sending its own email — we send the branded one via Resend below.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: { redirectTo },
    });

    if (linkErr) {
      const msg = linkErr.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("unique")) {
        throw new Error("An account with this email already exists.");
      }
      throw new Error(linkErr.message);
    }

    const userId = linkData.user.id;
    const confirmationUrl = linkData.properties.action_link;

    // Insert profile — service role bypasses RLS
    const { error: profileErr } = await admin
      .from(meta.table)
      .insert({ id: userId, email, ...profile });

    if (profileErr) {
      // Rollback the auth user so the email can be reused
      await admin.auth.admin.deleteUser(userId);
      throw new Error(profileErr.message);
    }

    // Send branded confirmation email via Resend
    const displayName =
      profile.full_name || profile.contact_person || profile.company_name || email;

    const emailHtml = buildEmailHtml(displayName, meta.label, meta.accentColor, confirmationUrl);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Danhausa Logistics <notifications@danhausalogistics.com>",
        to: [email],
        subject: `Verify your email — Danhausa ${meta.label}`,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const resendData = await resendRes.json();
      console.error("Resend error (non-fatal):", resendData);
      // Registration is complete even if email delivery fails
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("register-user error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Registration failed" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildEmailHtml(
  name: string,
  portalLabel: string,
  accentColor: string,
  confirmationUrl: string
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f1f5f9">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td>
      <table width="600" align="center" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f,#0f2540);padding:32px">
            <p style="margin:0;color:${accentColor};font-size:24px;font-weight:700;letter-spacing:-0.5px">Danhausa Logistics</p>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:13px">Email Verification — ${portalLabel}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px">
            <p style="margin:0 0 8px;color:#1e293b;font-size:16px;font-weight:600">Hi ${name},</p>
            <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.7">
              Thanks for registering with Danhausa Logistics ${portalLabel}.
              Please click the button below to verify your email address and activate your account.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px">
              <tr>
                <td style="background:${accentColor};border-radius:10px;padding:14px 32px">
                  <a href="${confirmationUrl}"
                     style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;white-space:nowrap">
                    Verify My Email Address
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 6px;color:#94a3b8;font-size:12px">Or copy this link into your browser:</p>
            <p style="margin:0 0 24px;color:${accentColor};font-size:11px;word-break:break-all;line-height:1.5">${confirmationUrl}</p>
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px">
              <p style="margin:0;color:#92400e;font-size:12px;line-height:1.5">
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
}
