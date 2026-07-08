import { supabase } from "@/shared/lib";
import type { AffiliatePlatform, ClickEvent } from "./types";

export { affiliateRegistry } from "./registry";
export type { AffiliateProduct, AffiliatePlatform, ClickEvent, IAffiliatePlatform } from "./types";
export { ShopeeClient } from "./shopee";

export function trackClick(productId: string, platform: AffiliatePlatform, source: ClickEvent["source"]): void {
  supabase.auth.getUser().then(({ data: { user } }) => {
    supabase.from("product_clicks").insert({
      product_id: productId,
      user_id: user?.id,
      source,
      platform,
    }).then().catch(console.warn);
  }).catch(() => {});
}

export function formatPrice(price: number, currency = "VND"): string {
  if (currency === "VND") {
    return `${price.toLocaleString("vi-VN")}₫`;
  }
  return `$${price.toFixed(2)}`;
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    Shopee: "bg-shopee/8 text-shopee border-shopee/20",
    TikTokShop: "bg-tiktok/8 text-tiktok border-tiktok/20",
  };
  return colors[platform] ?? "bg-gray-100 text-gray-600 border-gray-200";
}
