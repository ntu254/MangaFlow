/**
 * Seed development data into Supabase.
 * Run AFTER migration SQL has been applied via Supabase Dashboard SQL Editor.
 *
 * Usage: node scripts/seed-dev-data.mjs
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

function loadDotEnv() {
  const env = {};
  try {
    const content = fs.readFileSync(".env", "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)$/);
      if (!match) continue;
      let [, key, value] = match;
      value = value.trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key.trim()] = value;
    }
  } catch {
    // file may not exist in all environments
  }
  return env;
}

const env = loadDotEnv();
const SUPABASE_URL = process.env.SUPABASE_URL ?? env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in environment or in .env.");
  process.exit(1);
}

// --- Config ---
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Helper to check if table has data
async function hasData(table) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) return false;
  return count > 0;
}

async function main() {
  console.log("=== Seed Dev Data ===");

  // --- 1. Admin Roles (already in migration seed) ---
  // --- 2. Plans (already in migration seed) ---
  // --- 3. Feature Flags (already in migration seed) ---
  // --- 4. System Settings (already in migration seed) ---

  // --- 5. Product Categories ---
  if (!(await hasData("product_categories"))) {
    const { error } = await supabase.from("product_categories").insert([
      { name: "Tops", slug: "tops", sort_order: 1 },
      { name: "Bottoms", slug: "bottoms", sort_order: 2 },
      { name: "Outerwear", slug: "outerwear", sort_order: 3 },
      { name: "Dresses", slug: "dresses", sort_order: 4 },
      { name: "Shoes", slug: "shoes", sort_order: 5 },
      { name: "Accessories", slug: "accessories", sort_order: 6 },
    ]);
    if (error) console.error("product_categories:", error.message);
    else console.log("  product_categories ✅");
  }

  // --- 6. Product Sources ---
  if (!(await hasData("product_sources"))) {
    const { error } = await supabase.from("product_sources").insert([
      { platform: "Shopee", is_active: true, sync_interval_mins: 60 },
      { platform: "TikTok Shop", is_active: true, sync_interval_mins: 60 },
    ]);
    if (error) console.error("product_sources:", error.message);
    else console.log("  product_sources ✅");
  }

  // --- 7. Products ---
  if (!(await hasData("products"))) {
    const { data: cats } = await supabase.from("product_categories").select("id, slug");
    const catMap = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
    const { data: srcs } = await supabase.from("product_sources").select("id, platform");
    const srcMap = Object.fromEntries(srcs.map((s) => [s.platform, s.id]));

    const products = [
      { name: "Classic White Tee", category_slug: "tops", platform: "Shopee", price: 299000, currency: "VND", is_active: true, is_featured: true },
      { name: "Wide Leg Jeans", category_slug: "bottoms", platform: "Shopee", price: 599000, currency: "VND", is_active: true, is_featured: false },
      { name: "Silk Midi Skirt", category_slug: "bottoms", platform: "Shopee", price: 899000, currency: "VND", is_active: true, is_featured: false },
      { name: "Canvas Tote Bag", category_slug: "accessories", platform: "TikTok Shop", price: 199000, currency: "VND", is_active: false, is_featured: false },
      { name: "Chunky Sneakers", category_slug: "shoes", platform: "TikTok Shop", price: 1299000, currency: "VND", is_active: true, is_featured: true },
      { name: "Oversized Blazer", category_slug: "outerwear", platform: "Shopee", price: 999000, currency: "VND", is_active: true, is_featured: false },
      { name: "Sequin Party Dress", category_slug: "dresses", platform: "Shopee", price: 1499000, currency: "VND", is_active: true, is_featured: false },
      { name: "Leather Belt", category_slug: "accessories", platform: "TikTok Shop", price: 399000, currency: "VND", is_active: false, is_featured: false },
    ].map((p) => ({
      name: p.name,
      category_id: catMap[p.category_slug],
      source_id: srcMap[p.platform],
      price: p.price,
      currency: p.currency,
      is_active: p.is_active,
      is_featured: p.is_featured,
      is_hidden: false,
      link_status: "healthy",
    }));

    const { error } = await supabase.from("products").insert(products);
    if (error) console.error("products:", error.message);
    else console.log("  products ✅");
  }

  // --- 8. AI Models ---
  if (!(await hasData("ai_models"))) {
    const { error } = await supabase.from("ai_models").insert([
      { name: "GPT-4o", provider: "OpenAI", model_type: "outfit_generation", is_active: true },
      { name: "Claude 3.5 Sonnet", provider: "Anthropic", model_type: "stylist_prompt", is_active: true },
      { name: "Gemini 2.0 Flash", provider: "Google", model_type: "item_classification", is_active: true },
      { name: "GPT-4o-mini", provider: "OpenAI", model_type: "trend_summarization", is_active: true },
      { name: "DALL·E 3", provider: "OpenAI", model_type: "outfit_visualization", is_active: false },
    ]);
    if (error) console.error("ai_models:", error.message);
    else console.log("  ai_models ✅");
  }

  // --- 9. Prompt Templates ---
  if (!(await hasData("prompt_templates"))) {
    const { error } = await supabase.from("prompt_templates").insert([
      { name: "Stylist Default v3", slug: "stylist-default-v3", category: "outfit_generation", template: "Generate a {style} outfit for {occasion} in {season}...", is_active: true, version: 3 },
      { name: "Item Classifier v2", slug: "item-classifier-v2", category: "classification", template: "Classify this clothing item: {image_description}", is_active: true, version: 2 },
      { name: "Trend Analyst v1", slug: "trend-analyst-v1", category: "trend_insights", template: "Analyze fashion trend: {trend_name} for {season}", is_active: false, version: 1 },
      { name: "Gap Analyzer v2", slug: "gap-analyzer-v2", category: "gap_analysis", template: "Compare user wardrobe {wardrobe} with trend {trend}", is_active: true, version: 2 },
    ]);
    if (error) console.error("prompt_templates:", error.message);
    else console.log("  prompt_templates ✅");
  }

  // --- 10. Style Presets ---
  if (!(await hasData("style_presets"))) {
    const { error } = await supabase.from("style_presets").insert([
      { name: "Casual", slug: "casual", description: "Phong cách thoải mái hàng ngày", is_active: true, sort_order: 1, characteristics: ["T-shirt", "Jeans", "Sneakers"] },
      { name: "Streetwear", slug: "streetwear", description: "Phong cách đường phố cá tính", is_active: true, sort_order: 2, characteristics: ["Oversized", "Hoodie", "Sneakers chunky"] },
      { name: "Office", slug: "office", description: "Phong cách công sở lịch sự", is_active: true, sort_order: 3, characteristics: ["Blazer", "Trousers", "Oxford shoes"] },
      { name: "Minimal", slug: "minimal", description: "Phong cách tối giản tinh tế", is_active: true, sort_order: 4, characteristics: ["Neutral colors", "Clean lines", "Simple silhouettes"] },
      { name: "Date Night", slug: "date-night", description: "Phong cách hẹn hò lãng mạn", is_active: true, sort_order: 5, characteristics: ["Elegant", "Statement pieces", "Darker tones"] },
      { name: "Athleisure", slug: "athleisure", description: "Phong cách thể thao hiện đại", is_active: true, sort_order: 6, characteristics: ["Sporty", "Comfortable", "Technical fabrics"] },
      { name: "Party", slug: "party", description: "Phong cách tiệc tùng nổi bật", is_active: true, sort_order: 7, characteristics: ["Bold colors", "Sequins", "Statement accessories"] },
      { name: "Bohemian", slug: "bohemian", description: "Phong cách phóng khoáng nghệ thuật", is_active: true, sort_order: 8, characteristics: ["Floral patterns", "Loose fits", "Natural fabrics"] },
    ]);
    if (error) console.error("style_presets:", error.message);
    else console.log("  style_presets ✅");
  }

  // --- 11. Fashion Trends ---
  if (!(await hasData("fashion_trends"))) {
    const { error } = await supabase.from("fashion_trends").insert([
      { title: "Spring Pastel Revival", slug: "spring-pastel-revival", category: "Seasonal", season: "Spring", year: 2026, growth_pct: 42, is_published: true, is_featured: true },
      { title: "Neo Minimalism", slug: "neo-minimalism", category: "Style", season: null, year: 2026, growth_pct: 38, is_published: true, is_featured: true },
      { title: "Coastal Grandmother 2.0", slug: "coastal-grandmother-2", category: "Lifestyle", season: "Summer", year: 2026, growth_pct: 29, is_published: false, is_featured: false },
      { title: "Tech-Wear Evolution", slug: "tech-wear-evolution", category: "Street", season: "Fall", year: 2026, growth_pct: 31, is_published: false, is_featured: false },
      { title: "Quiet Luxury Continues", slug: "quiet-luxury-continues", category: "Premium", season: null, year: 2026, growth_pct: 55, is_published: true, is_featured: true },
      { title: "Color Blocking Returns", slug: "color-blocking-returns", category: "Color", season: "Spring", year: 2026, growth_pct: 31, is_published: true, is_featured: false },
      { title: "Denim on Denim 2.0", slug: "denim-on-denim-2", category: "Style", season: "Summer", year: 2026, growth_pct: 27, is_published: true, is_featured: false },
      { title: "Bold Accessories Trend", slug: "bold-accessories-trend", category: "Accessories", season: "Fall", year: 2026, growth_pct: 22, is_published: false, is_featured: false },
    ]);
    if (error) console.error("fashion_trends:", error.message);
    else console.log("  fashion_trends ✅");
  }

  // --- 12. Profile (for dev testing) ---
  // Note: auth.users must exist first. This step requires an auth user to be created.
  // For now, check if there's any profile, skip if already seeded.
  if (!(await hasData("profiles"))) {
    console.log("  profiles ⏭️  (create via auth signup first, then seed profiles)");
  }

  // --- 13. Daily Metrics (aggregate data for dashboard) ---
  if (!(await hasData("daily_user_metrics"))) {
    const metrics = [
      { date: "2026-01-01", total_users: 1200, new_users: 80, active_users: 340 },
      { date: "2026-02-01", total_users: 1800, new_users: 95, active_users: 520 },
      { date: "2026-03-01", total_users: 2400, new_users: 110, active_users: 680 },
      { date: "2026-04-01", total_users: 3100, new_users: 135, active_users: 890 },
      { date: "2026-05-01", total_users: 4200, new_users: 160, active_users: 1120 },
      { date: "2026-06-01", total_users: 5800, new_users: 190, active_users: 1450 },
    ];

    const { error } = await supabase.from("daily_user_metrics").insert(metrics);
    if (error) console.error("daily_user_metrics:", error.message);
    else console.log("  daily_user_metrics ✅");
  }

  if (!(await hasData("daily_ai_metrics"))) {
    const metrics = [
      { date: "2026-01-01", total_generations: 5200, successful_generations: 4800, failed_generations: 400, avg_latency_ms: 1450, unique_users: 280 },
      { date: "2026-02-01", total_generations: 6800, successful_generations: 6400, failed_generations: 400, avg_latency_ms: 1320, unique_users: 410 },
      { date: "2026-03-01", total_generations: 9100, successful_generations: 8700, failed_generations: 400, avg_latency_ms: 1200, unique_users: 560 },
      { date: "2026-04-01", total_generations: 12400, successful_generations: 12000, failed_generations: 400, avg_latency_ms: 1100, unique_users: 720 },
      { date: "2026-05-01", total_generations: 15800, successful_generations: 15400, failed_generations: 400, avg_latency_ms: 980, unique_users: 940 },
      { date: "2026-06-01", total_generations: 19200, successful_generations: 18800, failed_generations: 400, avg_latency_ms: 850, unique_users: 1200 },
    ];
    const { error } = await supabase.from("daily_ai_metrics").insert(metrics);
    if (error) console.error("daily_ai_metrics:", error.message);
    else console.log("  daily_ai_metrics ✅");
  }

  if (!(await hasData("daily_affiliate_metrics"))) {
    const metrics = [
      { date: "2026-01-01", total_clicks: 420, unique_users: 85, total_estimated_commission: 1250000 },
      { date: "2026-02-01", total_clicks: 680, unique_users: 132, total_estimated_commission: 2100000 },
      { date: "2026-03-01", total_clicks: 1100, unique_users: 210, total_estimated_commission: 3500000 },
      { date: "2026-04-01", total_clicks: 1650, unique_users: 310, total_estimated_commission: 5200000 },
      { date: "2026-05-01", total_clicks: 2200, unique_users: 420, total_estimated_commission: 7100000 },
      { date: "2026-06-01", total_clicks: 2900, unique_users: 550, total_estimated_commission: 9400000 },
    ];
    const { error } = await supabase.from("daily_affiliate_metrics").insert(metrics);
    if (error) console.error("daily_affiliate_metrics:", error.message);
    else console.log("  daily_affiliate_metrics ✅");
  }

  if (!(await hasData("daily_revenue_metrics"))) {
    const metrics = [
      { date: "2026-01-01", gross_revenue: 5800000, net_revenue: 5200000, refunds: 600000, new_subscriptions: 45, cancelled_subscriptions: 12, mrr: 28000000, arr: 336000000 },
      { date: "2026-02-01", gross_revenue: 7200000, net_revenue: 6600000, refunds: 600000, new_subscriptions: 52, cancelled_subscriptions: 15, mrr: 34000000, arr: 408000000 },
      { date: "2026-03-01", gross_revenue: 9400000, net_revenue: 8700000, refunds: 700000, new_subscriptions: 68, cancelled_subscriptions: 18, mrr: 42000000, arr: 504000000 },
      { date: "2026-04-01", gross_revenue: 12100000, net_revenue: 11300000, refunds: 800000, new_subscriptions: 82, cancelled_subscriptions: 20, mrr: 51000000, arr: 612000000 },
      { date: "2026-05-01", gross_revenue: 15600000, net_revenue: 14700000, refunds: 900000, new_subscriptions: 95, cancelled_subscriptions: 22, mrr: 62000000, arr: 744000000 },
      { date: "2026-06-01", gross_revenue: 19800000, net_revenue: 18800000, refunds: 1000000, new_subscriptions: 110, cancelled_subscriptions: 25, mrr: 75000000, arr: 900000000 },
    ];
    const { error } = await supabase.from("daily_revenue_metrics").insert(metrics);
    if (error) console.error("daily_revenue_metrics:", error.message);
    else console.log("  daily_revenue_metrics ✅");
  }

  // --- 14. Wardrobe Items, Outfits, Activity ---
  if (!(await hasData("wardrobe_items")) && (await hasData("style_presets")) && (await hasData("product_categories"))) {
    // Need an auth user for FK constraints. Create one if none exists.
    let userId = null;
    const { data: existingProfiles } = await supabase.from("profiles").select("id").limit(1);
    if (existingProfiles?.length > 0) {
      userId = existingProfiles[0].id;
      console.log(`  Using existing user: ${userId.slice(0, 8)}...`);
    } else {
      // Create a test auth user via admin API
      const { data: createdUser, error: createErr } = await supabase.auth.admin.createUser({
        email: "test@redo.ai",
        password: "Test123456!",
        email_confirm: true,
        user_metadata: { display_name: "Test User" },
      });
      if (createErr) {
        console.error("  Failed to create test user:", createErr.message);
        console.log("  wardrobe_items/outfits/activity ⏭️  (no auth user available)");
      } else {
        userId = createdUser.user.id;
        console.log(`  Created test user: ${userId.slice(0, 8)}... (test@redo.ai / Test123456!)`);

        // Also create a profile row
        const { error: profErr } = await supabase.from("profiles").insert({
          id: userId,
          email: "test@redo.ai",
          display_name: "Test User",
          quiz_completed: true,
        });
        if (profErr) console.error("  profile insert:", profErr.message);
      }
    }

    if (userId) {
      const { data: cats } = await supabase.from("product_categories").select("id, slug");
      const { data: styles } = await supabase.from("style_presets").select("id, slug");
      const catMap = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
      const styleMap = Object.fromEntries(styles.map((s) => [s.slug, s.id]));

      const wardrobeItems = [
        { name: "Áo thun trắng basic", color: "Trắng", brand: "Uniqlo", category: "tops", style: "casual" },
        { name: "Quần jeans ống rộng", color: "Xanh denim", brand: "Levi's", category: "bottoms", style: "casual" },
        { name: "Áo blazer đen", color: "Đen", brand: "Zara", category: "outerwear", style: "office" },
        { name: "Váy midi hoa nhí", color: "Hoa", brand: "Mango", category: "dresses", style: "date-night" },
        { name: "Giày sneaker trắng", color: "Trắng", brand: "Nike", category: "shoes", style: "athleisure" },
        { name: "Áo hoodie xám", color: "Xám", brand: "Adidas", category: "outerwear", style: "streetwear" },
        { name: "Quần tây đen", color: "Đen", brand: "H&M", category: "bottoms", style: "office" },
        { name: "Túi tote canvas", color: "Beige", brand: "Maison", category: "accessories", style: "minimal" },
        { name: "Áo sơ mi lụa hồng", color: "Hồng", brand: "G2000", category: "tops", style: "date-night" },
        { name: "Giày cao gót đen", color: "Đen", brand: "Charles & Keith", category: "shoes", style: "party" },
      ];

      const { data: insertedItems, error: wiErr } = await supabase
        .from("wardrobe_items")
        .insert(wardrobeItems.map((w) => ({
          user_id: userId,
          name: w.name,
          category_id: catMap[w.category] || null,
          style_preset_id: styleMap[w.style] || null,
          color: w.color,
          brand: w.brand,
          is_favorite: Math.random() > 0.5,
        })))
        .select("id");
      if (wiErr) console.error("  wardrobe_items:", wiErr.message);
      else console.log("  wardrobe_items ✅");

      const outfitData = [
        { name: "Dạo phố cuối tuần", style: "casual", source: "ai" },
        { name: "Hẹn hò tối thứ 7", style: "date-night", source: "ai" },
        { name: "Họp công sở", style: "office", source: "user" },
        { name: "Tập gym sáng", style: "athleisure", source: "user" },
        { name: "Tiệc sinh nhật", style: "party", source: "ai" },
        { name: "Phong cách đường phố", style: "streetwear", source: "trend" },
        { name: "Cà phê cuối tuần", style: "casual", source: "user" },
        { name: "Tối giản sang trọng", style: "minimal", source: "ai" },
      ];

      const { data: insertedOutfits, error: ofErr } = await supabase
        .from("outfits")
        .insert(outfitData.map((o) => ({
          user_id: userId,
          name: o.name,
          style_preset_id: styleMap[o.style] || null,
          source: o.source,
          is_saved: Math.random() > 0.3,
        })))
        .select("id");
      if (ofErr) console.error("  outfits:", ofErr.message);
      else console.log("  outfits ✅");

      // Link outfits to wardrobe items
      if (insertedItems?.length && insertedOutfits?.length) {
        const itemIds = insertedItems.map((r) => r.id);
        for (const outfit of insertedOutfits) {
          const count = 2 + Math.floor(Math.random() * 3);
          const shuffled = [...itemIds].sort(() => Math.random() - 0.5).slice(0, count);
          const links = shuffled.map((itemId, i) => ({
            outfit_id: outfit.id,
            wardrobe_item_id: itemId,
            sort_order: i,
          }));
          const { error: liErr } = await supabase.from("outfit_items").insert(links);
          if (liErr) console.error("  outfit_items link error:", liErr.message);
        }
        console.log("  outfit_items ✅");
      }

      const activities = [
        { type: "outfit_created", desc: "Tạo outfit mới: Dạo phố cuối tuần" },
        { type: "outfit_saved", desc: "Lưu outfit: Hẹn hò tối thứ 7" },
        { type: "wardrobe_upload", desc: "Thêm 3 món đồ vào tủ đồ" },
        { type: "subscription_change", desc: "Nâng cấp lên gói Pro" },
        { type: "quiz_complete", desc: "Hoàn thành Style Quiz" },
        { type: "outfit_created", desc: "Tạo outfit: Phong cách đường phố" },
        { type: "trend_view", desc: "Xem xu hướng hè 2026" },
        { type: "outfit_saved", desc: "Lưu outfit: Tối giản sang trọng" },
        { type: "wardrobe_upload", desc: "Thêm áo blazer vào tủ đồ" },
        { type: "trend_view", desc: "Xem bảng màu xu hướng" },
      ];

      const { error: actErr } = await supabase.from("user_activity_log").insert(
        activities.map((a, i) => ({
          user_id: userId,
          activity_type: a.type,
          description: a.desc,
          created_at: new Date(Date.now() - i * 15 * 60 * 1000).toISOString(),
        }))
      );
      if (actErr) console.error("  user_activity_log:", actErr.message);
      else console.log("  user_activity_log ✅");
    }
  } else {
    if (await hasData("wardrobe_items")) console.log("  wardrobe_items/outfits/activity ⏭️  (already seeded)");
    else console.log("  wardrobe_items/outfits/activity ⏭️  (dependency tables not found)");
  }

  // --- 15. User Reports (Feedback) ---
  if (!(await hasData("user_reports"))) {
    const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
    const reporterId = profiles?.[0]?.id ?? null;

    const reports = [
      { type: "Incorrect AI Recommendation", priority: "High", status: "pending", detail: "Outfit suggested winter coat for summer occasion" },
      { type: "Broken Shopping Link", priority: "Medium", status: "in_review", detail: "Shopee link for white sneakers returns 404" },
      { type: "Wrong Wardrobe Detection", priority: "High", status: "pending", detail: "AI detected pants as skirt" },
      { type: "General Feedback", priority: "Low", status: "resolved", detail: "Would love more Korean style options" },
      { type: "Incorrect AI Recommendation", priority: "Medium", status: "in_review", detail: "Color recommendations clash with uploaded wardrobe" },
      { type: "Wrong Wardrobe Detection", priority: "High", status: "pending", detail: "Bag detected as shoe" },
    ];

    const { error: rErr } = await supabase.from("user_reports").insert(
      reports.map((r) => ({
        reporter_id: reporterId,
        report_type: r.type,
        reason: r.detail,
        description: r.detail,
        status: r.status,
      }))
    );
    if (rErr) console.error("  user_reports:", rErr.message);
    else console.log("  user_reports ✅");
  } else {
    console.log("  user_reports ⏭️  (already seeded)");
  }

  console.log("=== Seed complete ===");
}

main().catch(console.error);
