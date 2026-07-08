import { supabase } from "@/shared/lib";

export interface SavedAiOutfit {
  id: string;
  user_id: string;
  style: string | null;
  prompt: string | null;
  image_url: string | null;
  is_saved: boolean;
  is_generated: boolean;
  created_at: string;
}

export interface SavedAiOutfitItem {
  outfit_id: string;
  name: string;
  image_url: string | null;
  price: number | null;
  brand: string | null;
  affiliate_url: string | null;
  slot: string | null;
  created_at: string;
}

export interface CreateSavedAiOutfitPayload {
  style?: string | null;
  prompt?: string | null;
  imageBase64?: string | null;
  mimeType?: string | null;
  items?: Array<{
    name: string;
    image_url?: string | null;
    price?: number | null;
    brand?: string | null;
    affiliate_url?: string | null;
    slot?: string | null;
  }>;
}

export const aiOutfitsService = {
  async listSaved(): Promise<SavedAiOutfit[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("outfits")
      .select("id, style, prompt, image_url, is_saved, is_generated, created_at")
      .eq("user_id", user.id)
      .eq("is_saved", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async deleteSaved(id: string): Promise<void> {
    const { error } = await supabase.from("outfits").delete().eq("id", id);
    if (error) throw error;
  },

  async createSaved(payload: CreateSavedAiOutfitPayload): Promise<SavedAiOutfit> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    const imagePath = payload.imageBase64
      ? `${user.id}/ai-outfit/${Date.now()}.png`
      : null;

    if (imagePath) {
      const { error: uploadError } = await supabase.storage
        .from("wardrobe")
        .upload(imagePath, bufferFromBase64(payload.imageBase64), {
          contentType: payload.mimeType ?? "image/png",
          upsert: false,
        });

      if (uploadError) throw uploadError;
    }

    const imageUrl = imagePath
      ? supabase.storage.from("wardrobe").getPublicUrl(imagePath).data.publicUrl
      : null;

    const { data: outfit, error } = await supabase
      .from("outfits")
      .insert({
        user_id: user.id,
        style: payload.style ?? null,
        prompt: payload.prompt ?? null,
        image_url: imageUrl,
        is_saved: true,
        is_generated: true,
      })
      .select("*")
      .single();

    if (error) throw error;

    if (outfit && payload.items?.length) {
      const rows = payload.items.map((item) => ({
        outfit_id: outfit.id,
        name: item.name,
        image_url: item.image_url ?? null,
        price: item.price ?? null,
        brand: item.brand ?? null,
        affiliate_url: item.affiliate_url ?? null,
        slot: item.slot ?? null,
      }));

      const { error: itemsError } = await supabase.from("outfit_items").insert(rows);
      if (itemsError) throw itemsError;
    }

    return outfit;
  },
};

function bufferFromBase64(base64: string): Blob {
  const byteChars = atob(base64);
  const byteArrays: Uint8Array[] = [];
  for (let offset = 0; offset < byteChars.length; offset += 512) {
    const slice = byteChars.slice(offset, offset + 512);
    const nums = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      nums[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(nums));
  }
  return new Blob(byteArrays, { type: "image/png" });
}
