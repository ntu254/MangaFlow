export type LegacyNotificationRecord = {
  id: string;
  archivedAt?: unknown;
};

export type NotificationReadModelMigrationPlan =
  | { action: "REMOVE_LEGACY_ARCHIVED" }
  | { action: "CLEAN_LEGACY_FIELD" }
  | { action: "SKIP" };

export function planNotificationReadModelMigration(
  record: LegacyNotificationRecord,
): NotificationReadModelMigrationPlan {
  if (!Object.prototype.hasOwnProperty.call(record, "archivedAt")) {
    return { action: "SKIP" };
  }
  return record.archivedAt ? { action: "REMOVE_LEGACY_ARCHIVED" } : { action: "CLEAN_LEGACY_FIELD" };
}
