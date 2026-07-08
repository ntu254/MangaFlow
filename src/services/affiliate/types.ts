export interface AffiliateProduct {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  currency: string;
  platform: AffiliatePlatform;
  affiliateUrl?: string;
  commissionRate?: number;
  brand?: string;
  rating?: number;
  sold?: string;
  category?: string;
  metadata?: Record<string, any>;
}

export type AffiliatePlatform = "Shopee" | "TikTokShop";

export interface PlatformConfig {
  platform: AffiliatePlatform;
  apiKey?: string;
  apiSecret?: string;
  baseUrl: string;
  isActive: boolean;
}

export interface SearchParams {
  query: string;
  limit?: number;
  offset?: number;
  sortBy?: "relevance" | "price_asc" | "price_desc" | "rating";
  minPrice?: number;
  maxPrice?: number;
  category?: string;
}

export interface ClickEvent {
  productId: string;
  userId?: string;
  source: "recommender" | "trends" | "wardrobe";
  platform: AffiliatePlatform;
  clickedAt: Date;
}

export interface IAffiliatePlatform {
  readonly platform: AffiliatePlatform;
  readonly config: PlatformConfig;
  isConfigured(): boolean;
  searchProducts(params: SearchParams): Promise<AffiliateProduct[]>;
  getProductDetail(id: string): Promise<AffiliateProduct | null>;
  createAffiliateLink(productId: string, url?: string): Promise<string | null>;
  trackClick(event: ClickEvent): Promise<void>;
}
