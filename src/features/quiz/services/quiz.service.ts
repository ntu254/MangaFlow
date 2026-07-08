import { supabase } from "@/shared/lib";
import { apiClient } from "@/shared/api";
import { apiConfig } from "@/shared/api/config";

export interface QuizAnswers {
  gender?: string;
  styles: string[];
  occasions: string[];
  budget?: string;
  colors: string[];
}

const BUDGET_RANGES: Record<string, { min: number; max: number }> = {
  low: { min: 0, max: 200000 },
  mid: { min: 200000, max: 500000 },
  high: { min: 500000, max: 1000000 },
  premium: { min: 1000000, max: 99999999 },
};

const computeStyleDna = (styles: string[]): Record<string, number> => {
  const weights: Record<string, number> = {
    minimal: 70, casual: 60, streetwear: 50, office: 65, party: 45, athleisure: 40,
  };
  if (styles.length === 0) return { casual: 100 };
  const perStyle = Math.round(100 / styles.length);
  const dna: Record<string, number> = {};
  styles.forEach((s, i) => {
    dna[s] = i === styles.length - 1 ? 100 - Object.values(dna).reduce((a, b) => a + b, 0) : (weights[s] ?? perStyle);
  });
  return dna;
};

export const quizService = {
  completeQuiz: async (userId: string, answers: QuizAnswers) => {
    const budgetRange = answers.budget ? BUDGET_RANGES[answers.budget] : null;

    // Generate style-specific avatar based on gender, style tags, and seed
    const seed = `${answers.gender || "unisex"}-${answers.styles.join("-")}-${userId || "guest"}`;
    const colorMap: Record<string, string> = {
      white: "ffffff",
      beige: "f5f0e8",
      black: "e2e8f0",
      navy: "cbd5e1",
      sage: "9caf88",
      earth: "dbeafe",
      blush: "ffd8d8",
      denim: "6b8dad",
    };
    const firstColor = answers.colors?.[0] || "beige";
    const bgColorHex = colorMap[firstColor] || "f5f0e8";
    const avatarUrl = `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bgColorHex}`;

    if (apiConfig.useMockApi) {
      return apiClient.post<{ success: boolean }>("/api/profile/quiz-complete", {
        json: {
          styleDna: computeStyleDna(answers.styles),
          avatarUrl,
          fashionPreferences: {
            gender: answers.gender || null,
          },
        },
      });
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("fashion_preferences")
      .eq("id", userId)
      .maybeSingle();
    const currentFashionPreferences =
      existingProfile?.fashion_preferences &&
      typeof existingProfile.fashion_preferences === "object" &&
      !Array.isArray(existingProfile.fashion_preferences)
        ? existingProfile.fashion_preferences
        : {};

    const { error } = await supabase
      .from("profiles")
      .update({
        style_dna: computeStyleDna(answers.styles),
        favorite_colors: answers.colors,
        preferred_styles: answers.styles,
        preferred_occasions: answers.occasions,
        budget_min: budgetRange?.min ?? null,
        budget_max: budgetRange?.max ?? null,
        quiz_completed: true,
        avatar_url: avatarUrl,
        fashion_preferences: {
          ...currentFashionPreferences,
          gender: answers.gender || null,
        },
      })
      .eq("id", userId);
    if (error) throw error;
    return { success: true };
  },
};
