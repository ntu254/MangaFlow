import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { analyzeImage } from "../_shared/gemini.ts";
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

    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) throw new Error("Missing image data");

    const prompt = `Phân tích ảnh thời trang này. Trả về JSON:
{
  "detectedName": "tên tiếng Việt của item",
  "detectedCategory": "Tops|Bottoms|Shoes|Outerwear|Accessories|Dresses",
  "detectedType": "Áo|Quần|Giày|Áo khoác|Phụ kiện|Đầm",
  "detectedColor": "màu sắc tiếng Việt",
  "detectedTags": ["tag1", "tag2"],
  "suggestion": [{"role": "Core|Layer|Statement", "name": "tên item phối hợp", "color": "màu sắc"}]
}
Chỉ trả về JSON, không markdown.`;

    const result = await withCreditCheck(supabase, user.id, "analysis", "gemini-2.0-flash", async () => {
      const text = await analyzeImage(imageBase64, mimeType ?? "image/jpeg", prompt);
      const cleanText = text.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
      return JSON.parse(cleanText);
    });

    return new Response(JSON.stringify(result), {
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
