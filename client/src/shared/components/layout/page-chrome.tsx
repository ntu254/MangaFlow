import * as React from "react"
import { useEffect } from "react"
import { useUiStore, type SidebarMode } from "@/shared/stores/uiStore"

export interface ContextTab {
  label: string
  to: string
  badge?: number | string
  end?: boolean
}

export interface ContextHeaderConfig {
  title: React.ReactNode
  breadcrumb?: React.ReactNode
  status?: React.ReactNode
  actions?: React.ReactNode
}

export interface PageChrome {
  contextHeader?: ContextHeaderConfig | null
  tabs?: ContextTab[]
  /** Force a sidebar presentation while this page is mounted (e.g. Studio). */
  sidebar?: SidebarMode
  /** Render main without default padding (full-bleed canvas/master-detail). */
  bleed?: boolean
}

interface PageChromeContextValue {
  chrome: PageChrome
  setChrome: (chrome: PageChrome) => void
}

const PageChromeContext = React.createContext<PageChromeContextValue | null>(null)

export function PageChromeProvider({ children }: { children: React.ReactNode }) {
  const [chrome, setChrome] = React.useState<PageChrome>({})
  const value = React.useMemo(() => ({ chrome, setChrome }), [chrome])
  return <PageChromeContext.Provider value={value}>{children}</PageChromeContext.Provider>
}

export function usePageChromeState() {
  const ctx = React.useContext(PageChromeContext)
  if (!ctx) throw new Error("usePageChromeState must be used within PageChromeProvider")
  return ctx
}

/**
 * Page-level hook: declare the context header, tabs, and forced sidebar mode.
 * The shell renders these. Cleans up on unmount.
 *
 * Pass a stable `deps` array (like useEffect) for values that change.
 */
export function usePageChrome(config: PageChrome, deps: React.DependencyList = []) {
  const { setChrome } = usePageChromeState()
  const setForcedSidebarMode = useUiStore((s) => s.setForcedSidebarMode)

  useEffect(() => {
    setChrome(config)
    if (config.sidebar) setForcedSidebarMode(config.sidebar)
    return () => {
      setChrome({})
      setForcedSidebarMode(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
