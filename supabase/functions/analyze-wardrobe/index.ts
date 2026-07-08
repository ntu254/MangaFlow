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

    const { items } = await req.json();
    if (!items || !items.length) throw new Error("No wardrobe items provided");

    const systemPrompt = `Bạn là chuyên gia phân tích tủ đồ. Phân tích danh sách items và trả về JSON:
{
  "totalItems": number,
  "topCategory": "danh mục nhiều nhất",
  "topColor": "màu phổ biến nhất",
  "topStyle": "phong cách chủ đạo",
  "colorPalette": [{"color": "tên màu", "count": số, "label": "nhãn"}],
  "categoryDistribution": [{"category": "danh mục", "count": số}],
  "styleDistribution": [{"style": "phong cách", "count": số}],
  "seasonBreakdown": [{"season": "mùa", "count": số}],
  "consistencyScore": số 0-100,
  "dominantStyles": ["style chính"],
  "missingEssentials": ["item cần bổ sung"]
}
Chỉ trả JSON.`;

    const userPrompt = `Danh sách items:\n${JSON.stringify(items, null, 2)}`;

    const analysis = await withCreditCheck(supabase, user.id, "analysis", "gemini-2.0-flash", async () => {
      return await generateJson<any>(userPrompt, systemPrompt);
    });

    return new Response(JSON.stringify(analysis), {
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
