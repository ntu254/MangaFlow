import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";

export function SignInPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await login(email, password);
      // Success redirect based on backend role-mapping redirection path
      navigate(res.auth.redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#fff9fb] via-[#f8f1ff] to-[#fff7ec]">
      {/* Dynamic ambient background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[10%] top-[15%] size-[500px] rounded-full bg-[#9065d5]/[0.07] blur-[100px]" />
        <div className="absolute right-[5%] top-[40%] size-[400px] rounded-full bg-[#e560bc]/[0.06] blur-[100px]" />
        <div className="absolute bottom-[10%] left-[30%] size-[350px] rounded-full bg-[#ffc95e]/[0.08] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4"
      >
        <div className="bg-white border border-[#eadff6] rounded-2xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(144,101,213,0.12)]">
          
          {/* Logo / Title area */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#eadff6] bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#9065d5]">
              <Sparkles className="size-3.5" />
              Manga Production Platform
            </span>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-5 font-bold text-[#2f243a]"
              style={{ fontSize: "1.75rem", lineHeight: "2.25rem" }}
            >
              Welcome to{" "}
              <span className="bg-gradient-to-r from-[#9065d5] via-[#e560bc] to-[#ff7196] bg-clip-text text-transparent">
                MangaFlow
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-1.5 text-sm text-[#5f5270]"
            >
              Sign in to manage your manga workflow
            </motion.p>
          </motion.div>

          {/* Form area */}
          <motion.form
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            {/* Error alerts */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs"
                >
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-[#5f5270]">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8a7a99]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@mangaflow.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 pr-4 py-2 border-[#eadff6] hover:border-[#9065d5]/50 focus:border-[#9065d5] focus:ring-[#9065d5]/10 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-semibold text-[#5f5270]">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8a7a99]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 pr-10 py-2 border-[#eadff6] hover:border-[#9065d5]/50 focus:border-[#9065d5] focus:ring-[#9065d5]/10 rounded-xl text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8a7a99] hover:text-[#9065d5]"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-gradient-to-r from-[#9065d5] to-[#e560bc] hover:from-[#7c54be] hover:to-[#ce4fa5] text-white font-bold py-2 px-4 rounded-xl shadow-lg shadow-[#9065d5]/20 hover:shadow-xl hover:shadow-[#9065d5]/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </motion.form>

          {/* Footer branding details */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center text-xs text-[#8a7a99] mt-8"
          >
            MangaFlow production suite. Authorized access only.
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
