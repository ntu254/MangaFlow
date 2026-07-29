export type RegionLockMigrationRecord = {
  lockStatus?: unknown;
};

export type RegionLockMigrationPlan = {
  action: "MIGRATE" | "SKIP";
  set: { lockStatus?: "UNLOCKED" };
};

/** Plan the legacy RELEASED -> UNLOCKED conversion without touching a DB. */
export function planRegionLockMigration(
  record: RegionLockMigrationRecord,
): RegionLockMigrationPlan {
  return record.lockStatus === "RELEASED"
    ? { action: "MIGRATE", set: { lockStatus: "UNLOCKED" } }
    : { action: "SKIP", set: {} };
}
