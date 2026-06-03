import { verifyToken } from "@clerk/backend";
import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env.config.js";
import { fail } from "../../shared/responses/api-response.js";
import type { ClerkJwtPayload, ClerkUserProfile } from "./auth.service.js";

export type AuthVerifier = {
  verify(token: string): Promise<ClerkJwtPayload | null>;
  verifyWithProfile(token: string): Promise<ClerkUserProfile | null>;
};

export type AuthenticatedRequest = Request & {
  auth?: ClerkJwtPayload;
};

function getBearerToken(req: Request) {
  const header = req.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export function createClerkAuthVerifier(): AuthVerifier {
  return {
    async verify(token) {
      if (!env.clerkSecretKey) {
        return null;
      }

      try {
        const verified = await verifyToken(token, {
          secretKey: env.clerkSecretKey,
          authorizedParties: [env.corsOrigin],
          audience: "mangaflow-api"
        });

        const clerkId = verified.sub;
        const systemRole = (verified as any).systemRole ?? null;
        const status = (verified as any).status ?? "ACTIVE";

        return {
          clerkId,
          systemRole,
          status
        };
      } catch (error) {
        console.warn("Clerk JWT verification failed");
        return null;
      }
    },

    async verifyWithProfile(token) {
      if (!env.clerkSecretKey) {
        return null;
      }

      try {
        const { createClerkClient } = await import("@clerk/backend");

        const verified = await verifyToken(token, {
          secretKey: env.clerkSecretKey,
          authorizedParties: [env.corsOrigin],
          audience: "mangaflow-api"
        });
        const clerkId = verified.sub;

        const clerkClient = createClerkClient({
          secretKey: env.clerkSecretKey
        });
        const user = await clerkClient.users.getUser(clerkId);
        const primaryEmail =
          user.emailAddresses.find(
            (email) => email.id === user.primaryEmailAddressId
          ) ?? user.emailAddresses[0];

        if (!primaryEmail?.emailAddress) {
          return null;
        }

        return {
          clerkId,
          email: primaryEmail.emailAddress,
          fullName:
            user.fullName ??
            [user.firstName, user.lastName].filter(Boolean).join(" ") ??
            primaryEmail.emailAddress,
          avatarUrl: user.imageUrl ?? null
        };
      } catch (error) {
        console.warn("Clerk token verification with profile failed");
        return null;
      }
    }
  };
}

export function requireAuth(authVerifier: AuthVerifier) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const token = getBearerToken(req);

    if (!token) {
      res
        .status(401)
        .json(fail("Authentication required", "AUTH_REQUIRED"));
      return;
    }

    const payload = await authVerifier.verify(token);
    if (!payload) {
      res.status(401).json(fail("Invalid authentication token", "AUTH_INVALID"));
      return;
    }

    req.auth = payload;
    next();
  };
}
