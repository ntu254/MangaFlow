type GenderPreference = "male" | "female" | "lgbtq" | "skip";

export interface QuizProfileContext {
  gender: GenderPreference | null;
  styleDna: Record<string, number> | null;
  favoriteColors: string[];
  preferredStyles: string[];
  preferredOccasions: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  quizCompleted: boolean;
}

export function normalizeGender(value: unknown): GenderPreference | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (["male", "female", "lgbtq", "skip"].includes(normalized)) {
    return normalized as GenderPreference;
  }
  if (["nam", "men", "man"].includes(normalized)) return "male";
  if (["nữ", "nu", "women", "woman"].includes(normalized)) return "female";
  return null;
}

export function mapProfileContext(profile: any): QuizProfileContext {
  const fashionPreferences =
    profile?.fashion_preferences &&
    typeof profile.fashion_preferences === "object" &&
    !Array.isArray(profile.fashion_preferences)
      ? profile.fashion_preferences
      : {};

  return {
    gender: normalizeGender(fashionPreferences.gender),
    styleDna: profile?.style_dna ?? null,
    favoriteColors: Array.isArray(profile?.favorite_colors) ? profile.favorite_colors : [],
    preferredStyles: Array.isArray(profile?.preferred_styles) ? profile.preferred_styles : [],
    preferredOccasions: Array.isArray(profile?.preferred_occasions) ? profile.preferred_occasions : [],
    budgetMin: typeof profile?.budget_min === "number" ? profile.budget_min : null,
    budgetMax: typeof profile?.budget_max === "number" ? profile.budget_max : null,
    quizCompleted: Boolean(profile?.quiz_completed),
  };
}

export function mergeProfileContext(
  serverContext: QuizProfileContext | null,
  clientContext?: Partial<QuizProfileContext> | null,
): QuizProfileContext | null {
  if (!serverContext && !clientContext) return null;

  return {
    gender: normalizeGender(serverContext?.gender ?? clientContext?.gender),
    styleDna: serverContext?.styleDna ?? clientContext?.styleDna ?? null,
    favoriteColors: serverContext?.favoriteColors?.length
      ? serverContext.favoriteColors
      : clientContext?.favoriteColors ?? [],
    preferredStyles: serverContext?.preferredStyles?.length
      ? serverContext.preferredStyles
      : clientContext?.preferredStyles ?? [],
    preferredOccasions: serverContext?.preferredOccasions?.length
      ? serverContext.preferredOccasions
      : clientContext?.preferredOccasions ?? [],
    budgetMin: serverContext?.budgetMin ?? clientContext?.budgetMin ?? null,
    budgetMax: serverContext?.budgetMax ?? clientContext?.budgetMax ?? null,
    quizCompleted: Boolean(serverContext?.quizCompleted ?? clientContext?.quizCompleted),
  };
}

export function formatQuizProfileContext(context?: QuizProfileContext | null): string {
  if (!context || !context.quizCompleted) {
    return "User chưa có quiz profile hoàn chỉnh. Không tự bịa preference cá nhân hóa.";
  }

  const lines = [
    `Quiz completed: ${context.quizCompleted ? "yes" : "no"}`,
    `Gender/preference: ${context.gender || "không rõ"}`,
    `Style DNA: ${context.styleDna ? JSON.stringify(context.styleDna) : "không có"}`,
    `Preferred styles: ${context.preferredStyles.length ? context.preferredStyles.join(", ") : "không có"}`,
    `Preferred occasions: ${context.preferredOccasions.length ? context.preferredOccasions.join(", ") : "không có"}`,
    `Favorite colors: ${context.favoriteColors.length ? context.favoriteColors.join(", ") : "không có"}`,
    `Budget: ${context.budgetMin ?? "không rõ"}-${context.budgetMax ?? "không rõ"} VND`,
  ];

  return lines.join("\n");
}
