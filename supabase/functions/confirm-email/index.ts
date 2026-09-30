import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_ATTEMPTS = 5;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return json({ error: "Please enter the 6-digit code from your email." }, 400);
    }
    if (!/^\d{6}$/.test(String(code))) {
      return json({ error: "Please enter the 6-digit code from your email." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const normalizedEmail = String(email).trim().toLowerCase();

    // Latest active (unconsumed, unexpired) code for this email
    const { data: rows, error: fetchErr } = await admin
      .from("email_confirmation_codes")
      .select("id, code, expires_at, consumed, attempts")
      .eq("email", normalizedEmail)
      .eq("consumed", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchErr) {
      console.error("confirm-email fetch error:", fetchErr);
      return json({ error: "Could not verify the code. Please try again." }, 500);
    }

    const active = rows?.[0];
    if (!active) {
      return json(
        { error: "No active code found. Please request a new confirmation code." },
        400
      );
    }

    if (active.code !== String(code)) {
      const attempts = (active.attempts ?? 0) + 1;
      const remaining = Math.max(MAX_ATTEMPTS - attempts, 0);

      if (remaining <= 0) {
        // Invalidate the code entirely
        await admin
          .from("email_confirmation_codes")
          .update({ consumed: true })
          .eq("id", active.id);
        return json(
          { error: "No active code found. Please request a new confirmation code." },
          400
        );
      }

      await admin
        .from("email_confirmation_codes")
        .update({ attempts })
        .eq("id", active.id);

      return json({ error: `Incorrect code. ${remaining} attempts remaining.` }, 400);
    }

    // Correct code — consume it
    const { error: consumeErr } = await admin
      .from("email_confirmation_codes")
      .update({ consumed: true })
      .eq("id", active.id);
    if (consumeErr) {
      console.error("confirm-email consume error:", consumeErr);
      return json({ error: "Could not verify the code. Please try again." }, 500);
    }

    // Confirm the auth user's email
    const { data: userData, error: userErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    void userData;
    void userErr;

    const { data: userList } = await admin.auth.admin.listUsers();
    const target = userList?.users?.find(
      (u) => (u.email ?? "").toLowerCase() === normalizedEmail
    );

    if (target) {
      const { error: updateErr } = await admin.auth.admin.updateUserById(target.id, {
        email_confirm: true,
      });
      if (updateErr) {
        console.error("confirm-email update error:", updateErr);
      }
    }

    return json(
      { success: true, message: "Your email has been confirmed. You can now sign in." },
      200
    );
  } catch (err) {
    console.error("confirm-email error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
