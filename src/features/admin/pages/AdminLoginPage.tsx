import { Button, Input, Label } from "@/shared/ui";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";

const AdminLoginPage = () => {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[radial-gradient(circle_at_top,hsl(var(--secondary)/0.55)_0%,transparent_38%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--off-white))_100%)]">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="soft-panel w-full max-w-md p-8"
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
              <Lock className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-heading text-xl font-semibold text-foreground">Redo Admin</span>
          </div>

          <h1 className="font-heading text-2xl font-semibold text-foreground mb-1">Admin Login</h1>
          <p className="text-muted-foreground font-body text-sm mb-8">
            Sign in to manage the platform
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                type="email"
                placeholder="admin@redo.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 font-body border-border bg-background/88"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 font-body border-border bg-background/88 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm font-body text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full h-12 font-body font-semibold"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm font-body text-muted-foreground mt-6">
            <Link to="/login" className="text-accent font-medium hover:underline">
              Back to user login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
