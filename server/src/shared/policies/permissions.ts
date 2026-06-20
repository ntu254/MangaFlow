import type { Request, Response, NextFunction } from "express"
import type { UserRole } from "../../modules/auth/auth.types.js"

/**
 * Central permission registry. Matches Flow-00 §11 + Flow-11 + Flow-12 permission matrices.
 *
 * Adding a new permission: add the literal here, add its role list to MATRIX, then call
 * `requirePermission("NAME")` on the route. Service-layer entity scope still applies on top
 * (e.g. requireSeriesRole for series-scoped writes).
 */
export type Permission =
  // Admin / configuration
  | "ADMIN_CONFIG_MANAGE"

  // Comment workflow (Flow-12)
  | "COMMENT_CREATE"
  | "COMMENT_LIST"
  | "COMMENT_MARK_FIXED"
  | "COMMENT_VERIFY_FIX"
  | "COMMENT_RESOLVE"
  | "COMMENT_REOPEN"

  // Earning workflow (Flow-11)
  | "EARNING_CALCULATE"
  | "EARNING_CONFIRM"
  | "EARNING_MARK_PAID"
  | "EARNING_LIST"

const MATRIX: Record<Permission, UserRole[]> = {
  // Only Admin can manage system-wide config like TaskTypes.
  ADMIN_CONFIG_MANAGE: ["ADMIN"],

  // Comments are a production-team conversation. Board is not part of production.
  COMMENT_CREATE: ["MANGAKA", "EDITOR", "ASSISTANT"],
  COMMENT_LIST: ["MANGAKA", "EDITOR", "ASSISTANT"],
  // Flow-06: Assistant marks fixed after addressing feedback.
  COMMENT_MARK_FIXED: ["ASSISTANT"],
  // Flow-06: Mangaka verifies the fix during review.
  COMMENT_VERIFY_FIX: ["MANGAKA"],
  // Flow-07: Editor resolves at final review.
  COMMENT_RESOLVE: ["EDITOR"],
  // Flow-07/06: Editor or Mangaka can reopen a previously resolved comment.
  COMMENT_REOPEN: ["EDITOR", "MANGAKA"],

  // Flow-11: Assistants must never trigger their own earning calculation.
  EARNING_CALCULATE: ["ADMIN", "MANGAKA", "EDITOR"],
  // MVP: confirm is Admin only.
  EARNING_CONFIRM: ["ADMIN"],
  // Mark-paid is a hard money action — Admin only.
  EARNING_MARK_PAID: ["ADMIN"],
  // List endpoint itself is open to all roles; service-layer filters per actor.
  EARNING_LIST: ["ADMIN", "MANGAKA", "EDITOR", "ASSISTANT"],
}

export function can(role: UserRole, perm: Permission): boolean {
  return MATRIX[perm].includes(role)
}

/**
 * Express middleware: 401 if unauthenticated, 403 if role lacks the permission.
 * Stack after `requireAuth`. Service-layer entity guards (series ownership, assignment,
 * etc.) must still run on top — this only enforces global role × action.
 */
export function requirePermission(perm: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" })
      return
    }
    if (!can(req.user.role, perm)) {
      res.status(403).json({ success: false, message: "Forbidden" })
      return
    }
    next()
  }
}

/** Exported for tests so the matrix itself can be asserted against Flow specs. */
export const __PERMISSION_MATRIX = MATRIX
