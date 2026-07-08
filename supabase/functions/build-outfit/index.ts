import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createEmbedding } from "../_shared/embedding.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

interface OutfitItem {
  id: string;
  name: string;
  image_url: string;
  price: number;
  affiliate_url: string;
  brand: string;
  category: string;
  slot: string;
}

interface BuiltOutfit {
  id: string;
  style: string;
  description: string;
  items: OutfitItem[];
  total_price: number;
  saved: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { text, save = false } = await req.json();
    if (!text?.trim()) throw new Error("Missing text");

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    // Step 1: AI interprets the request
    const interpretResp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Bạn là stylist AI. Phân tích yêu cầu sau và trả về JSON (không markdown):
{
  "style": "tên phong cách (tối đa 3 từ, tiếng Việt)",
  "description": "mô tả outfit (1 câu, tiếng Việt)",
  "keywords": ["từ khóa tìm kiếm items, tiếng Anh"],
  "slots": ["top", "bottom", "shoes", "accessory"]
}

Yêu cầu: "${text}"`,
          }],
        }],
      }),
    });

    const interpretData = await interpretResp.json();
    const interpretText = interpretData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const interpret = JSON.parse(interpretText.replace(/```json|```/g, "").trim());

    const searchText = interpret.keywords?.join(" ") || text;
    const style = interpret.style || "casual";
    const slots: string[] = interpret.slots || ["top", "bottom", "shoes", "accessory"];
    const description = interpret.description || text;

    // Step 2: Embedding search on products (with fallback)
    let allProducts: any[] = [];
    try {
      const embedding = await createEmbedding(searchText);
      const { data: similarProducts } = await supabase.rpc("search_products", {
        query_embedding: embedding,
        match_count: 30,
      });
      allProducts = similarProducts || [];
    } catch {
      // fallback: keyword search on products table
      const { data: keywordResults } = await supabase
        .from("products")
        .select("*")
        .or(`name.ilike.%${searchText}%,description.ilike.%${searchText}%,metadata->>category.ilike.%${searchText}%`)
        .eq("is_active", true)
        .limit(30);
      allProducts = keywordResults || [];
    }

    if (!allProducts.length) {
      return new Response(JSON.stringify({
        outfit: null,
        note: "Chưa có sản phẩm trong kho. Vui lòng search Impact API trước.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: AI assigns products to slots
    const assignResp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Bạn là stylist. Chọn sản phẩm phù hợp nhất cho mỗi slot từ danh sách dưới đây.
Trả về JSON array (không markdown):
[{ "slot": "top", "product_index": 0, "reason": "ngắn" }]

Slots cần chọn: ${JSON.stringify(slots)}
Mô tả outfit: ${description}
Phong cách: ${style}

Sản phẩm:
${allProducts.map((p: any, i: number) => `${i}. ${p.name} - ${p.metadata?.category || ""} - ${p.price?.toLocaleString()}đ - ${p.description?.slice(0, 100) || "..."}`).join("\n")}`,
          }],
        }],
      }),
    });

    const assignData = await assignResp.json();
    const assignText = assignData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let assignments: Array<{ slot: string; product_index: number }> = [];
    try {
      assignments = JSON.parse(assignText.replace(/```json|```/g, "").trim());
    } catch {
      assignments = slots.map((s, i) => ({ slot: s, product_index: i }));
    }

    const items: OutfitItem[] = assignments
      .filter((a) => a.product_index !== undefined && allProducts[a.product_index])
      .map((a) => {
        const p = allProducts[a.product_index];
        return {
          id: p.id,
          name: p.name,
          image_url: p.image_url,
          price: Number(p.price) || 0,
          affiliate_url: p.affiliate_url,
          brand: p.metadata?.brand || "",
          category: p.metadata?.category || "",
          slot: a.slot,
        };
      });

    let outfitId = "";
    if (save && items.length > 0) {
      const { data: outfit } = await supabase.from("outfits").insert({
        user_id: user.id,
        name: description,
        image_url: items[0]?.image_url || "",
        source: "ai",
        is_saved: true,
      }).select("id").single();

      outfitId = outfit?.id || "";
    }

    const totalPrice = items.reduce((s, i) => s + i.price, 0);

    const outfit: BuiltOutfit = {
      id: outfitId,
      style,
      description,
      items,
      total_price: totalPrice,
      saved: save && !!outfitId,
    };

    return new Response(JSON.stringify({ outfit }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
