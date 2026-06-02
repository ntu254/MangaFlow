import { createClerkClient, verifyToken } from "@clerk/backend";
import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env.config.js";
import { fail } from "../../shared/responses/api-response.js";
import type { ClerkUserProfile } from "./auth.service.js";

export type AuthVerifier = {
  verify(token: string): Promise<ClerkUserProfile | null>;
};

export type AuthenticatedRequest = Request & {
  auth?: ClerkUserProfile;
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
          authorizedParties: [env.corsOrigin]
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
        console.warn("Clerk token verification failed");
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

    const profile = await authVerifier.verify(token);
    if (!profile) {
      res.status(401).json(fail("Invalid authentication token", "AUTH_INVALID"));
      return;
    }

    req.auth = profile;
    next();
  };
}

