// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateJson } from "../_shared/gemini.ts";
import { withCreditCheck, CreditError } from "../_shared/credits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth-referer",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { styleDna, favoriteColors, wardrobeItems } = await req.json();

    const systemPrompt = `Bạn là stylist AI. Dựa trên style DNA và tủ đồ của user, đưa ra 3 gợi ý outfit. Trả JSON array:
[{"prompt": "câu prompt để generate outfit", "label": "nhãn ngắn", "style": "Office|Casual|Party|Streetwear|Minimal"}]
Chỉ trả JSON.`;

    const userPrompt = `Style DNA: ${JSON.stringify(styleDna)}
Favorite colors: ${JSON.stringify(favoriteColors)}
Wardrobe items: ${JSON.stringify(wardrobeItems)}`;

    const recommendations = await withCreditCheck(supabase, user.id, "recommendation", "gemini-2.0-flash", async () => {
      return await generateJson<any[]>(userPrompt, systemPrompt);
    });

    return new Response(JSON.stringify(recommendations.slice(0, 3)), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const status = err instanceof CreditError ? 402 : 400;
    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
