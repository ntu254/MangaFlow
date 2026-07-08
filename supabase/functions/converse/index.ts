// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateJson } from "../_shared/gemini.ts";
import { withCreditCheck, CreditError } from "../_shared/credits.ts";
import { createEmbedding } from "../_shared/embedding.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth-referer",
};

const FEMALE_ONLY_PRODUCT_SIGNALS = [
  "áo bra",
  "bra",
  "blouse",
  "clutch",
  "cao gót",
  "đầm",
  "dress",
  "giày cao gót",
  "heels",
  "midi ôm",
  "sandals cao gót",
  "sequin",
  "skirt",
  "váy",
  "vascara",
  "elise",
];

function normalizeGender(value: unknown): "male" | "female" | "lgbtq" | "skip" | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (["male", "female", "lgbtq", "skip"].includes(normalized)) return normalized as "male" | "female" | "lgbtq" | "skip";
  if (["nam", "men", "man"].includes(normalized)) return "male";
  if (["nữ", "nu", "women", "woman"].includes(normalized)) return "female";
  return null;
}

function isClearlyFemaleOnlyProduct(product: any): boolean {
  const text = `${product.name || ""} ${product.description || ""} ${product.metadata?.brand || ""}`.toLowerCase();
  return FEMALE_ONLY_PRODUCT_SIGNALS.some((signal) => text.includes(signal));
}

function mapProfileContext(profile: any) {
  const fashionPreferences =
    profile?.fashion_preferences &&
    typeof profile.fashion_preferences === "object" &&
    !Array.isArray(profile.fashion_preferences)
      ? profile.fashion_preferences
      : {};

  return {
    gender: normalizeGender(fashionPreferences.gender),
    styleDna: profile?.style_dna ?? null,
    favoriteColors: Array.isArray(profile?.favorite_colors) ? profile.favorite_colors : [],
    preferredStyles: Array.isArray(profile?.preferred_styles) ? profile.preferred_styles : [],
    preferredOccasions: Array.isArray(profile?.preferred_occasions) ? profile.preferred_occasions : [],
    budgetMin: typeof profile?.budget_min === "number" ? profile.budget_min : null,
    budgetMax: typeof profile?.budget_max === "number" ? profile.budget_max : null,
    quizCompleted: Boolean(profile?.quiz_completed),
  };
}

function mergeProfileContext(serverContext: any, clientContext: any) {
  if (!serverContext && !clientContext) return null;

  return {
    gender: normalizeGender(serverContext?.gender ?? clientContext?.gender),
    styleDna: serverContext?.styleDna ?? clientContext?.styleDna ?? null,
    favoriteColors: serverContext?.favoriteColors?.length ? serverContext.favoriteColors : clientContext?.favoriteColors ?? [],
    preferredStyles: serverContext?.preferredStyles?.length ? serverContext.preferredStyles : clientContext?.preferredStyles ?? [],
    preferredOccasions: serverContext?.preferredOccasions?.length ? serverContext.preferredOccasions : clientContext?.preferredOccasions ?? [],
    budgetMin: serverContext?.budgetMin ?? clientContext?.budgetMin ?? null,
    budgetMax: serverContext?.budgetMax ?? clientContext?.budgetMax ?? null,
    quizCompleted: Boolean(serverContext?.quizCompleted ?? clientContext?.quizCompleted),
  };
}

function formatQuizProfileContext(context: any): string {
  if (!context || !context.quizCompleted) {
    return "User chưa có quiz profile hoàn chỉnh. Không tự bịa preference cá nhân hóa.";
  }

  return [
    `Quiz completed: ${context.quizCompleted ? "yes" : "no"}`,
    `Gender/preference: ${context.gender || "không rõ"}`,
    `Style DNA: ${context.styleDna ? JSON.stringify(context.styleDna) : "không có"}`,
    `Preferred styles: ${context.preferredStyles.length ? context.preferredStyles.join(", ") : "không có"}`,
    `Preferred occasions: ${context.preferredOccasions.length ? context.preferredOccasions.join(", ") : "không có"}`,
    `Favorite colors: ${context.favoriteColors.length ? context.favoriteColors.join(", ") : "không có"}`,
    `Budget: ${context.budgetMin ?? "không rõ"}-${context.budgetMax ?? "không rõ"} VND`,
  ].join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { message, history, gender, profileContext } = await req.json();
    if (!message) throw new Error("Missing message");

    const { data: profile } = await supabase
      .from("profiles")
      .select("style_dna, favorite_colors, preferred_styles, preferred_occasions, budget_min, budget_max, quiz_completed, fashion_preferences")
      .eq("id", user.id)
      .maybeSingle();
    const effectiveProfileContext = mergeProfileContext(mapProfileContext(profile), profileContext);
    const genderPreference = normalizeGender(gender) ?? effectiveProfileContext?.gender ?? null;
    const quizProfileContext = formatQuizProfileContext(effectiveProfileContext);

    // Retrieve fashion rules from database related to user's prompt (RAG Knowledge Graph Rules)
    let retrievedRules: any[] = [];
    try {
      const mentionedConcepts = new Set<string>();
      
      // Load all aliases to search for mentions
      const { data: matchedAliases } = await supabase
        .from("fashion_concept_aliases")
        .select("concept_id, alias");
      
      if (matchedAliases) {
        for (const ma of matchedAliases) {
          const aliasLower = ma.alias.toLowerCase();
          if (message.toLowerCase().includes(aliasLower)) {
            mentionedConcepts.add(ma.concept_id);
          }
        }
      }
      
      // Also check standard concept IDs or names in the message
      const { data: allConcepts } = await supabase
        .from("fashion_concepts")
        .select("id, name");
      if (allConcepts) {
        for (const c of allConcepts) {
          if (message.toLowerCase().includes(c.name.toLowerCase()) || message.toLowerCase().includes(c.id.toLowerCase())) {
            mentionedConcepts.add(c.id);
          }
        }
      }

      if (mentionedConcepts.size > 0) {
        // Query rules matching these concepts
        const { data: rules } = await supabase
          .from("fashion_styling_rules")
          .select("id, concept_id, type, priority, payload")
          .in("concept_id", Array.from(mentionedConcepts));
        
        if (rules) {
          retrievedRules = rules;
        }
        
        // Also look up related neighbors/concepts (relationships)
        const { data: edges } = await supabase
          .from("fashion_concept_edges")
          .select("source_id, target_id, relation, weight")
          .or(`source_id.in.(${Array.from(mentionedConcepts).map(c => `"${c}"`).join(',')}),target_id.in.(${Array.from(mentionedConcepts).map(c => `"${c}"`).join(',')})`);
        
        // Add neighbor concepts rules too
        const neighborConcepts = new Set<string>();
        if (edges) {
          for (const edge of edges) {
            neighborConcepts.add(edge.source_id);
            neighborConcepts.add(edge.target_id);
          }
        }
        
        // Remove original concepts to avoid duplicates
        for (const c of mentionedConcepts) {
          neighborConcepts.delete(c);
        }
        
        if (neighborConcepts.size > 0) {
          const { data: neighborRules } = await supabase
            .from("fashion_styling_rules")
            .select("id, concept_id, type, priority, payload")
            .in("concept_id", Array.from(neighborConcepts));
          if (neighborRules) {
            retrievedRules = [...retrievedRules, ...neighborRules];
          }
        }
      }
    } catch (err) {
      console.error("Knowledge rule retrieval failed:", err);
    }

    const rulesContext = retrievedRules.map((r) => {
      let logic = "";
      if (r.payload && typeof r.payload === "object") {
        logic = r.payload.rule || JSON.stringify(r.payload);
      }
      return `- Concept: ${r.concept_id} (Rule Type: ${r.type}, Priority: ${r.priority})
  Logic: ${logic}`;
    }).join("\n\n");

    // 1. RAG: Retrieve similar products from database using vector search
    let retrievedProducts: any[] = [];
    try {
      const embedding = await createEmbedding(message);
      const { data: matched } = await supabase.rpc("search_products", {
        query_embedding: embedding,
        match_count: 12,
      });
      if (matched) {
        retrievedProducts = genderPreference === "male"
          ? matched.filter((product: any) => !isClearlyFemaleOnlyProduct(product))
          : matched;
      }
    } catch (err) {
      console.error("RAG Product retrieval failed:", err);
    }

    const productsContext = retrievedProducts.map((p) => {
      const brand = p.metadata?.brand || "";
      const platform = p.affiliate_url?.includes("shopee.vn") ? "Shopee" : "TikTok Shop";
      return `- ID: ${p.id}
  Name: ${p.name}
  Description: ${p.description || ""}
  Price: ${Number(p.price).toLocaleString('vi-VN')}đ
  Platform: ${platform}
  Brand: ${brand}
  Image: ${p.image_url || ""}
  AffiliateUrl: ${p.affiliate_url || ""}`;
    }).join("\n\n");

    const systemPrompt = `Bạn là stylist AI của Redo, app thời trang Việt Nam. 
Phân tích yêu cầu của user và thiết kế các outfit thời trang phù hợp từ kho sản phẩm thật được cung cấp dưới đây và tuân thủ chặt chẽ các quy tắc thời trang được áp dụng.

QUY TẮC THỜI TRANG ĐƯỢC ÁP DỤNG (BẮT BUỘC tuân thủ):
${rulesContext || "Không có quy tắc đặc thù nào khác. Hãy sử dụng các nguyên tắc thời trang cơ bản."}

KHO SẢN PHẨM THẬT (CHỈ chọn sản phẩm từ danh sách này):
${productsContext || "Không tìm thấy sản phẩm phù hợp trong kho. Bạn hãy tự tạo các sản phẩm thời trang giả lập phù hợp và gắn link affiliate mặc định."}

PROFILE QUIZ THẬT CỦA USER:
${quizProfileContext}

Luôn ưu tiên Style DNA, preferred styles, preferred occasions, favorite colors và budget trong PROFILE QUIZ THẬT khi chọn sản phẩm, viết aiComment, personalization và aiConfidence.
Giới tính/preference của user: ${genderPreference || "không rõ"}.
Nếu preference là male, không đề xuất váy, đầm, giày cao gót, bra, blouse, clutch hoặc item chỉ dành cho nữ; ưu tiên menswear hoặc unisex.

Trả về JSON theo định dạng sau:
{
  "reply": "câu trả lời tư vấn phong cách tự nhiên bằng tiếng Việt",
  "outfits": [{
    "title": "tên outfit",
    "emoji": "emoji phù hợp",
    "style": "Casual|Streetwear|Office|Party|Minimal|K-Fashion|Boho",
    "styleTags": ["tag1", "tag2"],
    "aiComment": "mô tả ngắn bằng tiếng Việt giải thích lý do phối các món đồ này",
    "totalPrice": "tổng giá trị của outfit dạng VND (ví dụ: 1.500.000đ)",
    "matchScore": số từ 0-100 đánh giá độ phù hợp,
    "season": "spring|summer|fall|winter|all_year",
    "occasion": "office|casual|party|hangout|date",
    "mood": "từ 1-2 từ tiếng Việt",
    "products": [{
      "id": "ID sản phẩm từ danh sách",
      "name": "tên sản phẩm chính xác từ danh sách",
      "price": "giá tiền từ danh sách (ví dụ: 850.000đ)",
      "platform": "Shopee|TikTok Shop",
      "badge": "giảm giá, hot deal hoặc null",
      "rating": số 0-5,
      "sold": "số lượng đã bán (ví dụ: '100+')",
      "brand": "thương hiệu",
      "image": "URL hình ảnh (trường Image từ danh sách)",
      "affiliateUrl": "URL affiliate (trường AffiliateUrl từ danh sách)"
    }],
    "personalization": ["câu cá nhân hóa dựa trên profile"],
    "aiConfidence": [{"label": "yếu tố phù hợp", "positive": true}]
  }],
  "suggestions": [{"label": "nút gợi ý tiếp theo", "prompt": "câu prompt tương ứng"}]
}

Lưu ý quan trọng:
1. Nếu có KHO SẢN PHẨM THẬT, bạn MUST sử dụng các sản phẩm trong đó để xây dựng outfit. Cung cấp đúng ID, Image, và AffiliateUrl của sản phẩm đó để hiển thị chính xác lên giao diện.
2. Trả về từ 3 đến 5 outfits.
3. Câu trả lời và mô tả viết hoàn toàn bằng tiếng Việt tự nhiên, thân thiện.`;

    const userPrompt = `Tin nhắn user: "${message}"
${history?.length ? `Lịch sử: ${JSON.stringify(history)}` : ""}
Profile quiz context:
${quizProfileContext}
Hãy tạo outfit phù hợp.`;

    const result = await withCreditCheck(supabase, user.id, "generation", "gemini-3.1-flash-lite", async () => {
      return await generateJson<{
        reply: string;
        outfits: any[];
        suggestions: { label: string; prompt: string }[];
      }>(userPrompt, systemPrompt);
    });

    if (result && Array.isArray(result.outfits)) {
      const ruleDetails = retrievedRules.map(r => ({
        concept_id: r.concept_id,
        rule_type: r.type,
        priority: Number(r.priority),
        rule_text: r.payload?.rule || JSON.stringify(r.payload)
      }));
      result.outfits = result.outfits.map(o => ({
        ...o,
        resolvedRules: ruleDetails
      }));
    }

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
