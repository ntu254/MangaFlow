import { profileService } from "@/features/profile/services/profile.service";
import { subscriptionService } from "@/features/subscription/services/subscription.service";

export interface CreditCheckResult {
  allowed: boolean;
  remaining: number | null;
  message?: string;
}

export const creditService = {
  async checkCanUseAi(): Promise<CreditCheckResult> {
    const { data: { user } } = await import("@/features/auth/hooks/useAuth").then((mod) => mod.useAuth());
    if (!user) {
      return { allowed: false, remaining: 0, message: "Vui lòng đăng nhập để sử dụng AI." };
    }

    const [profile, subscription] = await Promise.all([
      profileService.getProfile(user.id),
      subscriptionService.getSubscription(user.id),
    ]);

    const credits = subscription?.credits_remaining ?? subscription?.plan?.credits_per_month ?? 0;
    const aiEnabled = subscription?.plan?.has_ai_analysis ?? true;

    if (!aiEnabled) {
      return { allowed: false, remaining: credits, message: "Gói hiện tại chưa bao gồm tính năng AI. Nâng cấp gói để tiếp tục." };
    }

    if ((credits ?? 0) <= 0) {
      return { allowed: false, remaining: 0, message: "Bạn đã hết credit AI. Vui lòng nạp thêm." };
    }

    return { allowed: true, remaining: credits ?? 0 };
  },
};
