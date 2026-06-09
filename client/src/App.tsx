import { Routes } from "react-router-dom"
import { AuthProvider } from "@/shared/components/auth/AuthProvider"
import { AppRoutes } from "@/routes/AppRoutes"

function App() {
  return (
    <AuthProvider>
      <Routes>
        <AppRoutes />
      </Routes>
    </AuthProvider>
  )
}

export default App
