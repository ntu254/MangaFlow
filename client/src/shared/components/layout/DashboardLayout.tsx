import { useCallback, useMemo, useState } from "react"
import { Outlet } from "react-router-dom"
import { RoleSidebar } from "./RoleSidebar"
import { DashboardTopBar } from "./DashboardTopBar"
import { PageTitleProvider } from "@/shared/contexts/PageTitleContext"

export function DashboardLayout() {
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState<string>()
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false)
  const updateTitle = useCallback((nextTitle: string, nextSubtitle?: string) => {
    setTitle(nextTitle)
    setSubtitle(nextSubtitle)
  }, [])
  const openMobileNavigation = useCallback(() => setIsMobileNavigationOpen(true), [])
  const closeMobileNavigation = useCallback(() => setIsMobileNavigationOpen(false), [])
  const pageTitleValue = useMemo(
    () => ({ title, subtitle, setTitle: updateTitle }),
    [subtitle, title, updateTitle],
  )

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <RoleSidebar isOpen={isMobileNavigationOpen} onClose={closeMobileNavigation} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PageTitleProvider value={pageTitleValue}>
          <DashboardTopBar
            isNavigationOpen={isMobileNavigationOpen}
            onOpenNavigation={openMobileNavigation}
          />
          <main className="flex-1 overflow-y-auto p-lg">
            <Outlet />
          </main>
        </PageTitleProvider>
      </div>
    </div>
  )
}
