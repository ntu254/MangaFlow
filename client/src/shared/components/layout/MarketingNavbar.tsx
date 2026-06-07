import { Link } from "react-router-dom"
import { useAuth } from "@/shared/components/auth/AuthProvider"
import { MFButton } from "@/shared/components/ui/MFButton"

export function MarketingNavbar() {
  const { isAuthenticated } = useAuth()

  return (
    <nav className="bg-surface/80 backdrop-blur-md rounded-full mt-lg mx-auto w-[90%] max-w-7xl sticky top-4 z-50 flex justify-between items-center px-xl py-md border border-outline-variant/30 shadow-sm transition-transform duration-200 hover:scale-[0.99]">
      <Link to="/" className="flex items-center gap-md">
        <span className="material-symbols-outlined text-primary text-[32px] icon-fill">draw</span>
        <span className="font-display text-title-lg text-primary font-bold">MangaFlow</span>
      </Link>
      <div className="flex items-center gap-md">
        {isAuthenticated ? (
          <Link to="/app/dashboard">
            <MFButton variant="primary" size="sm">Dashboard</MFButton>
          </Link>
        ) : (
          <>
            <Link to="/login">
              <button className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200 px-md py-sm">
                Sign In
              </button>
            </Link>
            <Link to="/login">
              <button className="bg-primary text-on-primary font-label-md text-label-md px-lg py-sm rounded-full hover:bg-primary-container transition-colors shadow-sm">
                Get Started
              </button>
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
