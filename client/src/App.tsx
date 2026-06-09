import { Suspense } from "react"
import { Routes } from "react-router-dom"
import { AuthProvider } from "@/shared/components/auth/AuthProvider"
import { AppRoutes } from "@/routes/AppRoutes"

function AppRouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-md rounded-full bg-surface px-lg py-md shadow-soft-xl">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-label-lg text-on-surface">Loading workspace...</span>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<AppRouteFallback />}>
        <Routes>
          {AppRoutes()}
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}

export default App
