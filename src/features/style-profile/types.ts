export interface StyleProfile {
  styleDna: { style: string; value: number }[];
  favoriteColors: { name: string; hex: string; pct: number }[];
  outfitTypeDistribution: { name: string; value: number; color: string }[];
  aiInsight: { summary: string; description: string };
  insights: string[];
  wardrobeFavorites: { name: string; image: string; worn: number }[];
  evolution: { month: string; [key: string]: string | number }[];
  trendSummary: { label: string; change: string; positive: boolean | null }[];
  keyMoments: { month: string; event: string }[];
  suggestedStyles: { name: string; image: string; desc: string }[];
  missingEssentials: { item: string; reason: string; priority: "high" | "medium" | "low" }[];
  consistencyScore: number;
  dominantStyles: string[];
}

export interface StyleImprovementTip {
  title: string;
  description: string;
  category: string;
}

export interface StyleRecommendation {
  prompt: string;
  label: string;
  style: string;
}
