import { beforeEach, describe, it, expect, vi } from "vitest";

const outfit = {
  id: 1,
  title: "Mock outfit",
  emoji: "✨",
  image: "https://example.com/1.jpg",
  style: "Casual",
  styleTags: ["Casual", "AI"],
  aiMatch: true,
  aiComment: "AI describes this outfit.",
  totalPrice: "600000đ",
  products: [
    {
      id: 1,
      name: "Áo thun trắng basic",
      brand: "Basics",
      platform: "Shopee",
      price: "199000",
      image: "https://example.com/1.jpg",
      affiliateUrl: "https://example.com/1/aff",
      metadata: { brand: "Basics" },
    },
  ],
  matchScore: 90,
  season: "all_year",
  occasion: "casual",
  mood: "Gợi ý",
  userSaved: false,
  userLiked: null,
  userHidden: false,
};

vi.mock("@/shared/lib", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { recommenderService } from "./recommender.service";

describe("recommender.service edge cases", () => {
  beforeEach(async () => {
    const { supabase } = await import("@/shared/lib");
    vi.clearAllMocks();
    (supabase.from as any).mockReset();
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null }, error: null });
    (supabase.functions.invoke as any).mockResolvedValue({ data: null, error: null });
  });

  it("fetchTrendingOutfits returns empty when products query errors", async () => {
    const { supabase } = await import("@/shared/lib");
    supabase.from.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              order: () => ({
                limit: async () => ({ data: null, error: new Error("db error") }),
              }),
            }),
          }),
        }),
      }),
    });

    const res = await recommenderService.fetchTrendingOutfits();
    expect(res).toEqual([]);
  });

  it("listOutfits returns empty when no products available", async () => {
    const { supabase } = await import("@/shared/lib");
    (supabase.auth.getUser as any).mockResolvedValueOnce({ data: { user: null }, error: null });
    supabase.from.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }),
      }),
    });
    supabase.from.mockReturnValueOnce({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
    });

    const res = await recommenderService.listOutfits();
    expect(res).toEqual([]);
  });

  it("generate uses fallback when edge function fails and no user", async () => {
    const { supabase } = await import("@/shared/lib");
    (supabase.auth.getUser as any).mockResolvedValueOnce({ data: { user: null }, error: null });
    (supabase.functions.invoke as any).mockRejectedValueOnce(new Error("edge fail"));
    supabase.from.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }),
      }),
    });

    const res = await recommenderService.generate({ prompt: "thời trang" });
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThanOrEqual(0);
  });

  it("generate fallback excludes women-only products for male users", async () => {
    const { supabase } = await import("@/shared/lib");
    (supabase.auth.getUser as any).mockResolvedValueOnce({ data: { user: { id: "user-male" } }, error: null });
    (supabase.functions.invoke as any).mockRejectedValueOnce(new Error("edge fail"));

    supabase.from.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              style_dna: { minimal: 70, office: 30 },
              favorite_colors: ["black", "navy"],
              preferred_styles: ["minimal", "office"],
              preferred_occasions: ["work"],
              budget_min: 200000,
              budget_max: 500000,
              quiz_completed: true,
              fashion_preferences: { gender: "male" },
            },
            error: null,
          }),
        }),
      }),
    });
    supabase.from.mockReturnValueOnce({
      insert: async () => ({ data: null, error: null }),
    });
    supabase.from.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({
                data: [
                  { id: "dress-1", name: "Đầm sequin vàng midi", price: 1250000, image_url: "dress.jpg", affiliate_url: "", source_id: "src-1", metadata: { brand: "Elise" } },
                  { id: "shirt-1", name: "Áo thun nam basic", price: 199000, image_url: "shirt.jpg", affiliate_url: "", source_id: "src-1", metadata: { brand: "YODY" } },
                  { id: "pants-1", name: "Quần âu nam ống đứng", price: 380000, image_url: "pants.jpg", affiliate_url: "", source_id: "src-1", metadata: { brand: "Aristino" } },
                  { id: "sneaker-1", name: "Sneakers trắng unisex", price: 520000, image_url: "sneaker.jpg", affiliate_url: "", source_id: "src-1", metadata: { brand: "Ananas" } },
                ],
                error: null,
              }),
            }),
          }),
        }),
      }),
    });
    supabase.from.mockReturnValueOnce({
      select: async () => ({ data: [{ id: "src-1", platform: "Shopee" }], error: null }),
    });

    const res = await recommenderService.generate({ prompt: "outfit đi làm" });
    const productNames = res.flatMap((outfit) => outfit.products.map((product) => product.name.toLowerCase()));

    expect(productNames.length).toBeGreaterThan(0);
    expect(productNames.some((name) => name.includes("đầm") || name.includes("sequin"))).toBe(false);
    expect(productNames.some((name) => name.includes("nam") || name.includes("unisex"))).toBe(true);
  });

  it("generate sends quiz profile context from profiles to the edge function", async () => {
    const { supabase } = await import("@/shared/lib");
    (supabase.auth.getUser as any).mockResolvedValueOnce({ data: { user: { id: "user-profile" } }, error: null });
    (supabase.functions.invoke as any).mockResolvedValueOnce({ data: [outfit], error: null });

    supabase.from.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              style_dna: { minimal: 70, streetwear: 30 },
              favorite_colors: ["black", "white"],
              preferred_styles: ["minimal", "streetwear"],
              preferred_occasions: ["work", "hangout"],
              budget_min: 200000,
              budget_max: 500000,
              quiz_completed: true,
              fashion_preferences: { gender: "male" },
            },
            error: null,
          }),
        }),
      }),
    });
    supabase.from.mockReturnValueOnce({
      insert: async () => ({ data: null, error: null }),
    });

    await recommenderService.generate({ prompt: "outfit đi làm" });

    expect(supabase.functions.invoke).toHaveBeenCalledWith("generate-outfit", {
      body: expect.objectContaining({
        gender: "male",
        profileContext: expect.objectContaining({
          gender: "male",
          styleDna: { minimal: 70, streetwear: 30 },
          favoriteColors: ["black", "white"],
          preferredStyles: ["minimal", "streetwear"],
          preferredOccasions: ["work", "hangout"],
          budgetMin: 200000,
          budgetMax: 500000,
          quizCompleted: true,
        }),
      }),
    });
  });

  it("converse returns empty fallback when not logged in and edge fails", async () => {
    const { supabase } = await import("@/shared/lib");
    (supabase.auth.getUser as any).mockResolvedValueOnce({ data: { user: null }, error: null });
    (supabase.functions.invoke as any).mockRejectedValueOnce(new Error("edge fail"));
    supabase.from.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
        }),
      }),
    });

    const res = await recommenderService.converse("Xin chào");
    expect(res.outfits).toEqual([]);
    expect(res.reply).toContain("đăng nhập");
  });

  it("toggleSave returns false when user is not logged in", async () => {
    const { supabase } = await import("@/shared/lib");
    (supabase.auth.getUser as any).mockResolvedValueOnce({ data: { user: null }, error: null });

    const res = await recommenderService.toggleSave(1, true);
    expect(res).toBe(false);
  });

  it("service contract still exposes required methods", () => {
    const required = ["fetchTrendingOutfits", "listOutfits", "generate", "converse", "applyAction", "toggleSave"];
    required.forEach((key) => expect(typeof (recommenderService as any)[key]).toBe("function"));
  });
});
