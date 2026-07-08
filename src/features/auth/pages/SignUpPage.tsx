import { useMutation } from "@tanstack/react-query";
import heroImg from "@/assets/hero-fashion-1.jpg";
import { Button, Input, Label } from "@/shared/ui";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, CheckCircle, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService, type SocialProvider } from "../services/auth.service";
import { useAuth } from "../hooks/useAuth";
import { cn } from "@/lib/utils";

const styleTags = ["Minimal", "Streetwear", "Office", "Date Night"];

const SignUpPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailConfirmMsg, setEmailConfirmMsg] = useState(false);

  const validationError = useMemo(() => {
    if (!name.trim()) return "";
    if (!email.trim()) return "";
    if (password && confirmPassword && password !== confirmPassword) {
      return "Mật khẩu xác nhận không khớp";
    }
    if (password && password.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự";
    }
    return "";
  }, [name, email, password, confirmPassword]);

  const signupMutation = useMutation({
    mutationFn: () => signup(email, password, name),
    onSuccess: () => {
      if (emailConfirmMsg) return;
      setEmailConfirmMsg(true);
      navigate("/quiz", { replace: true });
    },
  });

  const socialMutation = useMutation({
    mutationFn: (provider: SocialProvider) => authService.loginWithProvider(provider),
    onSuccess: () => navigate("/quiz"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;
    signupMutation.mutate();
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] relative overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <img
            src={heroImg}
            alt="Fashion editorial"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
        </motion.div>

        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            <div className="flex gap-2 mb-6">
              {styleTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-background/10 backdrop-blur-sm border border-background/20 text-background text-[10px] font-body font-semibold uppercase tracking-wider"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="font-heading text-4xl xl:text-5xl font-semibold text-background leading-tight mb-4">
              Mặc đẹp hơn
              <br />
              cùng AI
            </h2>
            <p className="text-background/70 font-body text-sm max-w-sm leading-relaxed">
              Trợ lý AI thời trang cá nhân của bạn đã sẵn sàng giúp bạn tạo nên
              outfit hoàn hảo.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[radial-gradient(circle_at_top,hsl(var(--secondary)/0.55)_0%,transparent_38%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--off-white))_100%)]">
        <div className="flex items-center justify-end px-6 py-4 shrink-0">
          <p className="text-sm font-body text-foreground/50">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="text-accent font-semibold hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div
            className="soft-panel w-full max-w-lg p-7 sm:p-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-8 lg:mb-10">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="font-heading text-xl font-semibold text-foreground">
                Redo
              </span>
            </div>

            <h1 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mb-1.5">
              Tạo tài khoản
            </h1>
            <p className="text-foreground/50 font-body text-sm mb-6">
              Bắt đầu hành trình thời trang AI của bạn.
            </p>

            {emailConfirmMsg && (
              <div className="flex items-center gap-2 p-3 mb-5 bg-accent/5 border border-accent/20 text-accent text-sm font-body">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản. Tự động chuyển về trang đăng nhập...
              </div>
            )}

            {signupMutation.isError && !emailConfirmMsg && (
              <div className="flex items-center gap-2 p-3 mb-5 bg-destructive/5 border border-destructive/20 text-destructive text-sm font-body">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(signupMutation.error as Error)?.message ?? "Đăng ký thất bại. Vui lòng thử lại."}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label className="font-body text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
                  Tên hiển thị
                </Label>
                <Input
                  placeholder="Tên của bạn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 font-body border-border bg-background/88"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
                  Email
                </Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 font-body border-border bg-background/88"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 font-body border-border bg-background/88 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/35 hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-body text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
                  Xác nhận mật khẩu
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      "h-11 font-body border-border bg-background/88 pr-10",
                      confirmPassword && password !== confirmPassword && "border-destructive"
                    )}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/35 hover:text-foreground transition-colors"
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="flex items-center gap-1 text-[11px] text-destructive mt-1">
                    <AlertCircle className="w-3 h-3" />
                    Mật khẩu xác nhận không khớp
                  </p>
                )}
              </div>

              <div className="pt-1">
                <Button
                  variant="accent"
                  size="lg"
                  className="w-full h-11 font-body font-semibold gap-2"
                  disabled={signupMutation.isPending || !!validationError}
                >
                  {signupMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Tiếp tục <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </div>
            </form>

            <div className="flex items-center gap-4 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-body uppercase tracking-wider text-foreground/35">
                hoặc
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11 font-body gap-2 text-sm"
                onClick={() => socialMutation.mutate("google")}
                disabled={socialMutation.isPending}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-11 font-body gap-2 text-sm"
                onClick={() => socialMutation.mutate("apple")}
                disabled={socialMutation.isPending}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Apple
              </Button>
            </div>

            <p className="text-[11px] font-body text-foreground/30 mt-5 text-center leading-relaxed">
              Sau khi tạo tài khoản, bạn sẽ trả lời vài câu hỏi nhanh để AI hiểu
              phong cách của bạn.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
