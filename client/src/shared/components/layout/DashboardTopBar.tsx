import { useAuth } from "@/shared/components/auth/AuthProvider"
import { useContext } from "react"
import { PageTitleContext } from "@/shared/contexts/PageTitleContext"

export function DashboardTopBar() {
  const { user } = useAuth()
  const { title, subtitle } = useContext(PageTitleContext)

  return (
    <header className="bg-surface border-b border-outline-variant flex justify-between items-center px-lg py-md w-full sticky top-0 z-30 h-20 shrink-0">
      <div className="flex items-center gap-md flex-1 min-w-0">
        <h1 className="text-title-lg font-title-lg font-bold text-primary md:hidden tracking-tight shrink-0">MangaFlow</h1>
        <div className="hidden md:block min-w-0">
          {title ? (
            <div className="truncate">
              <h2 className="text-title-md font-title-md text-on-surface truncate">{title}</h2>
              {subtitle && <p className="text-body-sm font-body-sm text-on-surface-variant truncate">{subtitle}</p>}
            </div>
          ) : (
            <div className="w-10 h-10" />
          )}
        </div>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="relative max-w-md w-full">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            className="w-full bg-surface-container-low border-none rounded-full py-2 pl-xl pr-md text-body-md font-body-md focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline"
            placeholder="Search users, series, or logs..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-sm flex-1 justify-end">
        <button className="p-2 text-on-surface-variant hover:bg-primary-container/20 rounded-full transition-colors active:opacity-80 active:scale-95">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-primary-container/20 rounded-full transition-colors active:opacity-80 active:scale-95">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="h-8 w-px bg-outline-variant mx-sm hidden sm:block" />
        <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-surface-container shrink-0 transition-transform hover:scale-105 bg-primary-fixed flex items-center justify-center">
          <span className="text-label-sm font-bold text-on-primary-fixed">
            {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
          </span>
        </div>
      </div>
    </header>
  )
}
