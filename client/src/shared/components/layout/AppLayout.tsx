import { Outlet } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/authStore"
import { useUiStore } from "@/shared/stores/uiStore"
import { AppSidebar } from "./AppSidebar"
import { AppNavbar } from "./AppNavbar"
import { ContextHeader } from "./ContextHeader"
import { PageChromeProvider, usePageChromeState } from "./page-chrome"

function ShellInner() {
  const role = useAuthStore((s) => s.user?.role)
  const resolveSidebarMode = useUiStore((s) => s.resolveSidebarMode)
  const mode = resolveSidebarMode(role)
  const { chrome } = usePageChromeState()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mode !== "hidden" && <AppSidebar mode={mode} />}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppNavbar />
        <ContextHeader header={chrome.contextHeader} tabs={chrome.tabs} />
        <main className={chrome.bleed ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto p-6"}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AppLayout() {
  return (
    <PageChromeProvider>
      <ShellInner />
    </PageChromeProvider>
  )
}
