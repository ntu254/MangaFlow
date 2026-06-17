import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  PenLine,
  GalleryVerticalEnd,
  Shield,
  Crown,
  Workflow,
  CheckCircle2,
} from 'lucide-react'
import { useState } from 'react'
import type { UserRole } from '@/types'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Minimum 6 characters'),
})
type LoginForm = z.infer<typeof loginSchema>

type Demo = {
  role: UserRole
  label: string
  name: string
  email: string
  icon: React.ReactNode
  tone: string
}

const DEMO_ACCOUNTS: Demo[] = [
  { role: 'MANGAKA',   label: 'Mangaka',   name: 'Mika Tanaka',     email: 'mika.tanaka@mangaflow.local', icon: <PenLine size={14} />,             tone: 'bg-violet-50 text-violet-700 border-violet-200' },
  { role: 'EDITOR',    label: 'Editor',    name: 'Itō Sawamura',    email: 'tantou.ito@mangaflow.local',   icon: <GalleryVerticalEnd size={14} />,  tone: 'bg-purple-50 text-purple-700 border-purple-200' },
  { role: 'ASSISTANT', label: 'Assistant', name: 'Yuto Kondō',      email: 'yuto@mangaflow.local',         icon: <Sparkles size={14} />,            tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  { role: 'BOARD',     label: 'Board',     name: 'Kenji Watanabe',  email: 'board.kenji@mangaflow.local',  icon: <Crown size={14} />,               tone: 'bg-orange-50 text-orange-700 border-orange-200' },
  { role: 'ADMIN',     label: 'Admin',     name: 'Naoko Hayashi',   email: 'admin@mangaflow.local',        icon: <Shield size={14} />,              tone: 'bg-slate-100 text-slate-700 border-slate-200' },
]

const ROLE_REDIRECT: Record<UserRole, string> = {
  ADMIN: '/app/admin/dashboard',
  MANGAKA: '/app/mangaka/dashboard',
  ASSISTANT: '/app/assistant/dashboard',
  EDITOR: '/app/editor/dashboard',
  BOARD: '/app/board/dashboard',
}

export default function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth()
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = (data: LoginForm) => login(data)

  const handleDemo = (account: Demo) => {
    setValue('email', account.email)
    setValue('password', 'demo1234')
    setAuth(
      {
        _id: `demo-${account.role.toLowerCase()}`,
        name: account.name,
        email: account.email,
        role: account.role,
        status: 'ACTIVE',
        avatar: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      `demo-access-${account.role.toLowerCase()}`,
      `demo-refresh-${account.role.toLowerCase()}`,
    )
    navigate(ROLE_REDIRECT[account.role])
  }

  return (
    <div className="min-h-screen w-full flex bg-background" data-testid="login-page">
      {/* ── Left brand panel (hidden on mobile) ──────────────────────── */}
      <aside
        className="relative hidden lg:flex lg:w-[52%] xl:w-[55%] overflow-hidden bg-aurora"
        aria-hidden
      >
        {/* Soft gradient blobs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-[440px] w-[440px] rounded-full bg-violet-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-24 h-[420px] w-[420px] rounded-full bg-fuchsia-400/25 blur-3xl" />
        <div className="pointer-events-none absolute right-32 bottom-0 h-[300px] w-[300px] rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-500 text-white shadow-soft-md">
                <span className="font-bold text-xl leading-none">M</span>
              </div>
              <div>
                <div className="text-xl font-semibold tracking-tight text-slate-900">MangaFlow</div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Production Hub for Manga Studios
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-slate-700 border border-slate-200/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 soft-pulse" /> v0.26 · live
            </span>
          </header>

          {/* Hero */}
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-white/70 backdrop-blur px-3 py-1 text-xs font-medium text-violet-700">
              <Sparkles size={12} />
              From first panel to final print
            </div>
            <h2 className="text-5xl font-semibold leading-[1.05] tracking-tight text-slate-900 xl:text-[56px]">
              The studio that{' '}
              <span className="gradient-violet">moves with you.</span>
            </h2>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-slate-600">
              A friendly workspace for Mangaka, Assistants, Tantou Editors and the
              Editorial Board. Plan series, run page studios, hand off tasks and
              approve chapters — all in one calm, modern hub.
            </p>

            {/* Feature pills */}
            <ul className="mt-8 grid grid-cols-2 gap-3 max-w-md">
              {[
                { icon: <Workflow size={14} />, label: 'Proposal → Print workflow' },
                { icon: <Sparkles size={14} />, label: 'AI region segmentation' },
                { icon: <CheckCircle2 size={14} />, label: 'Editor & Board approval' },
                { icon: <GalleryVerticalEnd size={14} />, label: 'Page studio with comments' },
              ].map((f) => (
                <li
                  key={f.label}
                  className="flex items-center gap-2 rounded-lg border border-slate-200/70 bg-white/70 backdrop-blur px-3 py-2 text-xs font-medium text-slate-700 shadow-soft"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-violet-100 text-violet-700">
                    {f.icon}
                  </span>
                  {f.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <footer className="flex items-center justify-between text-xs text-slate-500">
            <div className="font-medium">© 2026 MangaFlow Studio</div>
            <div className="flex gap-4">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Help center</span>
            </div>
          </footer>
        </div>
      </aside>

      {/* ── Sign-in column ───────────────────────────────────────────── */}
      <main className="relative flex flex-1 items-center justify-center px-6 py-10 lg:px-14 bg-card">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-500 text-white shadow-soft-md">
              <span className="font-bold text-lg leading-none">M</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">MangaFlow</span>
          </div>

          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              Welcome back
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Step into the studio
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to continue your manga production workflow. Your role-aware
              dashboard awaits.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@studio.com"
                  data-testid="login-email-input"
                  {...register('email')}
                  className={cn("pl-10 h-11", errors.email && "border-destructive focus-visible:border-destructive")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive" data-testid="login-email-error">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <a
                  href="#"
                  className="text-xs font-medium text-primary hover:text-primary-hover"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  data-testid="login-password-input"
                  {...register('password')}
                  className={cn("pl-10 pr-10 h-11", errors.password && "border-destructive focus-visible:border-destructive")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="login-toggle-password"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive" data-testid="login-password-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-2"
                defaultChecked
              />
              Keep me signed in on this device
            </label>

            {loginError && (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm text-destructive"
                data-testid="login-error"
              >
                The credentials provided didn't match any account.
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoggingIn}
              data-testid="login-submit-button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Or try a demo workspace
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Demo accounts */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DEMO_ACCOUNTS.map((d) => (
              <button
                key={d.role}
                type="button"
                onClick={() => handleDemo(d)}
                disabled={isLoggingIn}
                data-testid={`login-demo-${d.label.toLowerCase()}`}
                className={cn(
                  "group flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all hover:-translate-y-px hover:shadow-soft-md",
                  d.tone
                )}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/60">
                  {d.icon}
                </span>
                <span className="truncate text-left">{d.label}</span>
              </button>
            ))}
          </div>

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-muted-foreground">
            Don't have an account?{' '}
            <a href="#" className="font-medium text-primary hover:text-primary-hover">
              Request studio access
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
