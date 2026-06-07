import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/shared/components/auth/AuthProvider"
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute"
import { MarketingLayout } from "@/shared/components/layout/MarketingLayout"
import { AuthLayout } from "@/shared/components/layout/AuthLayout"
import { DashboardLayout } from "@/shared/components/layout/DashboardLayout"
import { LandingPage } from "@/features/marketing/pages/LandingPage"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboardPage"

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route path="/app" element={<DashboardLayout />}>
          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="admin/dashboard" element={<AdminDashboardPage />} />
          </Route>
        </Route>
        <Route path="/app" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
