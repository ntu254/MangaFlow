import { ChapterModel, StudioTaskModel, UserModel } from "../db/models.js";
import { nowIso } from "../domain/ids.js";

export const PAGE_TASK_TERMINAL_STATUSES = ["REJECTED", "CANCELLED", "MANGAKA_APPROVED"];

export type PageAssignmentMigrationRecord = {
  pageId: string;
  assignees: Array<{ assistantId: string; assistantName?: string; createdAt: Date }>;
};

export type PageAssignmentMigrationPlan = {
  action: "ASSIGN" | "SKIP" | "CONFLICT";
  pageId: string;
  assistantId?: string;
  assistantName?: string;
  status?: "ACCEPTED";
  assignedAt?: Date;
  conflict?: string[];
};

/** Build one migration plan per page with legacy active tasks. */
export function planPageAssignmentMigration(
  record: PageAssignmentMigrationRecord,
): PageAssignmentMigrationPlan {
  if (record.assignees.length === 0) {
    return { action: "SKIP", pageId: record.pageId };
  }
  const distinctIds = [...new Set(record.assignees.map((assignee) => assignee.assistantId))];
  if (distinctIds.length > 1) {
    return {
      action: "CONFLICT",
      pageId: record.pageId,
      conflict: distinctIds,
    };
  }
  const assignee = record.assignees[0];
  return {
    action: "ASSIGN",
    pageId: record.pageId,
    assistantId: assignee.assistantId,
    assistantName: assignee.assistantName,
    status: "ACCEPTED",
    assignedAt: assignee.createdAt,
  };
}

/**
 * Read all legacy tasks flagged with pageTaskActive and group them by page.
 * Terminal tasks are excluded because they no longer represent an active
 * assistant relationship.
 */
export async function collectPageAssignmentMigrationRecords() {
  const tasks = (await (StudioTaskModel as any)
    .find({
      pageTaskActive: true,
      pageId: { $exists: true, $nin: [null, ""] },
      status: { $nin: PAGE_TASK_TERMINAL_STATUSES },
    })
    .select({ id: 1, pageId: 1, assigneeId: 1, assigneeName: 1, createdAt: 1 })
    .lean()) as Array<{
    pageId: string;
    assigneeId?: string;
    assigneeName?: string;
    createdAt?: Date;
  }>;

  const byPage = new Map<string, PageAssignmentMigrationRecord["assignees"]>();
  for (const task of tasks) {
    const pageId = String(task.pageId);
    if (!task.assigneeId) continue;
    const assignees = byPage.get(pageId) ?? [];
    if (!assignees.some((assignee) => assignee.assistantId === task.assigneeId)) {
      assignees.push({
        assistantId: String(task.assigneeId),
        assistantName: task.assigneeName,
        createdAt: task.createdAt ?? new Date(),
      });
    }
    byPage.set(pageId, assignees);
  }

  const records: PageAssignmentMigrationRecord[] = [];
  for (const [pageId, assignees] of byPage) {
    records.push({ pageId, assignees });
  }
  return records;
}

/** Persist the planned page assignments (idempotent; skips pages already assigned). */
export async function applyPageAssignmentMigration(plans: PageAssignmentMigrationPlan[]) {
  let assigned = 0;
  let skipped = 0;
  const conflicts: PageAssignmentMigrationPlan[] = [];
  for (const plan of plans) {
    if (plan.action === "CONFLICT") {
      conflicts.push(plan);
      continue;
    }
    if (plan.action !== "ASSIGN" || !plan.assistantId) {
      skipped += 1;
      continue;
    }
    const user = await UserModel.findOne({ id: plan.assistantId }).lean();
    const assistantName = plan.assistantName ?? (user as any)?.name ?? plan.assistantId;
    const updated = await ChapterModel.updateOne(
      { "pages.id": plan.pageId, "pages.pageAssignment": { $exists: false } },
      {
        $set: {
          "pages.$.pageAssignment": {
            assistantId: plan.assistantId,
            assistantName,
            status: "ACCEPTED",
            assignedAt: plan.assignedAt ?? nowIso(),
            acceptedAt: nowIso(),
          },
          updatedAt: nowIso(),
        },
      },
    );
    if (updated.matchedCount > 0) {
      assigned += 1;
    } else {
      skipped += 1;
    }
  }
  return { assigned, skipped, conflicts };
}

/** Drop the legacy one-active-task-per-page unique index, if present. */
export async function dropLegacyPageTaskUniqueIndex() {
  const collection = StudioTaskModel.collection;
  const indexes = await collection.indexes();
  const legacy = indexes.find(
    (index) => index.name === "studio_task_one_active_page_assignment",
  );
  if (!legacy?.name) return false;
  await collection.dropIndex(legacy.name);
  return true;
}
