import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AnnotationType =
  | "pacing"
  | "dialogue"
  | "panel"
  | "character"
  | "transition"
  | "art"
  | "blocking"
  | "note";
export type AnnotationSeverity = "low" | "medium" | "high";
export type AnnotationStatus = "OPEN" | "ADDRESSED" | "RESOLVED" | "REOPENED";

export type EditorAnnotation = {
  id: string;
  pageId: string;
  chapterId: string;
  x: number; // 0-1 relative
  y: number;
  type: AnnotationType;
  severity: AnnotationSeverity;
  blocking: boolean;
  text: string;
  suggestedFix?: string;
  status: AnnotationStatus;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type ChecklistKey =
  | "hook"
  | "characterMotivation"
  | "audienceFit"
  | "storyboardFlow"
  | "manuscriptQuality"
  | "serializePotential";

export const CHECKLIST_LABEL: Record<ChecklistKey, string> = {
  hook: "Clear hook",
  characterMotivation: "Main character has clear motivation",
  audienceFit: "Target audience is appropriate",
  storyboardFlow: "Storyboard/name has readable flow",
  manuscriptQuality: "Sample manuscript meets minimum quality",
  serializePotential: "Has serialization potential",
};

type State = {
  annotations: EditorAnnotation[];
  checklists: Record<string, Partial<Record<ChecklistKey, boolean>>>; // proposalId -> map
  addAnnotation: (a: Omit<EditorAnnotation, "id" | "createdAt">) => EditorAnnotation;
  updateAnnotation: (id: string, patch: Partial<EditorAnnotation>) => void;
  removeAnnotation: (id: string) => void;
  toggleChecklist: (proposalId: string, key: ChecklistKey, v: boolean) => void;
};

export const useEditorAnnotations = create<State>()(
  persist(
    (set) => ({
      annotations: [],
      checklists: {},
      addAnnotation: (a) => {
        const ann: EditorAnnotation = {
          ...a,
          id: `ann-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ annotations: [...s.annotations, ann] }));
        return ann;
      },
      updateAnnotation: (id, patch) =>
        set((s) => ({
          annotations: s.annotations.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
      removeAnnotation: (id) =>
        set((s) => ({ annotations: s.annotations.filter((a) => a.id !== id) })),
      toggleChecklist: (proposalId, key, v) =>
        set((s) => ({
          checklists: {
            ...s.checklists,
            [proposalId]: { ...(s.checklists[proposalId] ?? {}), [key]: v },
          },
        })),
    }),
    { name: "beachread-editor-annotations" },
  ),
);
