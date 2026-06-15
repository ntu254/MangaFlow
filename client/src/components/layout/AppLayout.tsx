import { Outlet } from "react-router-dom"
import { AppSidebar } from "./AppSidebar"
import { AppNavbar } from "./AppNavbar"

export function AppLayout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppNavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}