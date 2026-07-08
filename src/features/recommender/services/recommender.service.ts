import { supabase } from "@/shared/lib";
import { apiClient } from "@/shared/api";
import { apiConfig } from "@/shared/api/config";
import type { Outfit, AIAction, Product } from "../types";
import { mapProfileContext, normalizeGender, type QuizProfileContext } from "./profile-context";

export interface GenerateRequest {
  prompt: string;
  style?: string;
  season?: string;
  occasion?: string;
  gender?: string | null;
  profileContext?: QuizProfileContext | null;
}

const FASHION_FALLBACKS = [
  "https://images.unsplash.com/photo-1551803091-e20673f15770?w=600&q=80",
  "https://images.unsplash.com/photo-1485518882345-15568b007407?w=600&q=80",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80",
  "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&q=80",
];

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

function uuidToId(uuid: string): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = ((hash << 5) - hash) + uuid.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickFallbackImage(id: string): string {
  return FASHION_FALLBACKS[uuidToId(id) % FASHION_FALLBACKS.length];
}

interface EdgeResponse {
  reply: string;
  outfits: Outfit[];
  suggestions: { label: string; prompt: string }[];
}

function addRuntimeFields(outfits: Outfit[]): Outfit[] {
  return outfits.map((o) => ({
    ...o,
    userSaved: false,
    userLiked: null,
    userHidden: false,
  }));
}

function isClearlyFemaleOnlyProduct(product: Product): boolean {
  const text = [
    product.name,
    product.brand,
  ].join(" ").toLowerCase();
  return FEMALE_ONLY_PRODUCT_SIGNALS.some((signal) => text.includes(signal));
}

function filterProductsForGender(products: Product[], gender?: string | null): Product[] {
  if (normalizeGender(gender) !== "male") return products;
  const filtered = products.filter((product) => !isClearlyFemaleOnlyProduct(product));
  return filtered.length > 0 ? filtered : products;
}

async function getUserProfileContext(userId: string): Promise<QuizProfileContext | null> {
  const { data } = await supabase
    .from("profiles")
    .select("style_dna, favorite_colors, preferred_styles, preferred_occasions, budget_min, budget_max, quiz_completed, fashion_preferences")
    .eq("id", userId)
    .maybeSingle();

  return data ? mapProfileContext(data) : null;
}

async function getCurrentUserProfileContext(): Promise<QuizProfileContext | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return null;
  return getUserProfileContext(user.id);
}

async function fetchProducts(limit = 12, gender?: string | null): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, currency, image_url, affiliate_url, category_id, source_id, metadata")
      .eq("is_active", true)
      .eq("is_hidden", false)
      .order("click_count", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) return [];

    const { data: srcs } = await supabase.from("product_sources").select("id, platform");
    const srcMap = Object.fromEntries((srcs ?? []).map((s: any) => [s.id, s.platform]));

    const products = data.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: `${Number(p.price).toLocaleString("vi-VN")}đ`,
      oldPrice: null,
      platform: srcMap[p.source_id] || "Shopee",
      badge: null,
      rating: 4.5,
      sold: "100+",
      brand: p.metadata?.brand || "",
      image: p.image_url || "",
      affiliateUrl: p.affiliate_url || "",
    }));
    return filterProductsForGender(products, gender);
  } catch (error) {
    console.error("fetchProducts failed:", error);
    return [];
  }
}

async function callEdgeConverse(
  message: string,
  history?: any[],
  gender?: string | null,
  profileContext?: QuizProfileContext | null,
): Promise<EdgeResponse | null> {
  try {
    const { data, error } = await supabase.functions.invoke("converse", {
      body: { message, history, gender, profileContext },
    });
    if (error) {
      // Check if this is a credit error (edge function returns 402)
      const errMsg = typeof error === "object" && error.message ? error.message : String(error);
      if (errMsg.includes("credit") || errMsg.includes("Credit")) {
        throw new Error("CREDIT_EXHAUSTED");
      }
      throw error;
    }
    return data;
  } catch (err) {
    // Re-throw credit errors so the UI can show the survey
    if (err instanceof Error && err.message === "CREDIT_EXHAUSTED") {
      throw err;
    }
    return null;
  }
}

async function callEdgeGenerate(req: GenerateRequest): Promise<Outfit[] | null> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-outfit", {
      body: {
        prompt: req.prompt,
        style: req.style,
        season: req.season,
        occasion: req.occasion,
        gender: req.gender,
        profileContext: req.profileContext,
      },
    });
    if (error) throw error;
    return addRuntimeFields(data);
  } catch {
    return null;
  }
}

async function fallbackConverse(prompt: string, gender?: string | null): Promise<EdgeResponse> {
  const products = await fetchProducts(12, gender);
  const lower = prompt.toLowerCase();

  const matched = products.filter((p) => {
    const text = `${p.name} ${p.brand} ${p.platform}`.toLowerCase();
    return lower.split(" ").some((w) => w.length > 2 && text.includes(w));
  });

  const pool = matched.length >= 3 ? matched : products;
  const groups: Outfit[] = [];

  for (let i = 0; i < Math.min(pool.length, 9); i += 3) {
    const chunk = pool.slice(i, i + 3);
    if (chunk.length === 0) break;
    const total = chunk.reduce((s, p) => s + Number(p.price.replace(/[^\d]/g, "")), 0);
    const idx = groups.length;
    groups.push({
      id: Date.now() + idx,
      title: `${prompt.slice(0, 30) || "Gợi ý"} - Set ${idx + 1}`,
      emoji: ["✨", "🔥", "💡"][idx] || "✨",
      image: chunk[0]?.image || pickFallbackImage(String(idx)),
      style: "Casual",
      styleTags: ["Casual", "AI"],
      aiMatch: true,
      aiComment: `Phối đồ phù hợp với yêu cầu "${prompt}". Tổng cộng ${total.toLocaleString("vi-VN")}đ.`,
      totalPrice: `${total.toLocaleString("vi-VN")}đ`,
      products: chunk,
      matchScore: 85 + Math.floor(Math.random() * 10),
      season: "all_year",
      occasion: "casual",
      mood: "Phù hợp",
    });
  }

  return {
    reply: `Đây là các gợi ý outfit phù hợp cho yêu cầu của bạn!`,
    outfits: addRuntimeFields(groups),
    suggestions: [
      { label: "Thoải mái hơn", prompt: "Làm outfit này thoải mái hơn" },
      { label: "Rẻ hơn", prompt: "Outfit tương tự dưới 1 triệu" },
      { label: "Hàn Quốc hơn", prompt: "Phối theo style Hàn Quốc" },
    ],
  };
}

async function fallbackGenerate(req: GenerateRequest): Promise<Outfit[]> {
  const products = await fetchProducts(12, req.gender);

  const shuffled = [...products].sort(() => Math.random() - 0.5);
  const groups: Outfit[] = [];

  for (let i = 0; i < Math.min(shuffled.length, 9); i += 3) {
    const chunk = shuffled.slice(i, i + 3);
    if (chunk.length === 0) break;
    const total = chunk.reduce((s, p) => s + Number(p.price.replace(/[^\d]/g, "")), 0);
    groups.push({
      id: Date.now() + i,
      title: `Outfit ${groups.length + 1}`,
      emoji: ["✨", "🔥", "💡"][groups.length] || "✨",
      image: chunk[0]?.image || pickFallbackImage(String(i)),
      style: req.style || "Casual",
      styleTags: [req.style || "Casual", "AI"],
      aiMatch: true,
      aiComment: `Phối đồ từ ${chunk.length} sản phẩm phù hợp.`,
      totalPrice: `${total.toLocaleString("vi-VN")}đ`,
      products: chunk,
      matchScore: 85 + Math.floor(Math.random() * 10),
      season: req.season || "all_year",
      occasion: req.occasion || "casual",
      mood: "AI Gợi ý",
    });
  }

  return addRuntimeFields(groups);
}

export const recommenderService = {
  fetchTrendingOutfits: async (): Promise<Outfit[]> => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, currency, image_url, affiliate_url, category_id, source_id, metadata, tags, trending_score, click_count")
        .eq("is_active", true)
        .eq("is_hidden", false)
        .order("trending_score", { ascending: false })
        .order("click_count", { ascending: false })
        .limit(30);

      if (error || !data || data.length === 0) return [];

      const { data: srcs } = await supabase.from("product_sources").select("id, platform");
      const srcMap = Object.fromEntries((srcs ?? []).map((s: any) => [s.id, s.platform]));

      const products: Product[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: `${Number(p.price).toLocaleString("vi-VN")}đ`,
        oldPrice: null,
        platform: srcMap[p.source_id] || "Shopee",
        badge: null,
        rating: 4.5,
        sold: "100+",
        brand: p.metadata?.brand || "",
        image: p.image_url || "",
        affiliateUrl: p.affiliate_url || "",
      }));

      const shuffled = [...products].sort(() => Math.random() - 0.5);
      const groups: Outfit[] = [];
      const titles = [
        "Phong cách công sở", "Năng động hàng ngày", "Dạo phố nhẹ nhàng",
        "Hẹn hò lãng mạn", "Cuối tuần thư giãn", "Sang trọng nổi bật",
        "Trẻ trung năng động", "Thanh lịch tối giản", "Nữ tính ngọt ngào",
      ];
      const tagPool = ["Thanh lịch", "Năng động", "Casual", "Nữ tính", "Tối giản", "Trẻ trung", "Sang trọng", "Basic"];

      for (let i = 0; i < Math.min(shuffled.length, 18); i += 3) {
        const chunk = shuffled.slice(i, i + 3);
        if (chunk.length === 0) break;
        const total = chunk.reduce((s, p) => s + Number(p.price.replace(/[^\d]/g, "")), 0);
        const groupIdx = groups.length;
        const tags = tagPool.sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));

        groups.push({
          id: Date.now() + groupIdx,
          title: titles[groupIdx] || `Set ${groupIdx + 1}`,
          emoji: ["", ""][groupIdx] || "",
          image: chunk[0]?.image || pickFallbackImage(String(i)),
          style: tags[0],
          styleTags: tags,
          aiMatch: true,
          aiComment: `${chunk.length} sản phẩm trending được phối từ kho thực tế.`,
          totalPrice: `${total.toLocaleString("vi-VN")}đ`,
          products: chunk,
          matchScore: 80 + Math.floor(Math.random() * 15),
          season: "all_year",
          occasion: "casual",
          mood: "Trending",
        });
      }

      return addRuntimeFields(groups);
    } catch {
      return [];
    }
  },

  listOutfits: async (): Promise<Outfit[]> => {
    const profileContext = await getCurrentUserProfileContext();
    const products = await fetchProducts(12, profileContext?.gender);
    if (products.length === 0) return [];

    const shuffled = [...products].sort(() => Math.random() - 0.5);
    const groups: Outfit[] = [];

    for (let i = 0; i < Math.min(shuffled.length, 9); i += 3) {
      const chunk = shuffled.slice(i, i + 3);
      if (chunk.length === 0) break;
      const total = chunk.reduce((s, p) => s + Number(p.price.replace(/[^\d]/g, "")), 0);
      groups.push({
        id: Date.now() + i,
        title: `Outfit ${groups.length + 1}`,
        emoji: ["✨", "🔥", "💡"][groups.length] || "✨",
        image: chunk[0]?.image || pickFallbackImage(String(i)),
        style: "Casual",
        styleTags: ["Casual"],
        aiMatch: true,
        aiComment: `Phối đồ từ ${chunk.length} sản phẩm.`,
        totalPrice: `${total.toLocaleString("vi-VN")}đ`,
        products: chunk,
        matchScore: 85 + Math.floor(Math.random() * 10),
        season: "all_year",
        occasion: "casual",
        mood: "Gợi ý",
      });
    }

    return addRuntimeFields(groups);
  },

  generate: async (req: GenerateRequest): Promise<Outfit[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    const profileContext = req.profileContext ?? (user ? await getUserProfileContext(user.id) : null);
    const gender = req.gender ?? profileContext?.gender ?? null;
    const request = { ...req, gender, profileContext };
    if (user) {
      await (supabase as any)
        .from("outfits")
        .insert({ user_id: user.id, name: req.prompt.slice(0, 100), source: "ai" } as any);
    }
    const edgeResult = await callEdgeGenerate(request);
    if (edgeResult) return edgeResult;
    return fallbackGenerate(request);
  },

  converse: async (prompt: string): Promise<EdgeResponse> => {
    const { data: { user } } = await supabase.auth.getUser();
    const profileContext = user ? await getUserProfileContext(user.id) : null;
    const gender = profileContext?.gender ?? null;
    const edgeResult = await callEdgeConverse(prompt, undefined, gender, profileContext);
    if (edgeResult) return edgeResult;
    if (user) return fallbackConverse(prompt, gender);
    return {
      reply: "Bạn hãy đăng nhập để nhận gợi ý cá nhân hóa nhé!",
      outfits: [],
      suggestions: [],
    };
  },

  applyAction: async (outfitId: number, action: AIAction): Promise<Outfit[]> => {
    const profileContext = await getCurrentUserProfileContext();
    const gender = profileContext?.gender ?? null;
    const edgeResult = await callEdgeGenerate({ prompt: `Apply ${action} to outfit ${outfitId}`, gender, profileContext });
    if (edgeResult) return edgeResult;
    return fallbackGenerate({ prompt: action, gender });
  },

  toggleSave: async (id: number, saved: boolean): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: outfits } = await (supabase as any)
      .from("outfits")
      .select("id")
      .eq("user_id", user.id)
      .limit(100);
    const dbOutfit = outfits?.find((o: any) => uuidToId(o.id) === id);
    if (dbOutfit) {
      const { error } = await (supabase as any)
        .from("outfits")
        .update({ is_saved: saved } as any)
        .eq("id", (dbOutfit as any).id);
      if (!error) {
        await (supabase as any).from("user_activity_log").insert({
          user_id: user.id,
          activity_type: "outfit_saved",
          description: saved ? `Đã lưu outfit` : `Đã bỏ lưu outfit`,
          metadata: { outfit_id: (dbOutfit as any).id }
        } as any);
        return true;
      }
    }
    return false;
  },
};
