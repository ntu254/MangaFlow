import { useState, type FormEvent } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFButton } from "@/shared/components/ui/MFButton"
import { loginUser } from "@/shared/api/client"
import { useAuth } from "@/shared/components/auth/AuthProvider"

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard"

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await loginUser(email, password)
    if (res.success && res.data) {
      login(res.data.user as Parameters<typeof login>[0])
      navigate(from, { replace: true })
    } else {
      setError(res.message ?? "Login failed")
    }
    setLoading(false)
  }

  return (
    <MFCard padding="lg">
      <h2 className="mb-6 text-center text-headline-md text-on-surface">Sign In</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-xl bg-error-container px-4 py-3 text-body-md text-error">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1 block text-label-md text-on-surface">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-lowest px-4 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-muted focus:border-primary focus:outline-none focus:shadow-focus"
            placeholder="you@studio.com"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-label-md text-on-surface">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-lowest px-4 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-muted focus:border-primary focus:outline-none focus:shadow-focus"
            required
          />
        </div>
        <MFButton className="w-full" type="submit" loading={loading}>Sign In</MFButton>
      </form>
      <p className="mt-4 text-center text-body-md text-on-surface-muted">
        No account?{" "}
        <Link to="/register" className="font-semibold text-primary hover:underline">
          Register
        </Link>
      </p>
    </MFCard>
  )
}
