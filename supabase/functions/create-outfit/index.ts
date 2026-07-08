import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createEmbedding } from "../_shared/embedding.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey, x-supabase-auth-referer",
};

const GEMINI_FLASH = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

interface OutfitItem {
  id: string;
  name: string;
  image_url: string;
  price: number;
  affiliate_url: string;
  brand: string;
  slot: string;
  click_count: number;
}

interface OutfitResult {
  style: string;
  description: string;
  items: OutfitItem[];
  total_price: number;
  trending: boolean;
  traffic_source: string;
}

async function callGemini(prompt: string, apiKey: string) {
  const r = await fetch(`${GEMINI_FLASH}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!r.ok) {
    const errBody = await r.text();
    if (r.status === 429) {
      throw new Error("AI tạm thời quá tải. Vui lòng thử lại sau ít phút.");
    }
    throw new Error(`Gemini API error (${r.status}): ${errBody.slice(0, 200)}`);
  }
  return r.json();
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

    const { text, ref, fashion_preferences } = await req.json();
    if (!text?.trim()) throw new Error("Missing text");

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const trafficSource = ref || "direct";

    const userContext = fashion_preferences ? `\nUser Preferences (from quiz): ${JSON.stringify(fashion_preferences)}\n` : "";

    // Step 1: AI intent parsing
    const intentResp = await callGemini(
      `Parse the fashion request below. Return ONLY valid JSON (no markdown):
{
  "style": "2-3 word style name (English or Vietnamese)",
  "description": "one sentence outfit description (Vietnamese)",
  "search_keywords": ["3-5 English keywords for product search"],
  "slots": ["top", "bottom", "shoes", "accessory"]
}

Request: "${text}"${userContext}
Ensure search_keywords include constraints based on the User Preferences (e.g., if gender is male, append 'men' or 'nam' to keywords).`,
      apiKey,
    );

    const intentText = intentResp?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const intentTextClean = intentText.replace(/```json|```/g, "").trim();
    const intent = JSON.parse(intentTextClean);

    const searchKeywords = intent.search_keywords?.join(" ") || text;
    const style = intent.style || "casual";
    const slots: string[] = intent.slots || ["top", "bottom", "shoes", "accessory"];
    const description = intent.description || text;

    // Step 2: Embedding + vector search
    const embedding = await createEmbedding(searchKeywords);

    const { data: products } = await supabase.rpc("match_products", {
      query_embedding: embedding,
      match_count: 30,
    });

    const allProducts: any[] = products || [];

    if (!allProducts.length) {
      return new Response(JSON.stringify({
        outfit: null,
        note: "Chưa có sản phẩm phù hợp. Admin cần sync Impact API trước.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: AI assigns products to slots
    const productList = allProducts.map((p: any, i: number) =>
      `${i}. ${p.name} | ${(p.tags || []).join(", ")} | ${Number(p.price)?.toLocaleString()}đ | click_count:${p.click_count || 0}`
    ).join("\n");

    const assignResp = await callGemini(
      `You are a stylist assigning products to outfit slots. Choose the BEST product for each slot.
Return ONLY valid JSON array (no markdown):
[{ "slot": "top", "product_index": 0 }]

Slots: ${JSON.stringify(slots)}
Style: ${style}
Description: ${description}${userContext}
Ensure selected products strongly match the User Preferences, especially gender (e.g. do not select women's skirts for a male user).

Products:
${productList}`,
      apiKey,
    );

    const assignText = assignResp?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const assignTextClean = assignText.replace(/```json|```/g, "").trim();
    let assignments: Array<{ slot: string; product_index: number }> = [];
    try {
      assignments = JSON.parse(assignTextClean);
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
          slot: a.slot,
          click_count: p.click_count || 0,
        };
      });

    const totalPrice = items.reduce((s, i) => s + i.price, 0);
    const trending = items.some((i) => i.click_count > 10);

    const result: OutfitResult = {
      style,
      description,
      items,
      total_price: totalPrice,
      trending,
      traffic_source: trafficSource,
    };

    // Log to outfits table
    await supabase.from("outfits").insert({
      user_id: user.id,
      name: description,
      image_url: items[0]?.image_url || "",
      source: "ai",
      is_saved: false,
    });

    return new Response(JSON.stringify({ outfit: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
