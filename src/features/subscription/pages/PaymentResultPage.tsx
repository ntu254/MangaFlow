import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Loader2, ArrowRight, RefreshCw, AlertTriangle, Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { supabase } from "@/shared/lib";

type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded" | "expired";

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const statusParam = searchParams.get("status");
  const orderCode = searchParams.get("orderCode");
  const planName = searchParams.get("planName");
  const planId = searchParams.get("planId");

  const cancelParam = searchParams.get("cancel");

  const [pageStatus, setPageStatus] = useState<"processing" | "success" | "cancelled" | "failed" | "timeout">(() => {
    if (statusParam === "cancelled" || statusParam === "CANCELLED" || cancelParam === "true") return "cancelled";
    return "processing";
  });
  const [retryCount, setRetryCount] = useState(0);

  const { data: plan } = useQuery<any>({
    queryKey: ["payment-plan", planId || planName],
    queryFn: async () => {
      if (planId) {
        const { data } = await (supabase as any).from("plans").select("name, price_monthly, price_yearly, credits_per_month").eq("id", planId).maybeSingle();
        return data;
      }
      if (planName) {
        const { data } = await (supabase as any).from("plans").select("name, price_monthly, price_yearly, credits_per_month").eq("slug", planName.toLowerCase()).maybeSingle();
        return data;
      }
      return null;
    },
    enabled: !!planId || !!planName,
  });

  useEffect(() => {
    if (!orderCode || pageStatus === "cancelled" || pageStatus === "failed" || pageStatus === "success") return;

    const currentOc = orderCode;

    supabase.functions.invoke("verify-payment", {
      body: { orderCode: Number(currentOc) },
    }).then(({ data, error }) => {
      if (error) throw error;
      if (data?.status === "completed") {
        setPageStatus("success");
      } else if (["failed", "expired", "refunded"].includes(data?.status ?? "")) {
        setPageStatus("failed");
      }
    }).catch((err) => {
      console.error("verify-payment error:", err);
    });

    const channel = supabase
      .channel(`payment-${currentOc}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "payments", filter: `order_code=eq.${currentOc}` }, (payload) => {
        const newStatus = payload.new?.status as PaymentStatus | undefined;
        if (newStatus === "completed") setPageStatus("success");
        else if (newStatus === "failed" || newStatus === "expired") setPageStatus("failed");
      })
      .subscribe();

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const { data } = await (supabase as any)
        .from("payments")
        .select("status")
        .eq("order_code", currentOc)
        .maybeSingle();

      const status = (data as any)?.status;
      if (status === "completed") {
        setPageStatus("success");
        clearInterval(interval);
        channel.unsubscribe();
        return;
      }
      if (["failed", "expired", "refunded"].includes(status ?? "")) {
        setPageStatus("failed");
        clearInterval(interval);
        channel.unsubscribe();
        return;
      }
      if (attempts >= 40) {
        setPageStatus("timeout");
        clearInterval(interval);
        channel.unsubscribe();
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, [orderCode, retryCount]);

  const handleRetry = () => {
    setPageStatus("processing");
    setRetryCount((c) => c + 1);
  };

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user?.id ?? null));
  }, []);

  const { data: subscriptionInfo } = useQuery({
    queryKey: ["my-plan", currentUser],
    queryFn: async () => {
      if (!currentUser) return null;
      const { data: sub } = await supabase.from("subscriptions").select("*, plans(*)").eq("user_id", currentUser).maybeSingle();
      return sub;
    },
    enabled: pageStatus === "success",
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        {pageStatus === "processing" && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-accent mx-auto mb-6" />
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Đang xác nhận thanh toán...</h1>
            <p className="text-foreground/60 mb-6">Vui lòng chờ trong giây lát. Trang sẽ tự động cập nhật.</p>
            <Button onClick={handleRetry} variant="outline" size="sm" className="gap-2 text-xs">
              <RefreshCw className="w-3 h-3" /> Kiểm tra lại
            </Button>
          </>
        )}

        {pageStatus === "timeout" && (
          <>
            <Clock className="w-16 h-16 text-amber-500 mx-auto mb-6" />
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Xác nhận chậm hơn dự kiến</h1>
            <p className="text-foreground/60 mb-2">
              Thanh toán của bạn có thể đã thành công nhưng chưa được cập nhật. Vui lòng kiểm tra lại trong trang cá nhân.
            </p>
            <p className="text-foreground/40 text-sm mb-8">Hoặc chạm "Thử lại" để kiểm tra lại.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRetry} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" /> Thử lại
              </Button>
              <Button onClick={() => navigate("/profile")} variant="ghost">Về trang cá nhân</Button>
            </div>
          </>
        )}

        {pageStatus === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Thanh toán thành công!</h1>
            <p className="text-foreground/60 mb-4">Gói Premium đã được kích hoạt. Cảm ơn bạn đã nâng cấp!</p>
            {subscriptionInfo && (
              <div className="border border-border bg-secondary/30 rounded-lg p-4 mb-6 text-left mx-auto max-w-sm">
                <p className="text-sm font-semibold text-foreground">{subscriptionInfo.plans?.name || plan?.name || "Premium"}</p>
                <p className="text-xs text-foreground/60 mt-1">
                  {subscriptionInfo.plans?.credits_per_month
                    ? `${subscriptionInfo.plans.credits_per_month} AI credits/tháng`
                    : "AI credits không giới hạn"}
                </p>
              </div>
            )}
            <Button onClick={() => navigate("/profile")} variant="accent" className="gap-2">
              Về trang cá nhân <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {pageStatus === "cancelled" && (
          <>
            <XCircle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Đã hủy thanh toán</h1>
            <p className="text-foreground/60 mb-2">Bạn đã hủy giao dịch. Không có khoản phí nào được tính.</p>
            {(planId || planName) && (
              <p className="text-foreground/40 text-sm mb-8">
                Gói {plan?.name || planName || "Premium"} chưa được kích hoạt.
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/pricing")} variant="outline">Thử lại</Button>
              <Button onClick={() => navigate("/profile")} variant="ghost">Về trang cá nhân</Button>
            </div>
          </>
        )}

        {pageStatus === "failed" && (
          <>
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Giao dịch thất bại</h1>
            <p className="text-foreground/60 mb-6">Thanh toán không thành công. Vui lòng thử lại.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/pricing")} variant="outline">Thử lại</Button>
              <Button onClick={() => navigate("/profile")} variant="ghost">Về trang cá nhân</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
