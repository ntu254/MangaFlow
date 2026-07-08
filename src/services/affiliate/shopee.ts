import type { AffiliateProduct, AffiliatePlatform, ClickEvent, IAffiliatePlatform, PlatformConfig, SearchParams } from "./types";

export class ShopeeClient implements IAffiliatePlatform {
  readonly platform: AffiliatePlatform = "Shopee";
  readonly config: PlatformConfig;

  constructor(config?: Partial<PlatformConfig>) {
    this.config = {
      platform: "Shopee",
      apiKey: config?.apiKey ?? import.meta.env.VITE_SHOPEE_API_KEY ?? "",
      apiSecret: config?.apiSecret ?? import.meta.env.VITE_SHOPEE_API_SECRET ?? "",
      baseUrl: config?.baseUrl ?? "https://partner.shopeemobile.com/api/v1",
      isActive: config?.isActive ?? false,
    };
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiSecret && this.config.isActive);
  }

  async searchProducts(params: SearchParams): Promise<AffiliateProduct[]> {
    if (!this.isConfigured()) return this.mockSearch(params);
    try {
      const response = await fetch(`${this.config.baseUrl}/product/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.config.apiKey!,
        },
        body: JSON.stringify({
          keyword: params.query,
          limit: params.limit ?? 10,
          offset: params.offset ?? 0,
          sort_by: params.sortBy ?? "relevance",
        }),
      });
      if (!response.ok) throw new Error(`Shopee API error: ${response.status}`);
      const data = await response.json();
      return (data.products ?? []).map((p: any) => this.mapProduct(p));
    } catch {
      console.warn("Shopee API failed, using mock data");
      return this.mockSearch(params);
    }
  }

  async getProductDetail(id: string): Promise<AffiliateProduct | null> {
    if (!this.isConfigured()) return null;
    return null;
  }

  async createAffiliateLink(productId: string, _url?: string): Promise<string | null> {
    if (!this.isConfigured()) return null;
    return `https://shopee.vn/${productId}?affiliate=${this.config.apiKey}`;
  }

  async trackClick(_event: ClickEvent): Promise<void> {
    return;
  }

  private mockSearch(params: SearchParams): AffiliateProduct[] {
    return [
      { id: "sp-1", name: "Áo thun trắng basic", price: 220000, currency: "VND", platform: "Shopee", brand: "Uniqlo", rating: 4.3, sold: "5.6k", category: "Tops", affiliateUrl: "#" },
      { id: "sp-2", name: "Quần jeans xanh", price: 680000, currency: "VND", platform: "Shopee", brand: "Levi's", rating: 4.5, sold: "2.3k", category: "Bottoms", affiliateUrl: "#" },
      { id: "sp-3", name: "Áo hoodie xám", price: 520000, currency: "VND", platform: "Shopee", brand: "Adidas", rating: 4.6, sold: "2.1k", category: "Outerwear", affiliateUrl: "#" },
    ].filter((p) => p.name.toLowerCase().includes(params.query.toLowerCase())).slice(0, params.limit ?? 10);
  }

  private mapProduct(p: any): AffiliateProduct {
    return {
      id: `shopee-${p.product_id ?? p.id}`,
      name: p.name ?? p.product_name ?? "",
      price: p.price ?? 0,
      currency: "VND",
      platform: "Shopee",
      imageUrl: p.image_url,
      affiliateUrl: p.affiliate_url,
      brand: p.brand,
      rating: p.rating,
      sold: p.sold_count?.toString(),
    };
  }
}
