import { Link } from "react-router-dom"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFButton } from "@/shared/components/ui/MFButton"

export function LoginPage() {
  return (
    <MFCard padding="lg">
      <h2 className="mb-6 text-center text-headline-md text-on-surface">Sign In</h2>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="email" className="mb-1 block text-label-md text-on-surface">Email</label>
          <input
            id="email"
            type="email"
            className="w-full rounded-xl border border-outline-variant bg-surface-lowest px-4 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-muted focus:border-primary focus:outline-none focus:shadow-focus"
            placeholder="you@studio.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-label-md text-on-surface">Password</label>
          <input
            id="password"
            type="password"
            className="w-full rounded-xl border border-outline-variant bg-surface-lowest px-4 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-muted focus:border-primary focus:outline-none focus:shadow-focus"
          />
        </div>
        <MFButton className="w-full" type="submit">Sign In</MFButton>
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
