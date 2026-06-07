import { Outlet } from "react-router-dom"
import { AppNavbar } from "./AppNavbar"
import { RoleSidebar } from "./RoleSidebar"

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="flex">
        <RoleSidebar isOpen />
        <main className="flex-1 p-6 md:ml-60">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
