import { LogIn } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";

/**
 * A full-screen overlay that prompts unauthenticated users to log in
 * when they try to interact with AI features. Designed to be shown
 * conditionally inside pages that allow guest viewing.
 */
export function LoginPromptOverlay() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl shadow-xl max-w-sm w-full p-8 text-center space-y-5">
        <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
          <LogIn className="w-6 h-6 text-accent" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-lg font-bold text-foreground">
            Đăng nhập để sử dụng
          </h2>
          <p className="text-sm text-muted-foreground font-body leading-relaxed">
            Bạn cần đăng nhập để sử dụng tính năng AI. Tạo tài khoản miễn phí chỉ trong vài giây.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <Button
            onClick={() => navigate("/login", { state: { from: location.pathname } })}
            variant="default"
            className="w-full gap-2"
          >
            <LogIn className="w-4 h-4" /> Đăng nhập
          </Button>
          <Button
            onClick={() => navigate("/signup", { state: { from: location.pathname } })}
            variant="outline"
            className="w-full"
          >
            Tạo tài khoản mới
          </Button>
        </div>
      </div>
    </div>
  );
}
