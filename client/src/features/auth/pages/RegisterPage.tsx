import { Link } from "react-router-dom"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFButton } from "@/shared/components/ui/MFButton"

export function RegisterPage() {
  return (
    <MFCard padding="lg">
      <h2 className="mb-6 text-center text-headline-md text-on-surface">Create Account</h2>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="reg-name" className="mb-1 block text-label-md text-on-surface">Name</label>
          <input
            id="reg-name"
            type="text"
            className="w-full rounded-xl border border-outline-variant bg-surface-lowest px-4 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-muted focus:border-primary focus:outline-none focus:shadow-focus"
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="mb-1 block text-label-md text-on-surface">Email</label>
          <input
            id="reg-email"
            type="email"
            className="w-full rounded-xl border border-outline-variant bg-surface-lowest px-4 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-muted focus:border-primary focus:outline-none focus:shadow-focus"
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="mb-1 block text-label-md text-on-surface">Password</label>
          <input
            id="reg-password"
            type="password"
            className="w-full rounded-xl border border-outline-variant bg-surface-lowest px-4 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-muted focus:border-primary focus:outline-none focus:shadow-focus"
          />
        </div>
        <MFButton className="w-full" type="submit">Create Account</MFButton>
      </form>
      <p className="mt-4 text-center text-body-md text-on-surface-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </MFCard>
  )
}
