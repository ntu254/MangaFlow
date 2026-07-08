import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MaterialAnnotation = {
  id: string;
  proposalId: string;
  materialId: string;
  memberId: string;
  memberName: string;
  text: string;
  createdAt: string;
};

type State = {
  annotations: MaterialAnnotation[];
  viewed: Record<string, string[]>; // userId -> [proposalId:materialId]
  add: (a: Omit<MaterialAnnotation, "id" | "createdAt">) => void;
  remove: (id: string, memberId: string) => void;
  forMaterial: (proposalId: string, materialId: string) => MaterialAnnotation[];
  markViewed: (userId: string, proposalId: string, materialId: string) => void;
  hasViewedAny: (userId: string, proposalId: string) => boolean;
};

export const useMaterialAnnotations = create<State>()(
  persist(
    (set, get) => ({
      annotations: [],
      viewed: {},
      add: (a) =>
        set((s) => ({
          annotations: [
            {
              ...a,
              id: `an-${Math.random().toString(36).slice(2, 9)}`,
              createdAt: new Date().toISOString(),
            },
            ...s.annotations,
          ],
        })),
      remove: (id, memberId) =>
        set((s) => ({
          annotations: s.annotations.filter((a) => !(a.id === id && a.memberId === memberId)),
        })),
      forMaterial: (proposalId, materialId) =>
        get().annotations.filter((a) => a.proposalId === proposalId && a.materialId === materialId),
      markViewed: (userId, proposalId, materialId) =>
        set((s) => {
          const key = `${proposalId}:${materialId}`;
          const list = s.viewed[userId] ?? [];
          if (list.includes(key)) return s;
          return { viewed: { ...s.viewed, [userId]: [...list, key] } };
        }),
      hasViewedAny: (userId, proposalId) => {
        const list = get().viewed[userId] ?? [];
        return list.some((k) => k.startsWith(`${proposalId}:`));
      },
    }),
    { name: "beachread-material-annotations" },
  ),
);
