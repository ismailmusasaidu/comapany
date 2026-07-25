import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SITE_URL = Deno.env.get("SITE_URL") || "https://bolt.new";

interface InitBody {
  booking_ref: string;
  table_name: string;
  amount_kobo: number;
  customer_email: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!PAYSTACK_SECRET) {
      return new Response(
        JSON.stringify({ error: "Paystack secret key is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { booking_ref, table_name, amount_kobo, customer_email } = (await req.json()) as InitBody;

    if (!booking_ref || !table_name || !amount_kobo || !customer_email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (amount_kobo < 100) {
      return new Response(
        JSON.stringify({ error: "Amount must be at least ₦1.00 (100 kobo)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const callbackUrl = `${SITE_URL.replace(/\/$/, "")}/payment/callback`;
    const paystackRef = `${booking_ref}-${Date.now()}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: customer_email,
        amount: Math.round(amount_kobo),
        reference: paystackRef,
        callback_url: callbackUrl,
        metadata: { booking_ref, table_name, custom_fields: [
          { display_name: "Booking Reference", variable_name: "booking_ref", value: booking_ref },
        ] },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data?.status || !data?.data?.authorization_url) {
      return new Response(
        JSON.stringify({ error: data?.message || "Paystack initialization failed." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const recordRes = await fetch(`${SUPABASE_URL}/rest/v1/paystack_transactions`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        booking_ref,
        table_name,
        amount_kobo: Math.round(amount_kobo),
        paystack_ref: paystackRef,
        customer_email,
        status: "initialized",
      }),
    });
    if (!recordRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to record payment session." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ authorization_url: data.data.authorization_url, reference: paystackRef }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unexpected error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
