const IMPACT_BASE = "https://api.impact.com/Mediapartners";

export function getImpactHeaders(): Record<string, string> {
  const token = Deno.env.get("IMPACT_AUTH_TOKEN");
  if (!token) throw new Error("IMPACT_AUTH_TOKEN not set");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export function getAccountSid(): string {
  const sid = Deno.env.get("IMPACT_ACCOUNT_SID");
  if (!sid) throw new Error("IMPACT_ACCOUNT_SID not set");
  return sid;
}

export function getProductsUrl(): string {
  return `${IMPACT_BASE}/${getAccountSid()}/Products`;
}

export interface ImpactProduct {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  retailPrice: number;
  currency: string;
  advertiserName: string;
  categoryName: string;
  trackingLink: string;
}

export interface NormalizedProduct {
  source_product_id: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  currency: string;
  brand: string;
  category: string;
  affiliate_url: string;
}

export function normalizeProduct(p: ImpactProduct): NormalizedProduct {
  return {
    source_product_id: p.id,
    name: p.name || "Unknown Product",
    description: p.description || "",
    image_url: p.imageUrl || "",
    price: p.retailPrice || 0,
    currency: p.currency || "USD",
    brand: p.advertiserName || "",
    category: p.categoryName || "",
    affiliate_url: p.trackingLink || "",
  };
}

export async function searchImpactProducts(query: string, limit = 20): Promise<NormalizedProduct[]> {
  const url = new URL(getProductsUrl());
  if (query) url.searchParams.set("search", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sort", "relevance");

  const resp = await fetch(url.toString(), { headers: getImpactHeaders() });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Impact API error (${resp.status}): ${text.slice(0, 200)}`);
  }

  const data = await resp.json();
  const products: ImpactProduct[] = data?.Products || [];
  return products.map(normalizeProduct);
}
