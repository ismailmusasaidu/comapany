import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotifyPayload {
  // booking-type (delivery_bookings / business_delivery_bookings)
  booking_ref?: string;
  recipient_name?: string;
  recipient_phone?: string;
  sender_phone?: string;
  delivery_city?: string;
  // order-type (orders table)
  order_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  // shared
  old_status: string;
  new_status: string;
  message: string;
}

function buildSmsMessage(payload: NotifyPayload): string {
  return payload.message + "\n- Danhausa Logistics";
}

function buildEmailHtml(payload: NotifyPayload): string {
  const ref = payload.booking_ref ?? payload.order_id ?? "";
  const name = payload.recipient_name ?? payload.customer_name ?? "Customer";
  const statusLabel = payload.new_status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return `
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
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Delivery Status Update</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 8px;color:#334155;font-size:15px">Hi ${name},</p>
            <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6">${payload.message}</p>
            <table cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:16px 20px;width:100%">
              <tr>
                <td style="color:#64748b;font-size:13px;padding:4px 0">Reference</td>
                <td style="color:#1e293b;font-size:13px;font-weight:600;text-align:right;padding:4px 0">${ref}</td>
              </tr>
              <tr>
                <td style="color:#64748b;font-size:13px;padding:4px 0">Status</td>
                <td style="color:#f97316;font-size:13px;font-weight:700;text-align:right;padding:4px 0">${statusLabel}</td>
              </tr>
            </table>
            <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">
              Questions? Reply to this email or WhatsApp us. Thank you for choosing Danhausa.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0">
            <p style="margin:0;color:#94a3b8;font-size:11px">
              © 2026 Danhausa Logistics &amp; Marketplace · Nigeria
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendSms(to: string, message: string): Promise<{ ok: boolean; detail: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM_NUMBER");

  if (!accountSid || !authToken || !from) {
    return { ok: false, detail: "SMS not configured (missing TWILIO secrets)" };
  }

  // Normalise Nigerian numbers: 080... → +23480...
  let phone = to.trim();
  if (phone.startsWith("0")) phone = "+234" + phone.slice(1);
  if (!phone.startsWith("+")) phone = "+" + phone;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
      },
      body: new URLSearchParams({ To: phone, From: from, Body: message }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    return { ok: false, detail: data.message ?? `Twilio error ${res.status}` };
  }
  return { ok: true, detail: `SMS sent to ${phone} (SID: ${data.sid})` };
}

async function sendEmail(to: string, name: string, subject: string, html: string): Promise<{ ok: boolean; detail: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return { ok: false, detail: "Email not configured (missing RESEND_API_KEY)" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Danhausa Logistics <notifications@danhausa.com>",
      to: [{ email: to, name }],
      subject,
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return { ok: false, detail: data.message ?? `Resend error ${res.status}` };
  }
  return { ok: true, detail: `Email sent to ${to} (ID: ${data.id})` };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload: NotifyPayload = await req.json();

    const { new_status, message } = payload;
    if (!new_status || !message) {
      return new Response(
        JSON.stringify({ error: "new_status and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Record<string, { ok: boolean; detail: string }> = {};
    const smsText = buildSmsMessage(payload);
    const ref = payload.booking_ref ?? payload.order_id ?? "unknown";
    const statusLabel = new_status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const emailSubject = `Delivery Update: ${statusLabel} — ${ref}`;

    // SMS to recipient
    if (payload.recipient_phone) {
      results.recipient_sms = await sendSms(payload.recipient_phone, smsText);
    }

    // SMS to sender (only for key statuses to avoid over-messaging)
    if (payload.sender_phone && ["picked_up", "delivered", "cancelled"].includes(new_status)) {
      const senderMsg = `Danhausa: Your sent package (${ref}) status: ${statusLabel}. ` + message;
      results.sender_sms = await sendSms(payload.sender_phone, senderMsg + "\n- Danhausa Logistics");
    }

    // Email for order-type notifications
    if (payload.customer_email) {
      const name = payload.customer_name ?? "Customer";
      const html = buildEmailHtml(payload);
      results.customer_email = await sendEmail(payload.customer_email, name, emailSubject, html);
    }

    // SMS for order-type
    if (payload.customer_phone) {
      results.customer_sms = await sendSms(payload.customer_phone, smsText);
    }

    console.log("notify-status-change results:", JSON.stringify(results));

    return new Response(
      JSON.stringify({ success: true, ref, new_status, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("notify-status-change error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
