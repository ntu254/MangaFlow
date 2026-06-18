import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UserRole } from "@/shared/types"

export type SidebarMode = "expanded" | "rail" | "hidden"

/**
 * Default sidebar presentation per role (DESIGN.md role intent):
 * - ADMIN: data/config workspace → expanded
 * - MANGAKA/ASSISTANT: production focus → rail (compact)
 * - EDITOR/BOARD: review/decision → expanded
 */
export const DEFAULT_SIDEBAR_BY_ROLE: Record<UserRole, SidebarMode> = {
  ADMIN: "expanded",
  MANGAKA: "rail",
  ASSISTANT: "rail",
  EDITOR: "expanded",
  BOARD: "expanded",
}

interface UiState {
  /** User-chosen sidebar mode; null = follow role default. */
  sidebarMode: SidebarMode | null
  /** Forced by route (e.g. Studio) — overrides everything, not persisted. */
  forcedSidebarMode: SidebarMode | null
  setSidebarMode: (mode: SidebarMode) => void
  toggleSidebar: () => void
  setForcedSidebarMode: (mode: SidebarMode | null) => void
  resolveSidebarMode: (role: UserRole | undefined) => SidebarMode
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarMode: null,
      forcedSidebarMode: null,
      setSidebarMode: (mode) => set({ sidebarMode: mode }),
      toggleSidebar: () =>
        set((s) => ({ sidebarMode: s.sidebarMode === "rail" ? "expanded" : "rail" })),
      setForcedSidebarMode: (mode) => set({ forcedSidebarMode: mode }),
      resolveSidebarMode: (role) => {
        const { forcedSidebarMode, sidebarMode } = get()
        if (forcedSidebarMode) return forcedSidebarMode
        if (sidebarMode) return sidebarMode
        return role ? DEFAULT_SIDEBAR_BY_ROLE[role] : "expanded"
      },
    }),
    { name: "mangaflow-ui", partialize: (s) => ({ sidebarMode: s.sidebarMode }) }
  )
)
