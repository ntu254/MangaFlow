import { Link, Outlet } from "react-router-dom"

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="text-display font-bold text-primary">
            MangaFlow
          </Link>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
