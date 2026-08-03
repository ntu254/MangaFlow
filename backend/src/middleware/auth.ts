import type { NextFunction, Response } from "express";
import { userForAccessToken } from "../services/auth.service.js";
import { AppError } from "../lib/http.js";
import type { AuthedRequest, Role } from "../types.js";

export async function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    if (!token) throw new AppError(401, "Missing bearer token.", "MISSING_AUTH");
    req.actor = await userForAccessToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.actor) return next(new AppError(401, "Missing authenticated user.", "MISSING_AUTH"));
    if (roles.includes(req.actor.role)) return next();
    return next(new AppError(403, "You do not have permission for this action.", "FORBIDDEN"));
  };
}

// requireExactRole / requireExactBoardChair are intentional aliases of the base
// guards, kept as distinct exported names only so existing route call sites do
// not churn. They enforce identical rules — there is no stricter "exact" check.
export const requireExactRole = requireRole;

export function requireBoardChair(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (!req.actor) return next(new AppError(401, "Missing authenticated user.", "MISSING_AUTH"));
  if (req.actor.role === "BOARD" && req.actor.isChair) return next();
  return next(new AppError(403, "Board chair permission is required.", "BOARD_CHAIR_REQUIRED"));
}

export const requireExactBoardChair = requireBoardChair;
