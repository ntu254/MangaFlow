import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { searchImpactProducts } from "../_shared/impact.ts";
import { createEmbedding } from "../_shared/embedding.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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

    const { query, limit = 20, saveToDb = true } = await req.json();
    if (!query?.trim()) throw new Error("Missing query");

    const products = await searchImpactProducts(query, limit);
    if (!products.length) {
      return new Response(JSON.stringify({ products: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (saveToDb) {
      for (const product of products) {
        const embText = `${product.name} ${product.description} ${product.category} ${product.brand}`;
        let embedding: number[] | null = null;
        try {
          embedding = await createEmbedding(embText);
        } catch {
          // proceed without embedding
        }

        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("source_product_id", product.source_product_id)
          .maybeSingle();

        if (existing) {
          const updateData: Record<string, unknown> = {
            name: product.name,
            description: product.description,
            image_url: product.image_url,
            price: product.price,
            affiliate_url: product.affiliate_url,
            updated_at: new Date().toISOString(),
          };
          if (embedding) updateData.embedding = embedding;
          await supabase.from("products").update(updateData).eq("id", existing.id);
        } else {
          const insertData: Record<string, unknown> = {
            source_product_id: product.source_product_id,
            name: product.name,
            description: product.description,
            image_url: product.image_url,
            price: product.price,
            currency: product.currency,
            affiliate_url: product.affiliate_url,
            metadata: { brand: product.brand, category: product.category },
          };
          if (embedding) insertData.embedding = embedding;
          await supabase.from("products").insert(insertData);
        }
      }
    }

    return new Response(JSON.stringify({ products }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
