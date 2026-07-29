export const MATERIAL_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "IN_REVIEW",
  "APPROVED",
  "ARCHIVED",
] as const;

export type MaterialStatus = (typeof MATERIAL_STATUSES)[number];

const MATERIAL_TRANSITIONS: Record<MaterialStatus, ReadonlySet<MaterialStatus>> = {
  DRAFT: new Set(["DRAFT", "ACTIVE", "ARCHIVED"]),
  ACTIVE: new Set(["ACTIVE", "IN_REVIEW", "APPROVED", "ARCHIVED"]),
  IN_REVIEW: new Set(["IN_REVIEW", "ACTIVE", "APPROVED", "ARCHIVED"]),
  APPROVED: new Set(["APPROVED", "ARCHIVED"]),
  ARCHIVED: new Set(["ARCHIVED"]),
};

export function isMaterialStatus(value: unknown): value is MaterialStatus {
  return typeof value === "string" && (MATERIAL_STATUSES as readonly string[]).includes(value);
}

export function isMaterialTransitionAllowed(from: MaterialStatus, to: MaterialStatus) {
  return MATERIAL_TRANSITIONS[from].has(to);
}

export type MaterialStatusMigrationPlan =
  | { action: "SKIP"; reason: "NO_LEGACY_STATUS" | "TOP_LEVEL_STATUS_CANONICAL" }
  | { action: "MIGRATE"; status: MaterialStatus }
  | { action: "INVALID"; source: "TOP_LEVEL" | "METADATA"; value: unknown };

/**
 * Plans the safe, idempotent migration of legacy metadata.status.
 *
 * A DRAFT top-level value can be the Mongoose default from the old contract,
 * so a different valid metadata status is treated as the legacy source of
 * truth. Any other canonical top-level value wins and is left untouched.
 */
export function planMaterialStatusMigration(record: {
  id?: string;
  status?: unknown;
  metadata?: unknown;
}): MaterialStatusMigrationPlan {
  const hasTopLevelStatus =
    Object.prototype.hasOwnProperty.call(record, "status") && record.status !== undefined;
  const metadata =
    record.metadata && typeof record.metadata === "object"
      ? (record.metadata as Record<string, unknown>)
      : undefined;
  const legacyStatus = metadata?.status;

  if (hasTopLevelStatus && !isMaterialStatus(record.status)) {
    return { action: "INVALID", source: "TOP_LEVEL", value: record.status };
  }

  if (legacyStatus === undefined) {
    return hasTopLevelStatus
      ? { action: "SKIP", reason: "TOP_LEVEL_STATUS_CANONICAL" }
      : { action: "SKIP", reason: "NO_LEGACY_STATUS" };
  }

  if (!isMaterialStatus(legacyStatus)) {
    return { action: "INVALID", source: "METADATA", value: legacyStatus };
  }

  if (!hasTopLevelStatus || (record.status === "DRAFT" && legacyStatus !== "DRAFT")) {
    return { action: "MIGRATE", status: legacyStatus };
  }

  return { action: "SKIP", reason: "TOP_LEVEL_STATUS_CANONICAL" };
}

export function assertMaterialStatus(value: unknown): MaterialStatus {
  if (isMaterialStatus(value)) return value;
  throw new Error("Material status must be DRAFT, ACTIVE, IN_REVIEW, APPROVED, or ARCHIVED.");
}
