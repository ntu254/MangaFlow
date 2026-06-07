import { Link } from "react-router-dom"
import { MFButton } from "@/shared/components/ui/MFButton"

export function MarketingNavbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-outline-variant bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="text-title-lg font-bold text-primary">
          MangaFlow
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <MFButton variant="ghost" size="sm">Sign In</MFButton>
          </Link>
          <Link to="/register">
            <MFButton variant="primary" size="sm">Get Started</MFButton>
          </Link>
        </div>
      </div>
    </nav>
  )
}
