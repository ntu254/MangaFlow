import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Crown, Check, Loader2, ArrowLeft, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { subscriptionService } from "../services/subscription.service";
import { useAuth } from "@/features/auth/hooks/useAuth";

const FEATURES: Record<string, { label: string; included: (plan: any) => boolean }[]> = {
  common: [
    { label: "Tạo outfit AI", included: (p) => p.ai_generations_limit === 0 || p.ai_generations_limit > 0 },
    { label: "Phân tích tủ đồ", included: (p) => p.has_ai_analysis },
    { label: "Kho đồ không giới hạn", included: (p) => p.wardrobe_limit === 0 || p.wardrobe_limit > 20 },
    { label: "Xu hướng thời trang", included: (p) => p.has_trend_insights },
    { label: "Liên kết mua sắm", included: (p) => p.has_affiliate_access },
    { label: "Hỗ trợ ưu tiên", included: (p) => p.has_priority_support },
  ],
};

export default function PricingPage() {
  const { session } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: subscriptionService.getPlans,
  });

  const handleSelect = async (planId: string, planSlug?: string) => {
    // Redirect guests to login before purchasing
    if (!session) {
      navigate("/login", { state: { from: "/pricing" } });
      return;
    }

    setLoadingId(planId);
    setNetworkError(null);

    timeoutRef.current = setTimeout(() => {
      setNetworkError("Kết nối đến cổng thanh toán quá lâu. Vui lòng kiểm tra mạng và thử lại.");
      setLoadingId(null);
    }, 15000);

    try {
      const result = await subscriptionService.createCheckout(planId, billingCycle);
      clearTimeout(timeoutRef.current);
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        navigate(`/payment/result?status=error&planName=${planSlug || ""}`);
      }
    } catch (err) {
      clearTimeout(timeoutRef.current);
      const msg = (err as Error)?.message || "";
      if (msg.includes("network") || msg.includes("fetch") || msg.includes("Network") || msg.includes("Failed to fetch")) {
        setNetworkError("Không thể kết nối đến máy chủ thanh toán. Kiểm tra kết nối mạng và thử lại.");
      } else if (msg.includes("timeout") || msg.includes("Timeout")) {
        setNetworkError("Kết nối quá hạn. Vui lòng thử lại.");
      } else {
        navigate(`/payment/result?status=error&planName=${planSlug || ""}`);
      }
    } finally {
      setLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 flex flex-col justify-center relative overflow-hidden bg-background">
      <div 
        className="absolute inset-0 z-0 opacity-60 pointer-events-none"
        style={{ backgroundImage: "url('/fashion_background_theme.svg')", backgroundSize: "100% 100%", backgroundPosition: "center", backgroundRepeat: "no-repeat", filter: "blur(0.5px)" }}
      />
      <div className="max-w-6xl mx-auto w-full py-10 relative z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Crown className="w-3.5 h-3.5" /> Nâng cấp Premium
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Chọn gói phù hợp với bạn</h1>
          <p className="text-sm text-foreground/60 max-w-xl mx-auto">Mở khóa toàn bộ tính năng AI styling, phân tích nâng cao và trải nghiệm thời trang cá nhân hóa.</p>
        </div>

        {networkError && (
          <div className="max-w-md mx-auto mb-4 flex items-start gap-3 border border-red-500/20 bg-red-500/5 p-3 text-xs font-body text-red-600">
            <WifiOff className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Lỗi kết nối</p>
              <p className="text-red-500/80 mt-0.5">{networkError}</p>
            </div>
            <button type="button" onClick={() => setNetworkError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${billingCycle === "monthly" ? "bg-accent text-white" : "bg-secondary text-foreground/60 hover:text-foreground"}`}
          >
            Theo tháng
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${billingCycle === "yearly" ? "bg-accent text-white" : "bg-secondary text-foreground/60 hover:text-foreground"}`}
          >
            Theo năm
            <span className="ml-1.5 text-[10px] bg-green-500/20 text-green-600 px-1.5 py-0.5 rounded">Tiết kiệm 17%</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const price = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
            const isFree = price === 0;

            return (
              <Card key={plan.id} className={`p-6 flex flex-col ${plan.sort_order === 2 ? "border-accent ring-1 ring-accent" : ""}`}>
                {plan.sort_order === 2 && (
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-3 py-1 rounded-full inline-block w-fit mb-3">Phổ biến nhất</div>
                )}
                <h3 className="text-lg font-heading font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-xs text-foreground/50 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-3xl font-heading font-bold text-foreground">
                    {isFree ? "Miễn phí" : `${price.toLocaleString("vi-VN")}₫`}
                  </span>
                  {!isFree && <span className="text-xs text-foreground/50 ml-1">/{billingCycle === "yearly" ? "năm" : "tháng"}</span>}
                </div>
                <Button
                  onClick={() => handleSelect(plan.id, plan.slug)}
                  disabled={loadingId !== null || isFree}
                  variant={plan.sort_order === 2 ? "accent" : "outline"}
                  className="w-full mb-6"
                >
                  {loadingId === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : isFree ? "Miễn phí" : "Đăng ký ngay"}
                </Button>
                <div className="space-y-3 flex-1">
                  {FEATURES.common.map((f) => {
                    const included = f.included(plan);
                    return (
                      <div key={f.label} className={`flex items-start gap-2 text-sm ${included ? "text-foreground" : "text-foreground/30"}`}>
                        <Check className={`w-4 h-4 mt-0.5 ${included ? "text-accent" : "text-foreground/20"}`} />
                        <span>{f.label}</span>
                      </div>
                    );
                  })}
                  <div className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 mt-0.5 text-accent" />
                    <span>AI Credits: {plan.ai_generations_limit === 0 ? "Không giới hạn" : `${plan.credits_per_month}/tháng`}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
