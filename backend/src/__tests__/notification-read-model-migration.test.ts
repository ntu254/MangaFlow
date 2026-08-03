import {
  planNotificationReadModelMigration,
} from "../services/notification-read-model-migration.service.js";
import { summarizeNotificationReadModelMigration } from "../scripts/migrate-notification-read-model.js";

describe("Notification read-model migration", () => {
  it("removes notifications that were explicitly archived by users", () => {
    expect(planNotificationReadModelMigration({ id: "n-archived", archivedAt: "2026-08-01" })).toEqual({
      action: "REMOVE_LEGACY_ARCHIVED",
    });
  });

  it("cleans a legacy field without deleting the notification", () => {
    expect(planNotificationReadModelMigration({ id: "n-null", archivedAt: null })).toEqual({
      action: "CLEAN_LEGACY_FIELD",
    });
    expect(planNotificationReadModelMigration({ id: "n-current" })).toEqual({ action: "SKIP" });
  });

  it("summarizes legacy records deterministically", () => {
    expect(
      summarizeNotificationReadModelMigration([
        { id: "n-archived", archivedAt: "2026-08-01" },
        { id: "n-null", archivedAt: null },
        { id: "n-current" },
      ]),
    ).toEqual({ removeIds: ["n-archived"], cleanIds: ["n-null"] });
  });
});
