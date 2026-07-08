import { create } from "zustand";

type LayerKind = "region" | "task" | "comment";

type State = {
  hiddenMap: Record<string, boolean>;
  lockedMap: Record<string, boolean>;
  reorderMap: Record<string, string[]>;
  setRegionHidden: (id: string, hidden: boolean) => void;
  setTaskHidden: (id: string, hidden: boolean) => void;
  setCommentHidden: (id: string, hidden: boolean) => void;
  setRegionLocked: (id: string, locked: boolean) => void;
  setTaskLocked: (id: string, locked: boolean) => void;
  setCommentLocked: (id: string, locked: boolean) => void;
  bulkSetHidden: (kind: LayerKind, pageId: string, hidden: boolean) => void;
  bulkSetLocked: (kind: LayerKind, pageId: string, locked: boolean) => void;
  reorderRegionsOnPage: (pageId: string, fromId: string, toId: string) => void;
  reorderTasksOnPage: (pageId: string, fromId: string, toId: string) => void;
  reorderCommentsOnPage: (pageId: string, fromId: string, toId: string) => void;
  reset: () => void;
};

function reorderInArray(arr: string[], fromId: string, toId: string): string[] {
  if (fromId === toId) return arr;
  const fromIdx = arr.indexOf(fromId);
  const toIdx = arr.indexOf(toId);
  if (fromIdx < 0 || toIdx < 0) return arr;
  const copy = arr.slice();
  const [moved] = copy.splice(fromIdx, 1);
  copy.splice(toIdx, 0, moved);
  return copy;
}

function setMapKey(
  map: Record<string, boolean>,
  key: string,
  val: boolean,
): Record<string, boolean> {
  const next = { ...map };
  if (val) {
    next[key] = true;
  } else {
    delete next[key];
  }
  return next;
}

function bulkSetByPrefix(
  map: Record<string, boolean>,
  prefix: string,
  val: boolean,
): Record<string, boolean> {
  const next = { ...map };
  for (const key of Object.keys(next)) {
    if (key.startsWith(prefix + ":")) {
      if (val) {
        next[key] = true;
      } else {
        delete next[key];
      }
    }
  }
  return next;
}

export const useStudio = create<State>()((set) => ({
  hiddenMap: {},
  lockedMap: {},
  reorderMap: {},

  setRegionHidden: (id, hidden) => set((s) => ({ hiddenMap: setMapKey(s.hiddenMap, id, hidden) })),
  setTaskHidden: (id, hidden) => set((s) => ({ hiddenMap: setMapKey(s.hiddenMap, id, hidden) })),
  setCommentHidden: (id, hidden) => set((s) => ({ hiddenMap: setMapKey(s.hiddenMap, id, hidden) })),

  setRegionLocked: (id, locked) => set((s) => ({ lockedMap: setMapKey(s.lockedMap, id, locked) })),
  setTaskLocked: (id, locked) => set((s) => ({ lockedMap: setMapKey(s.lockedMap, id, locked) })),
  setCommentLocked: (id, locked) => set((s) => ({ lockedMap: setMapKey(s.lockedMap, id, locked) })),

  bulkSetHidden: (kind, pageId, hidden) =>
    set((s) => ({
      hiddenMap: bulkSetByPrefix(s.hiddenMap, `${kind}:${pageId}`, hidden),
    })),
  bulkSetLocked: (kind, pageId, locked) =>
    set((s) => ({
      lockedMap: bulkSetByPrefix(s.lockedMap, `${kind}:${pageId}`, locked),
    })),

  reorderRegionsOnPage: (pageId, fromId, toId) =>
    set((s) => {
      const key = `regions:${pageId}`;
      const current = s.reorderMap[key] ?? [];
      return { reorderMap: { ...s.reorderMap, [key]: reorderInArray(current, fromId, toId) } };
    }),
  reorderTasksOnPage: (pageId, fromId, toId) =>
    set((s) => {
      const key = `tasks:${pageId}`;
      const current = s.reorderMap[key] ?? [];
      return { reorderMap: { ...s.reorderMap, [key]: reorderInArray(current, fromId, toId) } };
    }),
  reorderCommentsOnPage: (pageId, fromId, toId) =>
    set((s) => {
      const key = `comments:${pageId}`;
      const current = s.reorderMap[key] ?? [];
      return { reorderMap: { ...s.reorderMap, [key]: reorderInArray(current, fromId, toId) } };
    }),

  reset: () => set({ hiddenMap: {}, lockedMap: {}, reorderMap: {} }),
}));
