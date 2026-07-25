import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!PAYSTACK_SECRET) {
      return new Response(
        JSON.stringify({ status: "failed", message: "Paystack secret key is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = new URL(req.url);
    const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");
    if (!reference) {
      return new Response(
        JSON.stringify({ status: "failed", message: "Missing payment reference." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = await verifyRes.json();

    const paid = verifyRes.ok && data?.status && data?.data?.status === "success";
    const bookingRef: string | undefined = data?.data?.metadata?.booking_ref;
    const tableName: string | undefined = data?.data?.metadata?.table_name;

    const supaHeaders = {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    await fetch(`${SUPABASE_URL}/rest/v1/paystack_transactions?paystack_ref=eq.${encodeURIComponent(reference)}`, {
      method: "PATCH",
      headers: supaHeaders,
      body: JSON.stringify({
        status: paid ? "success" : "failed",
        verified_at: new Date().toISOString(),
      }),
    });

    if (paid && bookingRef && (tableName === "delivery_bookings" || tableName === "business_delivery_bookings")) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/${tableName}?booking_ref=eq.${encodeURIComponent(bookingRef)}`,
        {
          method: "PATCH",
          headers: supaHeaders,
          body: JSON.stringify({ payment_status: "paid", status: "confirmed" }),
        },
      );
    }

    return new Response(
      JSON.stringify({
        status: paid ? "success" : "failed",
        booking_ref: bookingRef ?? null,
        reference,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ status: "failed", message: err instanceof Error ? err.message : "Unexpected error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
