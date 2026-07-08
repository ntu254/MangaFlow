export interface Product {
  id?: string;
  name: string;
  price: string;
  oldPrice: string | null;
  platform: string;
  badge: string | null;
  rating: number;
  sold: string;
  brand: string;
  image?: string;
  affiliateUrl?: string;
  platformColor?: string;
}

export interface MissingItem {
  name: string;
  reason: string;
  price: string;
  platform: string;
  affiliateUrl?: string;
}

export interface Outfit {
  id: number;
  dbId?: string;
  title: string;
  emoji: string;
  image: string;
  tryOnImage?: string;
  style: string;
  styleTags: string[];
  aiMatch: boolean;
  aiComment: string;
  totalPrice: string;
  products: Product[];
  matchScore?: number;
  season?: string;
  occasion?: string;
  mood?: string;
  userSaved?: boolean;
  userLiked?: boolean | null;
  userHidden?: boolean;
  userOwnsItems?: string[];
  missingItems?: MissingItem[];
  personalization?: string[];
  aiConfidence?: { label: string; positive: boolean }[];
  resolvedRules?: { concept_id: string; rule_type: string; priority: number; rule_text: string }[];
}

export type AIAction =
  | "regenerate"
  | "more_casual"
  | "more_luxury"
  | "cheaper"
  | "more_korean";

export interface ChatMessage {
  role: "user" | "ai";
  text: string;
  actions?: { label: string; prompt: string }[];
}

export interface RecommenderState {
  outfits: Outfit[];
  isLoading: boolean;
  error: string | null;
  activeFilter: string;
  activePrompt: string;
  savedOutfits: number[];
  likedOutfits: Record<number, boolean | null>;
  hiddenOutfits: number[];
}

export const STYLE_FILTERS = [
  { icon: "✨", label: "Tất cả", value: "all" },
  { icon: "🧥", label: "Casual", value: "Casual" },
  { icon: "🔥", label: "Streetwear", value: "Streetwear" },
  { icon: "💼", label: "Công sở", value: "Office" },
  { icon: "🇰🇷", label: "K-Fashion", value: "K-Fashion" },
  { icon: "🌺", label: "Boho", value: "Boho" },
  { icon: "◻️", label: "Minimal", value: "Minimal" },
  { icon: "🎉", label: "Dạ tiệc", value: "Party" },
] as const;

export const SMART_FILTERS = [
  { icon: "✨", label: "For You", value: "for_you" },
  { icon: "📈", label: "Trending", value: "trending" },
  { icon: "👔", label: "Your Wardrobe", value: "wardrobe" },
  { icon: "🕐", label: "Recent", value: "recent" },
  { icon: "💰", label: "Budget", value: "budget" },
] as const;
