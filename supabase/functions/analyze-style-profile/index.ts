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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    let forceRefresh = false;
    try {
      const body = await req.json();
      forceRefresh = !!body.forceRefresh;
    } catch {
      // Body is optional
    }

    // 1. Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("style_dna, favorite_colors, preferred_styles, ai_style_profile_cache")
      .eq("id", user.id)
      .single();

    if (profileError) throw new Error("Failed to fetch profile");

    // 2. Return cached profile if available and not forcing refresh
    if (!forceRefresh && profile?.ai_style_profile_cache) {
      return new Response(JSON.stringify(profile.ai_style_profile_cache), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Fetch wardrobe items
    const { data: wardrobeItems, error: wardrobeError } = await supabase
      .from("wardrobe_items")
      .select("name, category_id, color, style, is_favorite")
      .eq("user_id", user.id);

    if (wardrobeError) throw new Error("Failed to fetch wardrobe items");

    // 4. Construct AI prompts
    const systemPrompt = `Bạn là một AI Stylist cao cấp. Hãy phân tích kết quả bài Quiz (Style DNA, màu yêu thích, phong cách) và tủ đồ hiện tại của user để trả về hồ sơ phong cách chuyên sâu dưới dạng JSON chuẩn xác theo cấu trúc sau:
{
  "styleDna": [{"style": "Tên phong cách", "value": "tỷ lệ phần trăm (số)"}],
  "favoriteColors": [{"name": "Tên màu", "hex": "Mã HEX màu", "pct": "tỷ lệ % (số)"}],
  "outfitTypeDistribution": [{"name": "Tên dịp (VD: Casual, Office)", "value": "tỷ lệ % (số)", "color": "mã HSL màu"}],
  "aiInsight": {"summary": "Câu tóm tắt ngắn gọn", "description": "Mô tả chi tiết 1-2 câu về phong cách"},
  "insights": ["Insight 1", "Insight 2", "Insight 3"],
  "trendSummary": [{"label": "Tên xu hướng", "change": "Mức độ thay đổi (VD: +20%)", "positive": true/false}],
  "keyMoments": [{"month": "Tháng/Năm", "event": "Sự kiện hoặc thay đổi"}],
  "missingEssentials": [{"item": "Tên món đồ còn thiếu", "reason": "Lý do nên mua", "priority": "high|medium|low"}],
  "consistencyScore": "Điểm đồng nhất phong cách (số 0-100)"
}
LƯU Ý: Phân tích kỹ giữa sở thích (Quiz) và thực tế tủ đồ (Wardrobe). Nếu tủ đồ trống, hãy dựa vào quiz để đề xuất "missingEssentials". Bắt buộc chỉ trả về chuỗi JSON hợp lệ.`;

    const userPrompt = `
Thông tin Quiz:
- Style DNA: ${JSON.stringify(profile?.style_dna || {})}
- Favorite Colors: ${JSON.stringify(profile?.favorite_colors || [])}
- Preferred Styles: ${JSON.stringify(profile?.preferred_styles || [])}

Danh sách Tủ đồ (${wardrobeItems?.length || 0} items):
${JSON.stringify(wardrobeItems || [], null, 2)}
`;

    // 5. Call AI with credit deduction
    const analysis = await withCreditCheck(supabase, user.id, "analysis", "gemini-2.0-flash", async () => {
      // Call gemini with gemini-2.0-flash
      const result = await generateJson<any>(userPrompt, systemPrompt, "gemini-2.0-flash");
      
      // Cache the result to database
      await supabase
        .from("profiles")
        .update({
          ai_style_profile_cache: result,
          ai_style_profile_updated_at: new Date().toISOString()
        })
        .eq("id", user.id);
        
      return result;
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
