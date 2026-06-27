import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are Danhausa Assistant, the AI support agent for Danhausa Logistics & Marketplace — a national and international logistics and delivery company based in Nigeria.

You help customers with:
- Delivery booking information and how to get started
- Order tracking (guide them to use the tracking page with their order ID)
- Shipping rates and price estimates (guide them to the Price Calculator)
- Service types: Same-State delivery, Inter-State delivery, International shipping
- Package types: Documents, Parcels, Fragile items, Heavy freight
- Agent Portal (for delivery agents/couriers)
- Business Portal (for companies needing logistics)
- Individual Portal (for personal deliveries)
- Marketplace (shopping platform integrated with logistics)
- Rider and Vendor onboarding process
- Company information, contact details, and office hours

Key facts about Danhausa:
- Serves Nigeria and international destinations
- Offers express shipping, freight services, same-day delivery, and business logistics
- Has 200+ corporate clients and 50,000+ monthly deliveries with 98% on-time rate
- Customers can track orders at /track using their order ID (formats: BK-, BB-, LR-, BR-)
- Price calculator available at /shipping-calculator
- Book via WhatsApp or through the portals (Agent, Business, Individual)
- For riders: minimum age 18, need valid ID, vehicle, and good knowledge of routes
- For vendors: need CAC registration, TIN, business bank account

IMPORTANT RULES:
- Keep responses concise and helpful (2-4 sentences max unless a detailed list is needed)
- Always suggest the relevant page link when applicable (/track, /shipping-calculator, /marketplace)
- If asked about a specific order, tell them to visit /track and enter their order ID
- If asked about pricing, mention the calculator at /shipping-calculator and give rough guidance
- Be warm, professional, and Nigerian-friendly in tone
- Do not make up specific prices — always direct to the calculator
- If you cannot answer something, offer to connect them with the team via the contact form`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: messages.slice(-10), // keep last 10 turns for context
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return new Response(
        JSON.stringify({ error: "AI service error. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? "Sorry, I could not generate a response.";

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ai-chat error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
