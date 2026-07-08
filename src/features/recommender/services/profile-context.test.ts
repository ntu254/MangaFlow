import { describe, expect, it } from "vitest";
import { formatQuizProfileContext, mapProfileContext, mergeProfileContext } from "./profile-context";

describe("recommender profile context", () => {
  it("maps quiz fields from a real profile row shape", () => {
    const context = mapProfileContext({
      style_dna: { minimal: 70, office: 30 },
      favorite_colors: ["black", "navy"],
      preferred_styles: ["minimal", "office"],
      preferred_occasions: ["work"],
      budget_min: 200000,
      budget_max: 500000,
      quiz_completed: true,
      fashion_preferences: { gender: "male" },
    });

    expect(context).toEqual({
      gender: "male",
      styleDna: { minimal: 70, office: 30 },
      favoriteColors: ["black", "navy"],
      preferredStyles: ["minimal", "office"],
      preferredOccasions: ["work"],
      budgetMin: 200000,
      budgetMax: 500000,
      quizCompleted: true,
    });
  });

  it("formats quiz profile context for AI prompts", () => {
    const text = formatQuizProfileContext({
      gender: "male",
      styleDna: { minimal: 70 },
      favoriteColors: ["black"],
      preferredStyles: ["minimal"],
      preferredOccasions: ["work"],
      budgetMin: 200000,
      budgetMax: 500000,
      quizCompleted: true,
    });

    expect(text).toContain("Gender/preference: male");
    expect(text).toContain("Style DNA: {\"minimal\":70}");
    expect(text).toContain("Preferred styles: minimal");
    expect(text).toContain("Favorite colors: black");
    expect(text).toContain("Budget: 200000-500000 VND");
  });

  it("prefers server profile context over client context", () => {
    const merged = mergeProfileContext(
      {
        gender: "male",
        styleDna: { office: 80 },
        favoriteColors: ["navy"],
        preferredStyles: ["office"],
        preferredOccasions: ["work"],
        budgetMin: 500000,
        budgetMax: 1000000,
        quizCompleted: true,
      },
      {
        gender: "female",
        styleDna: { party: 100 },
        favoriteColors: ["pink"],
        preferredStyles: ["party"],
        preferredOccasions: ["date"],
        budgetMin: 0,
        budgetMax: 200000,
        quizCompleted: true,
      },
    );

    expect(merged?.gender).toBe("male");
    expect(merged?.preferredStyles).toEqual(["office"]);
    expect(merged?.budgetMin).toBe(500000);
  });
});
