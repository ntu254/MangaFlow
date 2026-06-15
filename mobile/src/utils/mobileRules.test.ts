import { describe, expect, it } from "vitest";
import { calculateFinalScore, normalizeReaderScore, validateRankingInput } from "./ranking";
import { canApprovePublication } from "./readiness";

describe("mobile MVP rules", () => {
  it("calculates board ranking final score from vote count and normalized reader score", () => {
    expect(normalizeReaderScore(8.5)).toBe(85);
    expect(calculateFinalScore(10000, 8.5)).toBe(7025.5);
  });

  it("validates ranking import input bounds", () => {
    expect(validateRankingInput(0, 1)).toBe(true);
    expect(validateRankingInput(10, 10)).toBe(true);
    expect(validateRankingInput(-1, 8)).toBe(false);
    expect(validateRankingInput(4, 11)).toBe(false);
  });

  it("blocks publication approval while any readiness item is incomplete", () => {
    expect(
      canApprovePublication([
        { label: "All pages uploaded", complete: true },
        { label: "All comments resolved", complete: false }
      ])
    ).toBe(false);
  });
});

