import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Eye, EyeOff, ArrowRight, Mail, Lock } from "lucide-react";
import heroBg from "@/shared/assets/hero-vagabond.jpg";
import { ThemeProvider } from "@/shared/lib/theme";
import { Logo } from "@/shared/ui/site/Logo";
import { ThemeToggle } from "@/shared/ui/site/ThemeToggle";
import { setTokens } from "@/shared/lib/api";
import { useRole, type Role } from "@/shared/lib/role";
import { authApi, extractErrorMessage } from "@/shared/api";

export function LoginView({ onLoggedIn }: { onLoggedIn?: () => void } = {}) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setUser, setRole } = useRole();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      setTokens(data.accessToken, data.refreshToken);
      setUser({ ...data.user, role: data.user.role });
      const userRole = (data.user.role || "").toLowerCase() as Role;
      setRole(userRole);
      if (onLoggedIn) onLoggedIn();
      else window.location.assign("/app");
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider>
      <div className="grid min-h-screen w-full md:grid-cols-2">
        {/* Left — hero (always light/cream, regardless of theme) */}
        <div
          className="relative hidden overflow-hidden md:block"
          style={{ backgroundColor: "#F7F5F0" }}
        >
          <img
            src={heroBg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-75 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#F7F5F0]/70 via-[#F7F5F0]/30 to-transparent" />

          <div className="relative flex h-full flex-col justify-between p-10 text-[#061A2B]">
            <Logo />
            <div className="max-w-md">
              <p className="font-jp text-sm text-[#061A2B]/60">
                世界中の読者に最高のマンガを届けます。
              </p>
              <h2 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight text-[#061A2B]">
                Read manga,
                <br />
                without borders.
              </h2>
              <p className="mt-3 text-sm text-[#061A2B]/60">
                Pick up where you left off across 975+ titles — updated daily.
              </p>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="page-gradient relative flex items-center justify-center px-6 py-10">
          <div className="absolute right-6 top-6">
            <ThemeToggle />
          </div>

          <div className="w-full max-w-[380px]">
            <div className="mb-8 md:hidden">
              <Logo />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in to continue reading</p>

            <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-wider text-foreground/45">
              <span className="h-px flex-1 bg-foreground/10" />
              Sign in with email
              <span className="h-px flex-1 bg-foreground/10" />
            </div>

            {error && (
              <div className="mb-4 rounded bg-red-500/10 p-3 text-xs text-red-500 border border-red-500/25">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-foreground/80">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-10 w-full rounded-md border border-foreground/15 bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-foreground/35 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-foreground/80">
                  Password
                </span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                  <input
                    type={show ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 w-full rounded-md border border-foreground/15 bg-background pl-9 pr-10 text-sm text-foreground placeholder:text-foreground/35 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-foreground/50 hover:text-foreground"
                    aria-label="Toggle password visibility"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-foreground/70">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-foreground/20 accent-[var(--primary)]"
                  />
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-55"
              >
                {loading ? "Signing in..." : "Sign in"} <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-10 text-center text-[10px] text-foreground/40">
              <Link to="/" className="hover:text-foreground/70">
                ← Back to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
