import type { AffiliatePlatform, IAffiliatePlatform } from "./types";
import { ShopeeClient } from "./shopee";

class AffiliateRegistry {
  private clients = new Map<AffiliatePlatform, IAffiliatePlatform>();

  constructor() {
    this.register(new ShopeeClient());
  }

  register(client: IAffiliatePlatform): void {
    this.clients.set(client.platform, client);
  }

  get(platform: AffiliatePlatform): IAffiliatePlatform | undefined {
    return this.clients.get(platform);
  }

  getAll(): IAffiliatePlatform[] {
    return [...this.clients.values()];
  }

  getActive(): IAffiliatePlatform[] {
    return this.getAll().filter((c) => c.isConfigured());
  }

  searchAll(params: { query: string; limit?: number }): Promise<AffiliateProduct[]> {
    return Promise.all(
      this.getActive().map((c) =>
        c.searchProducts({ query: params.query, limit: params.limit ?? 5 })
      ),
    ).then((results) => results.flat());
  }
}

import type { AffiliateProduct } from "./types";

export const affiliateRegistry = new AffiliateRegistry();
