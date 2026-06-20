import { create } from "zustand";

export type Tool =
  | "select"
  | "pan"
  | "rect"
  | "polygon"
  | "bubble"
  | "brush"
  | "text"
  | "comment"
  | "ai"
  | "save";

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface RegionTask {
  taskType: string;
  assigneeId: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
}

interface StudioStore {
  viewport: Viewport;
  selectedRegionId: string | null;
  activeTool: Tool;
  isPanning: boolean;
  isSpaceDown: boolean;
  containerSize: { w: number; h: number };
  
  // UI Panels and Toggles
  activeTab: "inspect" | "layers" | "ai" | "comments";
  isInspectorCollapsed: boolean;
  isCarouselCollapsed: boolean;
  showRegions: boolean;
  showComments: boolean;
  compareOriginal: boolean;
  
  // Region Task Mappings
  regionTasks: Record<string, RegionTask>;

  // Actions
  setViewport: (fn: Viewport | ((prev: Viewport) => Viewport)) => void;
  setSelectedRegionId: (id: string | null) => void;
  setActiveTool: (t: Tool) => void;
  setIsPanning: (v: boolean) => void;
  setIsSpaceDown: (v: boolean) => void;
  setContainerSize: (size: { w: number; h: number }) => void;
  
  // New UI Actions
  setActiveTab: (tab: "inspect" | "layers" | "ai" | "comments") => void;
  setInspectorCollapsed: (v: boolean) => void;
  setCarouselCollapsed: (v: boolean) => void;
  setShowRegions: (v: boolean) => void;
  setShowComments: (v: boolean) => void;
  setCompareOriginal: (v: boolean) => void;
  assignTaskToRegion: (regionId: string, task: RegionTask | null) => void;
}

export const useStudioStore = create<StudioStore>((set) => ({
  viewport: { x: 0, y: 0, scale: 1 },
  selectedRegionId: null,
  activeTool: "select",
  isPanning: false,
  isSpaceDown: false,
  containerSize: { w: 800, h: 600 },
  
  activeTab: "inspect",
  isInspectorCollapsed: false,
  isCarouselCollapsed: false,
  showRegions: true,
  showComments: true,
  compareOriginal: false,
  
  regionTasks: {},

  setViewport: (fn) =>
    set((s) => ({
      viewport: typeof fn === "function" ? fn(s.viewport) : fn,
    })),
  setSelectedRegionId: (id) => set({ selectedRegionId: id }),
  setActiveTool: (t) => set({ activeTool: t }),
  setIsPanning: (v) => set({ isPanning: v }),
  setIsSpaceDown: (v) => set({ isSpaceDown: v }),
  setContainerSize: (containerSize) => set({ containerSize }),
  
  setActiveTab: (activeTab) => set({ activeTab }),
  setInspectorCollapsed: (isInspectorCollapsed) => set({ isInspectorCollapsed }),
  setCarouselCollapsed: (isCarouselCollapsed) => set({ isCarouselCollapsed }),
  setShowRegions: (showRegions) => set({ showRegions }),
  setShowComments: (showComments) => set({ showComments }),
  setCompareOriginal: (compareOriginal) => set({ compareOriginal }),
  assignTaskToRegion: (regionId, task) =>
    set((s) => {
      const updated = { ...s.regionTasks };
      if (task === null) {
        delete updated[regionId];
      } else {
        updated[regionId] = task;
      }
      return { regionTasks: updated };
    }),
}));
