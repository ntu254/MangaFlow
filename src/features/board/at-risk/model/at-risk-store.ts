import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AtRiskDecisionKind, AtRiskReview } from "@/entities/board/model/board-types";
import { seedAtRiskReviews } from "./seed-at-risk-reviews";

type State = {
  reviews: AtRiskReview[];
  decide: (id: string, decision: AtRiskDecisionKind, reason: string) => void;
};

export const useAtRiskReviews = create<State>()(
  persist(
    (set) => ({
      reviews: seedAtRiskReviews,
      decide: (id, decision, reason) =>
        set((state) => ({
          reviews: state.reviews.map((review) =>
            review.id === id
              ? {
                  ...review,
                  status: "DECIDED",
                  decision,
                  decisionReason: reason,
                  decidedAt: new Date().toISOString(),
                }
              : review,
          ),
        })),
    }),
    { name: "beachread-at-risk", version: 1 },
  ),
);
