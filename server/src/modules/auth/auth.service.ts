import { z } from "zod";

export const systemRoleSchema = z.enum([
  "ADMIN",
  "MANGAKA",
  "ASSISTANT",
  "EDITOR",
  "BOARD"
]);

export const userStatusSchema = z.enum(["ACTIVE", "SUSPENDED"]);

const requestedSystemRoleSchema = z.enum(["MANGAKA", "ASSISTANT"]);

export type SystemRole = z.infer<typeof systemRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type RequestedSystemRole = z.infer<typeof requestedSystemRoleSchema>;

export type ClerkUserProfile = {
  clerkId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
};

export type AuthUser = {
  id: string;
  clerkId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  systemRole: SystemRole | null;
  requestedSystemRole: RequestedSystemRole | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

export type OnboardingInput = {
  fullName?: string;
  avatarUrl?: string | null;
  requestedSystemRole?: string;
};

export type SafeOnboardingInput = {
  fullName?: string;
  avatarUrl?: string | null;
  requestedSystemRole?: RequestedSystemRole;
};

export type UserRepository = {
  findByClerkId(clerkId: string): Promise<AuthUser | null>;
  upsertFromClerk(profile: ClerkUserProfile): Promise<AuthUser>;
  updateOnboarding(
    clerkId: string,
    input: SafeOnboardingInput
  ): Promise<AuthUser | null>;
};

export type AuthRedirectState = {
  onboardingRequired: boolean;
  blocked: boolean;
  redirectTo: string;
};

export class AuthServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

const roleRedirects: Record<SystemRole, string> = {
  ADMIN: "/app/admin/dashboard",
  MANGAKA: "/app/mangaka/dashboard",
  ASSISTANT: "/app/assistant/dashboard",
  EDITOR: "/app/editor/dashboard",
  BOARD: "/app/board/dashboard"
};

const onboardingSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  requestedSystemRole: z.string().optional()
});

export function createAuthService(userRepository: UserRepository) {
  return {
    async getCurrentUser(clerkId: string) {
      return userRepository.findByClerkId(clerkId);
    },

    async syncUserFromClerk(profile: ClerkUserProfile) {
      return userRepository.upsertFromClerk(profile);
    },

    async completeOnboarding(clerkId: string, input: OnboardingInput) {
      const parsed = onboardingSchema.safeParse(input);

      if (!parsed.success) {
        throw new AuthServiceError(
          "ONBOARDING_INVALID",
          "Invalid onboarding input",
          400
        );
      }

      const requested = parsed.data.requestedSystemRole;
      if (requested && !requestedSystemRoleSchema.safeParse(requested).success) {
        throw new AuthServiceError(
          "ONBOARDING_ROLE_FORBIDDEN",
          "Requested role cannot be self-assigned",
          403
        );
      }

      const user = await userRepository.updateOnboarding(clerkId, {
        fullName: parsed.data.fullName,
        avatarUrl: parsed.data.avatarUrl,
        requestedSystemRole: requested as RequestedSystemRole | undefined
      });

      if (!user) {
        throw new AuthServiceError("USER_NOT_FOUND", "User not found", 404);
      }

      return user;
    },

    getAuthRedirectState(user: Pick<AuthUser, "systemRole" | "status">) {
      if (user.status === "SUSPENDED") {
        return {
          onboardingRequired: false,
          blocked: true,
          redirectTo: "/app/blocked"
        } satisfies AuthRedirectState;
      }

      if (!user.systemRole) {
        return {
          onboardingRequired: true,
          blocked: false,
          redirectTo: "/app/onboarding"
        } satisfies AuthRedirectState;
      }

      return {
        onboardingRequired: false,
        blocked: false,
        redirectTo: roleRedirects[user.systemRole]
      } satisfies AuthRedirectState;
    }
  };
}

