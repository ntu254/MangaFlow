import { Outlet } from "react-router-dom"
import { MangakaNavbar } from "./MangakaNavbar"

export function MangakaLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      <MangakaNavbar />
      <main className="flex-1 w-full flex flex-col p-6">
        <Outlet />
      </main>
    </div>
  )
}
