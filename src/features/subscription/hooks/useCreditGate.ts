import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { subscriptionService } from "@/features/subscription/services/subscription.service";

export type CreditGateStatus = {
  aiEnabled: boolean;
  creditsRemaining: number | null;
  reason?: string;
};

export function useCreditGate() {
  const { session, loading } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["credit-gate", session?.user?.id],
    enabled: !loading && Boolean(session?.user?.id),
    queryFn: async (): Promise<CreditGateStatus | null> => {
      if (!session?.user?.id) {
        return {
          aiEnabled: false,
          creditsRemaining: 0,
          reason: "Chưa đăng nhập",
        };
      }

      const subscription = await subscriptionService.getSubscription(session.user.id);
      const plan = subscription?.plan ?? null;
      const creditsRemaining = subscription?.credits_remaining ?? plan?.credits_per_month ?? 0;
      const aiEnabled = Boolean(plan?.has_ai_analysis) || creditsRemaining > 0;

      if (!aiEnabled && creditsRemaining <= 0) {
        return {
          aiEnabled: false,
          creditsRemaining,
          reason: "Bạn không còn credit AI cho gói hiện tại.",
        };
      }

      if (!aiEnabled) {
        return {
          aiEnabled: false,
          creditsRemaining,
          reason: "Gói hiện tại chưa bao gồm tính năng AI.",
        };
      }

      if (creditsRemaining <= 0) {
        return {
          aiEnabled: false,
          creditsRemaining,
          reason: "Đã hết credit AI. Vui lòng nâng cấp gói.",
        };
      }

      return {
        aiEnabled: true,
        creditsRemaining,
      };
    },
  });

  return {
    status: (data ?? null) as CreditGateStatus | null,
    isLoading: loading || isLoading,
    error,
  };
}
