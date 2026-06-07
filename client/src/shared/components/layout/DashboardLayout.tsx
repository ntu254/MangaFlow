import { useCallback, useMemo, useState } from "react"
import { Outlet } from "react-router-dom"
import { RoleSidebar } from "./RoleSidebar"
import { DashboardTopBar } from "./DashboardTopBar"
import { PageTitleProvider } from "@/shared/contexts/PageTitleContext"

export function DashboardLayout() {
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState<string>()
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const updateTitle = useCallback((nextTitle: string, nextSubtitle?: string) => {
    setTitle(nextTitle)
    setSubtitle(nextSubtitle)
  }, [])
  const openMobileNavigation = useCallback(() => setIsMobileNavigationOpen(true), [])
  const closeMobileNavigation = useCallback(() => setIsMobileNavigationOpen(false), [])
  const toggleCollapse = useCallback(() => setSidebarCollapsed((prev) => !prev), [])
  const pageTitleValue = useMemo(
    () => ({ title, subtitle, setTitle: updateTitle }),
    [subtitle, title, updateTitle],
  )

  return (
    <div className="flex h-screen max-h-screen w-full overflow-hidden bg-background min-h-0">
      <RoleSidebar
        isOpen={isMobileNavigationOpen}
        onClose={closeMobileNavigation}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <PageTitleProvider value={pageTitleValue}>
          <DashboardTopBar
            isNavigationOpen={isMobileNavigationOpen}
            onOpenNavigation={openMobileNavigation}
          />
          <main className="flex-1 overflow-y-auto p-md min-h-0">
            <Outlet />
          </main>
        </PageTitleProvider>
      </div>
    </div>
  )
}
