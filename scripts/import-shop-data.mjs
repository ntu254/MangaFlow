import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// --- Configuration & Fallbacks ---
const SUPABASE_URL = "https://trywdfggzrzbwndwrerg.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyeXdkZmdnenJ6YnduZHdyZXJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc3Njc3NCwiZXhwIjoyMDk1MzUyNzc0fQ.cYTf_WS8LRh1zMaPl7XWJ_g20qCgXh77nCq1g0gJTiE";

// Read GEMINI_API_KEY from .env file
let geminiApiKey = process.env.GEMINI_API_KEY || "";
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/^(?:VITE_)?GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)/m);
  if (match && match[1]) {
    geminiApiKey = match[1].trim();
  }
} catch (e) {
  // Ignore error reading .env
}

if (!geminiApiKey) {
  console.warn("⚠️  CẢNH BÁO: Không tìm thấy GEMINI_API_KEY trong file .env hoặc môi trường.");
  console.warn("Hệ thống RAG cần vector embeddings để tìm kiếm tương đồng. Vui lòng thêm GEMINI_API_KEY=your_key vào file .env và chạy lại script.");
  console.warn("Script sẽ tạm dừng. Hãy bấm Ctrl+C hoặc thêm key để tiếp tục.\n");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DATA_DIR = 'supabase/data';

// Helper to classify categories from title
function classifyCategory(name) {
  if (!name || typeof name !== 'string') return "tops";
  const n = name.toLowerCase();
  if (n.includes("áo khoác") || n.includes("hoodie") || n.includes("jacket") || n.includes("blazer") || n.includes("cardigan")) {
    return "outerwear";
  }
  if (n.includes("đầm") || n.includes("váy") || n.includes("dress") || n.includes("babydoll")) {
    if (n.includes("chân váy") || n.includes("skirt")) {
      return "bottoms";
    }
    return "dresses";
  }
  if (n.includes("áo") || n.includes("tee") || n.includes("shirt") || n.includes("croptop") || n.includes("phông")) {
    return "tops";
  }
  if (n.includes("quần") || n.includes("jeans") || n.includes("kaki") || n.includes("pants") || n.includes("trousers") || n.includes("shorts") || n.includes("jogger") || n.includes("legging")) {
    return "bottoms";
  }
  if (n.includes("giày") || n.includes("sneaker") || n.includes("sandal") || n.includes("heels") || n.includes("dép") || n.includes("boots")) {
    return "shoes";
  }
  if (n.includes("túi") || n.includes("ví") || n.includes("kính") || n.includes("belt") || n.includes("thắt lưng") || n.includes("mũ") || n.includes("nón") || n.includes("vòng cổ") || n.includes("ribbon") || n.includes("phụ kiện") || n.includes("khuyên tai") || n.includes("accessories")) {
    return "accessories";
  }
  return "tops"; // Default fallback
}

// Helper to parse price to standard numeric VND values
function parsePrice(p) {
  if (typeof p === "number") {
    return p < 10000 ? p * 1000 : p;
  }
  if (typeof p === "string") {
    const clean = p.replace(/[^0-9]/g, "");
    const val = parseInt(clean, 10) || 0;
    return val < 10000 ? val * 1000 : val;
  }
  return 0;
}

// Generate batch embeddings via Gemini API with retry on 429 rate limit
async function getBatchEmbeddings(texts, apiKey, retries = 3) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${apiKey}`;
  const requests = texts.map((text) => ({
    model: "models/gemini-embedding-001",
    content: { parts: [{ text }] },
    outputDimensionality: 768,
  }));

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests }),
      });

      if (response.status === 429) {
        console.warn(`⚠️  Bị giới hạn tốc độ (Rate Limit 429). Đang chờ 18 giây trước khi thử lại (lần ${attempt}/${retries})...`);
        await new Promise((r) => setTimeout(r, 18000));
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Embedding API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      return data.embeddings.map((e) => e.values);
    } catch (e) {
      if (attempt === retries) throw e;
      console.warn(`⚠️  Lỗi kết nối hoặc API: ${e.message}. Đang thử lại sau 5 giây...`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function main() {
  console.log("=== Đang lấy danh sách Categories & Sources từ DB... ===");
  const { data: categories, error: catErr } = await supabase.from("product_categories").select("id, slug");
  if (catErr) throw new Error("Lỗi lấy categories: " + catErr.message);
  const catMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));

  const { data: sources, error: srcErr } = await supabase.from("product_sources").select("id, platform");
  if (srcErr) throw new Error("Lỗi lấy sources: " + srcErr.message);
  
  // Normalize source keys to lowercase
  const sourceMap = {};
  for (const s of sources) {
    if (s.platform.toLowerCase().includes("shopee")) {
      sourceMap["shopee"] = s.id;
    } else if (s.platform.toLowerCase().includes("tiktok")) {
      sourceMap["tiktok"] = s.id;
    }
  }

  const normalizedProducts = [];

  // 1. Parse shop_clean (1).json
  const shopCleanPath = path.join(DATA_DIR, 'shop_clean (1).json');
  if (fs.existsSync(shopCleanPath)) {
    console.log("Đang đọc shop_clean (1).json...");
    const shopClean = JSON.parse(fs.readFileSync(shopCleanPath, 'utf8'));

    // Parse TikTok products
    if (Array.isArray(shopClean.tiktok)) {
      console.log(`- Tìm thấy ${shopClean.tiktok.length} sản phẩm TikTok`);
      for (const p of shopClean.tiktok) {
        const catSlug = classifyCategory(p.title || p.name);
        normalizedProducts.push({
          name: p.title || p.name || "Sản phẩm thời trang",
          description: p.description || p.title || p.name || "Sản phẩm thời trang",
          image_url: p.image_url,
          price: parsePrice(p.price),
          currency: "VND",
          category_id: catMap[catSlug],
          source_id: sourceMap["tiktok"],
          source_product_id: p.product_url.split("/").pop() || Math.random().toString(36).substring(7),
          affiliate_url: p.product_url,
          commission_rate: 8.5,
          is_active: true,
          metadata: {
            brand: p.brand || "",
            category: catSlug,
            platform: "TikTok Shop",
            rating: parseFloat(p.rating) || 5.0,
            sold: p.sold || "0 sold",
            discount: p.discount || null,
            badge: p.badge || null
          }
        });
      }
    }

    // Parse Shopee products
    if (Array.isArray(shopClean.shopee)) {
      console.log(`- Tìm thấy ${shopClean.shopee.length} sản phẩm Shopee`);
      for (const p of shopClean.shopee) {
        const catSlug = classifyCategory(p.title || p.name);
        normalizedProducts.push({
          name: p.title || p.name || "Sản phẩm thời trang",
          description: p.description || p.title || p.name || "Sản phẩm thời trang",
          image_url: p.image_url,
          price: parsePrice(p.price),
          currency: "VND",
          category_id: catMap[catSlug],
          source_id: sourceMap["shopee"],
          source_product_id: p.product_url.split("i.")[1]?.split("?")[0] || Math.random().toString(36).substring(7),
          affiliate_url: p.product_url,
          commission_rate: 8.5,
          is_active: true,
          metadata: {
            brand: "",
            category: catSlug,
            platform: "Shopee",
            rating: parseFloat(p.rating) || 5.0,
            sold: p.sold || "0 sold",
            location: p.location || ""
          }
        });
      }
    }
  }

  // 2. Parse Shopee Search datasets
  const shopeeFiles = [
    'dataset_shopee-search_2026-06-02_05-41-41-484 (1).json',
    'dataset_shopee-search_2026-06-02_05-45-53-024 (1).json'
  ];

  for (const filename of shopeeFiles) {
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      console.log(`Đang đọc ${filename}...`);
      const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`- Tìm thấy ${items.length} sản phẩm`);
      for (const p of items) {
        const catSlug = classifyCategory(p.name || p.title);
        normalizedProducts.push({
          name: p.name || p.title || "Sản phẩm thời trang",
          description: p.description || p.name || p.title || "Sản phẩm thời trang",
          image_url: p.image_url,
          price: parsePrice(p.price),
          currency: "VND",
          category_id: catMap[catSlug],
          source_id: sourceMap["shopee"],
          source_product_id: String(p.item_id),
          affiliate_url: p.url,
          commission_rate: 8.5,
          is_active: true,
          metadata: {
            brand: "",
            category: catSlug,
            platform: "Shopee",
            rating: parseFloat(p.rating) || 5.0,
            sold: p.sold_count ? `${p.sold_count} sold` : "0 sold",
            discount: p.discount_pct ? `-${p.discount_pct}%` : null,
            location: p.location || ""
          }
        });
      }
    }
  }

  console.log(`\n=== Tổng số sản phẩm đã chuẩn hóa: ${normalizedProducts.length} ===`);

  // To prevent timeouts or high API fees, we can limit the import to a representative set, e.g., 200 products
  // unless API key is set and user wants to import all.
  const targetProducts = normalizedProducts.slice(0, 300); // Grab a nice representative slice of 300 products
  console.log(`-> Sẽ tiến hành nhập ${targetProducts.length} sản phẩm vào cơ sở dữ liệu.`);

  const skipEmbeddings = process.argv.includes('--no-embeddings');

  if (!geminiApiKey && !skipEmbeddings) {
    console.log("❌ Không có GEMINI_API_KEY. Không thể tạo RAG embeddings. Dừng script.");
    console.log("Mẹo: Để nhập sản phẩm mà không cần tạo embeddings (chỉ để hiển thị, không dùng được vector search), hãy chạy script với flag: node scripts/import-shop-data.mjs --no-embeddings");
    process.exit(1);
  }

  console.log("\n=== Bắt đầu tạo embeddings và insert vào DB... ===");
  const batchSize = 50;
  let successCount = 0;

  for (let i = 0; i < targetProducts.length; i += batchSize) {
    const chunk = targetProducts.slice(i, i + batchSize);
    console.log(`Đang xử lý lô ${Math.floor(i / batchSize) + 1}/${Math.ceil(targetProducts.length / batchSize)} (sản phẩm ${i + 1} - ${i + chunk.length})...`);
    
    try {
      // 1. Create embeddings for the batch
      let embeddings = [];
      if (!skipEmbeddings) {
        const textsToEmbed = chunk.map(p => `${p.name} ${p.description || ""} ${p.metadata?.category || ""}`);
        embeddings = await getBatchEmbeddings(textsToEmbed, geminiApiKey);
      }
      
      // 2. Attach embeddings to products
      const productsToInsert = chunk.map((p, idx) => ({
        ...p,
        embedding: skipEmbeddings ? null : embeddings[idx]
      }));

      // 3. Upsert into Supabase products table (avoiding duplicates on source_product_id)
      for (const prod of productsToInsert) {
        // Check if existing product
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("source_product_id", prod.source_product_id)
          .maybeSingle();

        if (existing) {
          const { error: updErr } = await supabase
            .from("products")
            .update({ ...prod, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
          if (updErr) console.error(`  - Lỗi update [${prod.name}]: ${updErr.message}`);
        } else {
          const { error: insErr } = await supabase
            .from("products")
            .insert(prod);
          if (insErr) console.error(`  - Lỗi insert [${prod.name}]: ${insErr.message}`);
        }
      }

      successCount += chunk.length;
      console.log(`✅ Lô xử lý thành công! Đã nhập lũy kế ${successCount} sản phẩm.`);
      
      // Sleep a bit to avoid hitting Gemini rate limits
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`❌ Lỗi xử lý lô:`, err.message);
    }
  }

  console.log(`\n=== HOÀN THÀNH! Đã nhập thành công ${successCount} sản phẩm vào database. ===`);
}

main().catch(console.error);
