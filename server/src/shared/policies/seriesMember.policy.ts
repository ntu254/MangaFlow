import { SeriesMember } from "../../modules/series/series.model.js"
import type { SeriesMemberRole, SeriesMemberDocument } from "../../modules/series/series.model.js"

/**
 * Flow-03 migration helper.
 *
 * Source of truth for "is this SeriesMember currently active and able to act on the series?".
 * During migration, both the new `status` enum (INVITED|ACTIVE|PAUSED|REMOVED) and the legacy
 * `isActive` boolean may exist on a member document. After all docs are migrated, the legacy
 * fallback can be deleted from a single place (this file) instead of from every policy.
 *
 * Use `findActiveSeriesMember` for "must be active" checks at API entry, and `isActiveMember`
 * for already-loaded member docs in service-layer code.
 */

type MemberShape = Pick<SeriesMemberDocument, "status" | "isActive"> | null | undefined

/**
 * Query fragment that matches active members, regardless of which migration step the
 * document is at. Composed into `findOne(...)` / `find(...)` calls.
 */
export const ACTIVE_MEMBER_QUERY: {
  $or: Array<Record<string, unknown>>
} = {
  $or: [
    { status: "ACTIVE" },
    { status: { $exists: false }, isActive: true },
  ],
}

/**
 * True if the (already-loaded) member document is currently active.
 * Prefers the new `status` enum; falls back to `isActive` only when status is unset.
 */
export function isActiveMember(member: MemberShape): boolean {
  if (!member) return false
  if (member.status !== undefined && member.status !== null) {
    return member.status === "ACTIVE"
  }
  return member.isActive === true
}

/**
 * Find a member of `seriesId` for `userId` that is currently active.
 * Returns null when the user is not a member, or the membership is not active.
 */
export async function findActiveSeriesMember(seriesId: string, userId: string) {
  return SeriesMember.findOne({ seriesId, userId, ...ACTIVE_MEMBER_QUERY }).lean()
}

/**
 * Same as above but constrains by allowed series roles. Useful for guards that need to know
 * "user is an active MANGAKA or EDITOR of this series".
 */
export async function findActiveSeriesMemberWithRole(
  seriesId: string,
  userId: string,
  allowedRoles: SeriesMemberRole[],
) {
  return SeriesMember.findOne({
    seriesId,
    userId,
    role: { $in: allowedRoles },
    ...ACTIVE_MEMBER_QUERY,
  }).lean()
}
