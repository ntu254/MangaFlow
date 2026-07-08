import { supabase } from "@/shared/lib";
import { apiClient } from "@/shared/api";
import { apiConfig } from "@/shared/api/config";
import type { WardrobeAnalysis, WardrobeItem } from "../types";
import type { Database } from "@/features/admin/types";

type DbWardrobeItem = Database["public"]["Tables"]["wardrobe_items"]["Row"];

export interface WardrobeOverview {
  itemCount: number;
  savedOutfits: number;
  aiSuggestions: number;
}

export interface WardrobeUploadAnalysis {
  detectedName: string;
  detectedCategory: string;
  detectedType: string;
  detectedColor: string;
  detectedTags: string[];
  suggestion: Array<{ role: string; name: string; color: string }>;
}

export interface CreateItemPayload {
  name: string;
  imageBase64: string;
  mimeType: string;
  category: string;
  type: string;
  color: string;
  tags: string[];
}

export interface ItemUpdatePayload {
  name?: string;
  category?: string;
  color?: string;
  tags?: string[];
  season?: string;
}

const UUID_TO_ID = (uuid: string): number => {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = ((hash << 5) - hash) + uuid.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const CATEGORY_LABELS: Record<string, string> = {
  "Tops": "Áo", "Bottoms": "Quần", "Shoes": "Giày",
  "Outerwear": "Áo khoác", "Accessories": "Phụ kiện", "Dresses": "Đầm",
};

const CATEGORY_UUIDS: Record<string, string> = {
  "Tops": "2e2271a7-64a2-42d3-9c82-d3db616b6c22",
  "Bottoms": "e2f65ada-0b9c-4579-a2bc-87b85b70cc8a",
  "Outerwear": "cb8ead0b-dd40-4605-b84a-dc864a669039",
  "Dresses": "9419a87c-ec80-45bf-a682-92d7cac82fe1",
  "Shoes": "9353a533-4270-4e84-9eae-c608247ce823",
  "Accessories": "31d71323-cd53-49ee-a0c3-d98892bc5db7",
};

const UUID_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_UUIDS).map(([k, v]) => [v, k])
);

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteArrays: Uint8Array[] = [];
  for (let offset = 0; offset < byteChars.length; offset += 512) {
    const slice = byteChars.slice(offset, offset + 512);
    const byteNums = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNums[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNums));
  }
  return new Blob(byteArrays, { type: mimeType });
}

function mapDbItem(w: DbWardrobeItem): WardrobeItem {
  return {
    id: UUID_TO_ID(w.id),
    name: w.name,
    category: (w.category_id && UUID_TO_CATEGORY[w.category_id]) ?? "Khác",
    color: w.color ?? "Khác",
    tags: [],
    image: w.image_url ?? undefined,
    season: "all_year",
    source: "manual" as const,
    dateAdded: w.created_at.slice(0, 10),
  };
}

async function callEdgeAnalyzeUpload(base64: string, mime: string): Promise<WardrobeUploadAnalysis | null> {
  try {
    const { data, error } = await supabase.functions.invoke("analyze-upload", {
      body: { imageBase64: base64, mimeType: mime },
    });
    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

async function callEdgeAnalyzeWardrobe(items: any[]): Promise<WardrobeAnalysis | null> {
  try {
    const { data, error } = await supabase.functions.invoke("analyze-wardrobe", {
      body: { items },
    });
    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

export const wardrobeService = {
  listItems: async (): Promise<WardrobeItem[]> => {
    if (apiConfig.useMockApi) {
      return apiClient.get<WardrobeItem[]>("/api/wardrobe/items");
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("wardrobe_items")
      .select("id, name, image_url, color, is_favorite, created_at, category_id, style_preset_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      if (
        error.message.includes("schema cache") ||
        error.message.includes("permission denied") ||
        error.code === "PGRST204" ||
        error.code === "PGRST116" ||
        error.code === "42P01" ||
        error.code === "42501" ||
        error.code === "PGRST301"
      ) {
        return [];
      }
      throw error;
    }

    if (data && data.length > 0) return data.map(mapDbItem);
    return [];
  },

  getOverview: async (): Promise<WardrobeOverview> => {
    if (apiConfig.useMockApi) {
      return apiClient.get<WardrobeOverview>("/api/wardrobe/overview");
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { itemCount: 0, savedOutfits: 0, aiSuggestions: 0 };
    
    let itemCount = 0;
    let savedOutfits = 0;
    
    try {
      const { count: ic, error: e1 } = await supabase
        .from("wardrobe_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (!e1) itemCount = ic ?? 0;
      
      const { count: so, error: e2 } = await supabase
        .from("outfits")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_saved", true);
      if (!e2) savedOutfits = so ?? 0;
    } catch (err) {
      // ignore schema errors
    }
    
    return {
      itemCount,
      savedOutfits,
      aiSuggestions: 0,
    };
  },

  getSuggestion: async () => {
    if (apiConfig.useMockApi) {
      return apiClient.get<Array<{ role: string; name: string; color: string }>>("/api/wardrobe/suggestion");
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data: items } = await supabase
      .from("wardrobe_items")
      .select("id, name, color, category_id")
      .eq("user_id", user.id);
    if (!items || items.length === 0) return [];

    const categories = new Set(items.map((i) => i.category_id));
    const suggestions: { role: string; name: string; color: string }[] = [];

    if (!categories.has("Shoes")) suggestions.push({ role: "Core", name: "Giày sneaker trắng", color: "Trắng" });
    if (!categories.has("Outerwear")) suggestions.push({ role: "Layer", name: "Áo khoác denim", color: "Xanh" });
    if (!categories.has("Accessories")) suggestions.push({ role: "Statement", name: "Túi tote da", color: "Nâu" });
    if (items.length < 3) suggestions.push({ role: "Core", name: "Áo thun trắng basic", color: "Trắng" });

    return suggestions;
  },

  analyzeUpload: async (file?: File): Promise<WardrobeUploadAnalysis> => {
    if (!apiConfig.useMockApi && file) {
      const base64 = await fileToBase64(file);

      const edgeResult = await callEdgeAnalyzeUpload(base64, file.type);
      if (edgeResult) return edgeResult;
    }
    return { detectedName: "New Item", detectedCategory: "Tops", detectedType: "Áo", detectedColor: "Khác", detectedTags: [], suggestion: [] };
  },

  addItem: async (payload: CreateItemPayload): Promise<WardrobeItem | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let imageUrl: string | null = null;
    if (payload.imageBase64) {
      const ext = payload.mimeType.split("/")[1] || "png";
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("wardrobe")
        .upload(fileName, base64ToBlob(payload.imageBase64, payload.mimeType), {
          contentType: payload.mimeType,
          upsert: false,
        });
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from("wardrobe")
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    }

    const { data, error } = await supabase
      .from("wardrobe_items")
      .insert({
        user_id: user.id,
        name: payload.name,
        color: payload.color,
        image_url: imageUrl,
        category_id: CATEGORY_UUIDS[payload.category] ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    if (data) return mapDbItem(data);
    return null;
  },

  getAnalysis: async (): Promise<WardrobeAnalysis> => {
    if (!apiConfig.useMockApi) {
      const { data: { user } } = await supabase.auth.getUser();
      const items = user ? await wardrobeService.listItems() : [];

      if (items.length === 0) {
        return {
          totalItems: 0, topCategory: "—", topColor: "—", topStyle: "—",
          colorPalette: [], categoryDistribution: [], styleDistribution: [],
          seasonBreakdown: [], consistencyScore: 0, dominantStyles: [], missingEssentials: [],
        };
      }

      const cats = items.reduce<Record<string, number>>((acc, i) => {
        acc[i.category] = (acc[i.category] ?? 0) + 1; return acc;
      }, {});
      const colors = items.reduce<Record<string, number>>((acc, i) => {
        acc[i.color] = (acc[i.color] ?? 0) + 1; return acc;
      }, {});
      const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Khác";
      const topColor = Object.entries(colors).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Khác";

      const edgeResult = await callEdgeAnalyzeWardrobe(items);
      if (edgeResult) return edgeResult;

      return {
        totalItems: items.length,
        topCategory: CATEGORY_LABELS[topCat] ?? topCat,
        topColor,
        topStyle: "Casual",
        colorPalette: Object.entries(colors).slice(0, 5).map(([color, count]) => ({ color, count, label: color })),
        categoryDistribution: Object.entries(cats).map(([category, count]) => ({ category, count })),
        styleDistribution: [{ style: "Casual", count: items.length }],
        seasonBreakdown: [{ season: "All Year", count: items.length }],
        consistencyScore: Math.min(85, items.length * 15),
        dominantStyles: ["Casual"],
        missingEssentials: items.length < 5 ? ["Áo thun trắng", "Quần jeans", "Giày sneaker"] : [],
      };
    }
    return apiClient.get<WardrobeAnalysis>("/api/wardrobe/analysis");
  },

  deleteItem: async (id: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: items, error: selectError } = await supabase
      .from("wardrobe_items")
      .select("id")
      .eq("user_id", user.id)
      .limit(100);

    if (selectError) {
      if (selectError.code === "PGRST116" || selectError.code === "42P01") return;
      throw selectError;
    }

    const dbItem = items?.find((item) => UUID_TO_ID(item.id) === id);
    if (dbItem) {
      const { error: deleteError } = await supabase.from("wardrobe_items").delete().eq("id", dbItem.id);
      if (deleteError) throw deleteError;
    }
  },

  updateItem: async (id: number, payload: ItemUpdatePayload) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { id, ...payload } as WardrobeItem;

    const updatePayload: Record<string, unknown> = {};
    if (payload.name !== undefined) updatePayload.name = payload.name;
    if (payload.color !== undefined) updatePayload.color = payload.color;
    if (payload.category !== undefined) updatePayload.category_id = CATEGORY_UUIDS[payload.category] ?? null;

    const { data, error } = await supabase
      .from("wardrobe_items")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116" || error.code === "42P01") return { id, ...payload } as WardrobeItem;
      throw error;
    }

    if (data) return mapDbItem(data);
    return { id, ...payload } as WardrobeItem;
  },
};
