import { useAuth } from "@/shared/components/auth/AuthProvider"
import { useContext } from "react"
import { PageTitleContext } from "@/shared/contexts/PageTitleContext"
import { MFIconButton } from "@/shared/components/ui/MFIconButton"

interface DashboardTopBarProps {
  isNavigationOpen: boolean
  onOpenNavigation: () => void
}

export function DashboardTopBar({
  isNavigationOpen,
  onOpenNavigation,
}: DashboardTopBarProps) {
  const { user } = useAuth()
  const { title, subtitle } = useContext(PageTitleContext)

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full shrink-0 items-center justify-between border-b border-outline-variant bg-surface px-md py-md sm:px-lg">
      <div className="flex min-w-0 flex-1 items-center gap-sm sm:gap-md">
        <MFIconButton
          className="md:hidden"
          aria-label="Open navigation"
          aria-controls="role-sidebar"
          aria-expanded={isNavigationOpen}
          onClick={onOpenNavigation}
        >
          <span className="material-symbols-outlined" aria-hidden="true">menu</span>
        </MFIconButton>
        <h1 className="shrink-0 text-title-lg font-bold tracking-tight text-primary md:hidden">
          MangaFlow
        </h1>
        <div className="hidden md:block min-w-0">
          {title ? (
            <div className="truncate">
              <h2 className="truncate text-title-lg text-on-surface">{title}</h2>
              {subtitle ? (
                <p className="truncate text-label-sm text-on-surface-variant">{subtitle}</p>
              ) : null}
            </div>
          ) : (
            <div className="w-10 h-10" />
          )}
        </div>
      </div>

      <div className="hidden flex-1 justify-center sm:flex">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden="true">search</span>
          <input
            aria-label="Search MangaFlow"
            className="w-full rounded-full border-none bg-surface-container-low py-sm pl-xl pr-md text-body-md transition-all placeholder:text-outline focus:bg-surface-lowest focus:outline-none focus:ring-4 focus:ring-primary/20"
            placeholder="Search users, series, or logs..."
            type="text"
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-xs sm:gap-sm">
        <MFIconButton aria-label="Open notifications">
          <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
        </MFIconButton>
        <MFIconButton aria-label="Open settings" className="hidden sm:inline-flex">
          <span className="material-symbols-outlined" aria-hidden="true">settings</span>
        </MFIconButton>
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
