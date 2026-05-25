import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GeoResult {
  lat: number;
  lon: number;
  display_name: string;
}

async function geocode(city: string): Promise<GeoResult | null> {
  // Use Nominatim (OpenStreetMap) — free, no API key
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ", Nigeria")}&format=json&limit=1&countrycodes=ng`;
  const res = await fetch(url, {
    headers: { "User-Agent": "DeliveryApp/1.0" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display_name: data[0].display_name };
}

async function getRouteDistanceKm(
  originLat: number, originLon: number,
  destLat: number, destLon: number
): Promise<number | null> {
  // OSRM public routing API — free, no API key needed
  const url = `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes || data.routes.length === 0) return null;
  return data.routes[0].distance / 1000; // metres → km
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { pickup_city, delivery_city, delivery_type } = await req.json();

    if (!pickup_city || !delivery_city) {
      return new Response(
        JSON.stringify({ error: "pickup_city and delivery_city are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Geocode both cities in parallel
    const [origin, destination] = await Promise.all([
      geocode(pickup_city),
      geocode(delivery_city),
    ]);

    if (!origin) {
      return new Response(
        JSON.stringify({ error: `Could not locate "${pickup_city}". Try a more specific city name.` }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!destination) {
      return new Response(
        JSON.stringify({ error: `Could not locate "${delivery_city}". Try a more specific city name.` }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get road distance
    const distanceKm = await getRouteDistanceKm(origin.lat, origin.lon, destination.lat, destination.lon);

    if (distanceKm === null) {
      return new Response(
        JSON.stringify({ error: "Could not calculate route between these cities." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch fee settings from DB
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const dt = delivery_type || "same_state";
    const { data: feeSetting } = await supabase
      .from("delivery_fee_settings")
      .select("fee_per_km, minimum_fee")
      .eq("delivery_type", dt)
      .maybeSingle();

    const feePerKm = feeSetting?.fee_per_km ?? 150;
    const minimumFee = feeSetting?.minimum_fee ?? 1500;
    const calculatedFee = Math.round(distanceKm * feePerKm);
    const estimatedFee = Math.max(calculatedFee, minimumFee);

    return new Response(
      JSON.stringify({
        distance_km: Math.round(distanceKm),
        fee_per_km: feePerKm,
        minimum_fee: minimumFee,
        estimated_fee: estimatedFee,
        origin_name: origin.display_name,
        destination_name: destination.display_name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
