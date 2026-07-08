import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BriefRecommendation =
  | "CONTINUE"
  | "REVISE"
  | "MONTHLY"
  | "HIATUS"
  | "AT_RISK"
  | "CANCEL";

export const RECOMMENDATION_LABEL: Record<BriefRecommendation, string> = {
  CONTINUE: "Continue",
  REVISE: "Needs revision",
  MONTHLY: "Move to monthly",
  HIATUS: "Hiatus",
  AT_RISK: "At risk",
  CANCEL: "Cancel",
};

export type BoardBrief = {
  id: string;
  seriesId: string;
  notes: string;
  riskFactors: string;
  productionConsistency: string;
  rankingSummary: string;
  recommendation: BriefRecommendation;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

type State = {
  briefs: BoardBrief[];
  upsert: (b: Omit<BoardBrief, "id" | "createdAt" | "updatedAt"> & { id?: string }) => BoardBrief;
  remove: (id: string) => void;
};

export const useBoardBriefs = create<State>()(
  persist(
    (set, get) => ({
      briefs: [],
      upsert: (b) => {
        const now = new Date().toISOString();
        const existing = b.id ? get().briefs.find((x) => x.id === b.id) : undefined;
        if (existing) {
          const next: BoardBrief = { ...existing, ...b, id: existing.id, updatedAt: now };
          set((s) => ({ briefs: s.briefs.map((x) => (x.id === existing.id ? next : x)) }));
          return next;
        }
        const next: BoardBrief = {
          ...b,
          id: `brief-${Date.now().toString(36)}`,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ briefs: [next, ...s.briefs] }));
        return next;
      },
      remove: (id) => set((s) => ({ briefs: s.briefs.filter((b) => b.id !== id) })),
    }),
    { name: "beachread-board-briefs" },
  ),
);
