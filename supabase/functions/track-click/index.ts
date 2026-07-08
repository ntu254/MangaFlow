// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth-referer",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const productId = body.product_id;
    const outfitId = body.outfit_id || null;

    if (!productId || typeof productId !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid product_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const userAgent = (req.headers.get("user-agent") || "").slice(0, 500);

    const { error: insertError } = await supabase.from("clicks").insert({
      user_id: user.id,
      product_id: productId,
      outfit_id: outfitId,
      source: "affiliate",
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (insertError) {
      console.error("Click insert failed:", insertError.message);
    }

    const { data: product } = await supabase
      .from("products")
      .select("affiliate_url")
      .eq("id", productId)
      .single();

    return new Response(JSON.stringify({
      tracked: true,
      affiliate_url: product?.affiliate_url || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("track-click error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
