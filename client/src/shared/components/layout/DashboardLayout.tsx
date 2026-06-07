import { useCallback, useMemo, useState } from "react"
import { Outlet } from "react-router-dom"
import { RoleSidebar } from "./RoleSidebar"
import { DashboardTopBar } from "./DashboardTopBar"
import { PageTitleProvider } from "@/shared/contexts/PageTitleContext"

export function DashboardLayout() {
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState<string>()
  const updateTitle = useCallback((nextTitle: string, nextSubtitle?: string) => {
    setTitle(nextTitle)
    setSubtitle(nextSubtitle)
  }, [])
  const pageTitleValue = useMemo(
    () => ({ title, subtitle, setTitle: updateTitle }),
    [subtitle, title, updateTitle],
  )

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <RoleSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PageTitleProvider value={pageTitleValue}>
          <DashboardTopBar />
          <main className="flex-1 overflow-y-auto p-lg">
            <Outlet />
          </main>
        </PageTitleProvider>
      </div>
    </div>
  )
}
