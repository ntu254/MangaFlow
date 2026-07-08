export interface TrendKeyword {
  keyword: string;
  volume: "high" | "medium" | "low";
}

export interface SeasonalTrend {
  season: string;
  label: string;
  trends: { name: string; desc: string; growth: string }[];
}

export interface TrendProduct {
  id: number;
  name: string;
  image: string;
  price?: string;
  platform?: string;
  affiliateUrl?: string;
  growth: string;
  insight: string;
}

export interface RegionTrend {
  region: string;
  flag: string;
  trends: string[];
}

export interface NextTrend {
  name: string;
  desc: string;
  confidence: number;
  source: string;
}

export interface PersonalizedTrend {
  prompt: string;
  label: string;
  reason: string;
}

export interface WardrobeMatch {
  trend: string;
  match: string;
  note: string;
}
