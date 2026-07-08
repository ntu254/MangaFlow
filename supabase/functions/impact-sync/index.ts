import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { searchImpactProducts } from "../_shared/impact.ts";
import { createEmbedding } from "../_shared/embedding.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const CATEGORIES = [
  { query: "hoodie", category: "top" },
  { query: "t-shirt", category: "top" },
  { query: "shirt", category: "top" },
  { query: "jacket", category: "top" },
  { query: "blazer", category: "top" },
  { query: "jeans", category: "bottom" },
  { query: "pants trousers", category: "bottom" },
  { query: "shorts", category: "bottom" },
  { query: "skirt", category: "bottom" },
  { query: "sneakers", category: "shoes" },
  { query: "boots", category: "shoes" },
  { query: "sandals", category: "shoes" },
  { query: "bag backpack", category: "accessory" },
  { query: "hat cap", category: "accessory" },
  { query: "sunglasses", category: "accessory" },
  { query: "watch", category: "accessory" },
  { query: "belt", category: "accessory" },
  { query: "dress", category: "bottom" },
];

async function runSync(): Promise<{ synced: number; errors: string[] }> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const errors: string[] = [];
  let synced = 0;

  for (const cat of CATEGORIES) {
    try {
      const products = await searchImpactProducts(cat.query, 50);
      for (const p of products) {
        try {
          const embText = `${p.name} ${p.description} ${cat.category}`;
          const embedding = await createEmbedding(embText);
          const tags = [cat.category, cat.query.split(" ")[0], p.brand.toLowerCase()].filter(Boolean);

          const { data: existing } = await supabase
            .from("products")
            .select("id")
            .eq("source_product_id", p.source_product_id)
            .maybeSingle();

          const data = {
            name: p.name,
            description: p.description,
            image_url: p.image_url,
            price: p.price,
            currency: p.currency,
            affiliate_url: p.affiliate_url,
            tags,
            source: "impact",
            source_product_id: p.source_product_id,
            metadata: { brand: p.brand, category: cat.category },
            embedding,
          };

          if (existing) {
            await supabase.from("products").update({ ...data, updated_at: new Date().toISOString() }).eq("id", existing.id);
          } else {
            await supabase.from("products").insert(data);
          }
          synced++;
        } catch (err) {
          errors.push(`${p.source_product_id}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      errors.push(`${cat.query}: ${(err as Error).message}`);
    }
  }

  // Update trending scores
  await supabase.rpc("update_trending_score").catch(() => {});

  return { synced, errors };
}

Deno.cron("Sync Impact products", "0 */6 * * *", async () => {
  const result = await runSync();
  console.log(`Impact sync: synced=${result.synced}, errors=${result.errors.length}`);
});

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
    const { data: isAdmin } = await supabase.rpc("is_admin_user");
    if (!isAdmin) throw new Error("Admin only");

    const result = await runSync();
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
