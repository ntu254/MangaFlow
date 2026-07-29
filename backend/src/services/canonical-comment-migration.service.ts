export type CanonicalCommentMigrationRecord = {
  id?: string;
  blocking?: unknown;
  isBlocking?: unknown;
  status?: unknown;
};

export type CanonicalCommentMigrationPlan = {
  action: "MIGRATE" | "SKIP";
  set: Record<string, unknown>;
  unset: Record<string, "">;
};

/**
 * Plan the legacy StudioComment field/status migration without touching a DB.
 * Keeping this pure makes dry-run behavior testable and guarantees reruns are
 * no-ops after the legacy fields are removed.
 */
export function planCanonicalCommentMigration(
  record: CanonicalCommentMigrationRecord,
): CanonicalCommentMigrationPlan {
  const set: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};

  if (Object.prototype.hasOwnProperty.call(record, "blocking")) {
    if (record.blocking === true) set.isBlocking = true;
    unset.blocking = "";
  }

  if (record.status === "FIXED") set.status = "ADDRESSED";

  return {
    action: Object.keys(set).length > 0 || Object.keys(unset).length > 0 ? "MIGRATE" : "SKIP",
    set,
    unset,
  };
}
