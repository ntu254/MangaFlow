import { useState } from "react"
import { Outlet } from "react-router-dom"
import { RoleSidebar } from "./RoleSidebar"
import { DashboardTopBar } from "./DashboardTopBar"
import { PageTitleProvider } from "@/shared/contexts/PageTitleContext"

export function DashboardLayout() {
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState<string>()

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <RoleSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PageTitleProvider value={{ title, subtitle, setTitle(title, subtitle) { setTitle(title); setSubtitle(subtitle) } }}>
          <DashboardTopBar />
          <main className="flex-1 overflow-y-auto p-lg">
            <Outlet />
          </main>
        </PageTitleProvider>
      </div>
    </div>
  )
}
