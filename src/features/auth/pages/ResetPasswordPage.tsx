import { useMutation } from "@tanstack/react-query";
import heroImg from "@/assets/hero-fashion-1.jpg";
import { Button, Input, Label } from "@/shared/ui";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () => {
      if (password.length < 8) throw new Error("Mật khẩu cần tối thiểu 8 ký tự");
      if (password !== confirmPassword) throw new Error("Mật khẩu xác nhận không khớp");
      return authService.updatePassword(password);
    },
    onSuccess: () => {
      window.setTimeout(() => navigate("/login"), 900);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden">
        <img src={heroImg} alt="Fashion editorial" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <h2 className="font-heading text-4xl xl:text-5xl font-semibold text-background leading-tight mb-4">
            Đặt lại mật khẩu
          </h2>
          <p className="text-background/70 font-body text-sm max-w-sm leading-relaxed">
            Tạo mật khẩu mới để bảo vệ tài khoản thời trang AI của bạn.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[radial-gradient(circle_at_top,hsl(var(--secondary)/0.55)_0%,transparent_38%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--off-white))_100%)]">
        <motion.div
          className="soft-panel w-full max-w-lg p-7 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-10">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="font-heading text-xl font-semibold text-foreground">Redo</span>
          </div>

          <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
            Mật khẩu mới
          </h1>
          <p className="text-muted-foreground font-body text-sm mb-8">
            Chọn mật khẩu mạnh và khác với mật khẩu cũ.
          </p>

          {updateMutation.isSuccess && (
            <div className="flex items-center gap-2 p-3 mb-5 bg-green-500/5 border border-green-500/20 text-green-700 text-sm font-body">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Mật khẩu đã được cập nhật.
            </div>
          )}

          {updateMutation.isError && (
            <div className="flex items-center gap-2 p-3 mb-5 bg-destructive/5 border border-destructive/20 text-destructive text-sm font-body">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {(updateMutation.error as Error)?.message ?? "Không thể cập nhật mật khẩu"}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                Mật khẩu mới
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
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

            <div className="space-y-2">
              <Label className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                Xác nhận mật khẩu
              </Label>
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 font-body border-border bg-background/88"
                required
              />
            </div>

            <Button
              variant="accent"
              size="lg"
              className="w-full h-12 font-body font-semibold"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cập nhật mật khẩu"}
            </Button>
          </form>

          <p className="text-center text-sm font-body text-muted-foreground mt-8">
            Quay lại{" "}
            <Link to="/login" className="text-accent font-medium hover:underline">
              đăng nhập
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
