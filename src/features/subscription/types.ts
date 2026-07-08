export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  ai_generations_limit: number;
  wardrobe_limit: number;
  saved_outfits_limit: number;
  credits_per_month: number;
  has_ai_analysis: boolean;
  has_affiliate_access: boolean;
  has_trend_insights: boolean;
  has_priority_support: boolean;
  trial_days: number;
  is_active: boolean;
  sort_order: number;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  qrCode?: string;
  paymentLinkId?: string;
  orderCode?: string;
}

export interface SubscriptionInfo {
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  plans?: Plan;
}
