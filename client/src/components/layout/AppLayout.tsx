import { Outlet } from "react-router-dom"
import { AppSidebar } from "./AppSidebar"
import { AppNavbar } from "./AppNavbar"

export function AppLayout() {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden" data-testid="app-layout">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppNavbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
