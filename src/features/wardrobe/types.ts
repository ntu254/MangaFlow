export interface WardrobeItem {
  id: number;
  name: string;
  category: string;
  color: string;
  tags: string[];
  image?: string;
  season?: string;
  source?: "manual" | "ai-scan";
  dateAdded?: string;
}

export interface ActiveFilters {
  category: string[];
  style: string[];
  color: string[];
  season: string[];
}

export interface WardrobeAnalysis {
  totalItems: number;
  topCategory: string;
  topColor: string;
  topStyle: string;
  colorPalette: { color: string; count: number; label: string }[];
  categoryDistribution: { category: string; count: number }[];
  styleDistribution: { style: string; count: number }[];
  seasonBreakdown: { season: string; count: number }[];
  consistencyScore: number;
  dominantStyles: string[];
  missingEssentials: string[];
}

export interface CapsuleSuggestion {
  title: string;
  description: string;
  items: { name: string; category: string; reason: string }[];
  versatilityScore: number;
}
