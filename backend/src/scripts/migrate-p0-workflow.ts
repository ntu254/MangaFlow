import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import {
  EarningModel,
  BoardDecisionModel,
  ChapterModel,
  ProposalVoteModel,
  SeriesModel,
  StudioTaskModel,
  SubmissionModel,
  VotingSessionModel,
} from "../db/models.js";

type ReportRow = {
  type: string;
  id: string;
  reason: string;
  details?: Record<string, unknown>;
};

type PlannedUpdate = {
  model: "task" | "submission" | "chapter";
  id: string;
  patch: Record<string, unknown>;
  unset?: Record<string, "">;
};

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const createIndexes = args.has("--create-indexes");
const dryRun = !apply && !createIndexes;
const reportPath = readArg("--report") ?? "p0-workflow-migration-report.json";
const backupDir = readArg("--backup-dir") ?? "p0-workflow-migration-backup";
const mongoUri =
  process.env.MONGODB_URI ?? process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/mangaflow";

function readArg(name: string) {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function hasMangakaApproval(submission: any) {
  return Boolean(
    submission.status === "MANGAKA_APPROVED" ||
      submission.mangakaDecision === "APPROVE" ||
      submission.mangakaReviewedAt ||
      submission.mangakaReviewedById,
  );
}

function currentSubmissionForTask(task: any, submissionsByTask: Map<string, any[]>) {
  if (task.currentSubmissionId) {
    return (submissionsByTask.get(task.id) ?? []).find((submission) => submission.id === task.currentSubmissionId);
  }

  const candidates = (submissionsByTask.get(task.id) ?? []).filter(
    (submission) => submission.status !== "SUPERSEDED",
  );
  if (candidates.length === 1) return candidates[0];

  const sortedWithVersion = candidates
    .filter((submission) => submission.submissionVersion != null || submission.version != null)
    .sort(
      (left, right) =>
        Number(right.submissionVersion ?? right.version ?? 0) -
        Number(left.submissionVersion ?? left.version ?? 0),
    );
  if (
    sortedWithVersion.length > 0 &&
    Number(sortedWithVersion[0].submissionVersion ?? sortedWithVersion[0].version ?? 0) >
      Number(sortedWithVersion[1]?.submissionVersion ?? sortedWithVersion[1]?.version ?? -1)
  ) {
    return sortedWithVersion[0];
  }

  return null;
}

function canonicalTaskStatus(task: any, submissionsByTask: Map<string, any[]>, unmapped: ReportRow[]) {
  const status = String(task.status);
  if (["TODO", "IN_PROGRESS", "SUBMITTED", "MANGAKA_APPROVED", "REJECTED", "CANCELLED"].includes(status)) {
    return status;
  }
  if (status === "MANGAKA_REVISION_REQUESTED") return "REVISION_REQUESTED";
  if (status === "REVISION_REQUESTED") return "REVISION_REQUESTED";
  if (status === "EDITOR_REVIEWING" || status === "EDITOR_APPROVED") {
    const current = currentSubmissionForTask(task, submissionsByTask);
    if (
      current &&
      current.taskId === task.id &&
      current.status !== "SUPERSEDED" &&
      hasMangakaApproval(current)
    ) {
      return "MANGAKA_APPROVED";
    }
    unmapped.push({
      type: "task",
      id: task.id,
      reason: "EDITOR_STATUS_REQUIRES_MANUAL_PROOF",
      details: { status, currentSubmissionId: task.currentSubmissionId },
    });
    return null;
  }
  if (status === "EDITOR_REVISION_REQUESTED") {
    unmapped.push({
      type: "task",
      id: task.id,
      reason: "EDITOR_REVISION_NOT_AUTO_MAPPED",
      details: { status },
    });
    return null;
  }
  unmapped.push({ type: "task", id: task.id, reason: "TASK_STATUS_UNMAPPED", details: { status } });
  return null;
}

function canonicalSubmissionStatus(submission: any, unmapped: ReportRow[]) {
  const status = String(submission.status);
  if (["PENDING", "MANGAKA_APPROVED", "REVISION_REQUESTED", "SUPERSEDED", "REJECTED"].includes(status)) {
    return status;
  }
  if (status === "SUBMITTED") return "PENDING";
  if (status === "MANGAKA_REVISION_REQUESTED") return "REVISION_REQUESTED";
  if (status === "EDITOR_APPROVED") {
    if (hasMangakaApproval(submission)) return "MANGAKA_APPROVED";
    unmapped.push({
      type: "submission",
      id: submission.id,
      reason: "EDITOR_APPROVED_REQUIRES_MANGAKA_PROOF",
      details: { taskId: submission.taskId },
    });
    return null;
  }
  if (status === "EDITOR_REVISION_REQUESTED") {
    unmapped.push({
      type: "submission",
      id: submission.id,
      reason: "EDITOR_REVISION_HISTORICAL_REVIEW_REQUIRED",
      details: { taskId: submission.taskId },
    });
    return null;
  }
  unmapped.push({
    type: "submission",
    id: submission.id,
    reason: "SUBMISSION_STATUS_UNMAPPED",
    details: { status },
  });
  return null;
}

function canonicalChapterStatus(chapter: any) {
  const status = String(chapter.status);
  const map: Record<string, string> = {
    PLANNED: "PLANNED",
    DRAFTING: "IN_PRODUCTION",
    ASSISTANT_WORKING: "IN_PRODUCTION",
    IN_PRODUCTION: "IN_PRODUCTION",
    MANGAKA_REVIEW: "IN_PRODUCTION",
    EDITOR_REVIEW: "TANTOU_REVIEW",
    TANTOU_REVIEW: "TANTOU_REVIEW",
    REVISION: "REVISION_REQUIRED",
    REVISION_REQUIRED: "REVISION_REQUIRED",
    EDITOR_APPROVED: "READY_FOR_PUBLICATION",
    READY_FOR_PUBLICATION: "READY_FOR_PUBLICATION",
    SCHEDULED: "READY_FOR_PUBLICATION",
    PUBLISHED: "PUBLISHED",
  };
  if (status === "ARCHIVED") {
    if (chapter.publishedAt) return "PUBLISHED";
    if (
      chapter.readyForPublicationAt ||
      chapter.readyByEditorId ||
      chapter.scheduledAt ||
      (Array.isArray(chapter.pages) &&
        chapter.pages.length > 0 &&
        chapter.pages.every((page: any) => page.status === "FINALIZED"))
    ) {
      return "READY_FOR_PUBLICATION";
    }
    return Array.isArray(chapter.pages) && chapter.pages.length > 0
      ? "IN_PRODUCTION"
      : "PLANNED";
  }
  return map[status] ?? null;
}

function groupDuplicates<T>(rows: T[], keyOf: (row: T) => string) {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.entries()]
    .filter(([, values]) => values.length > 1)
    .map(([key, values]) => ({ key, count: values.length, ids: values.map((value: any) => value.id) }));
}

async function writeBackup(updates: PlannedUpdate[], stamp: string) {
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `p0-workflow-backup-${stamp}.jsonl`);
  const stream = fs.createWriteStream(backupPath, { encoding: "utf8" });
  for (const update of updates) {
    const model = update.model === "task" ? StudioTaskModel : update.model === "submission" ? SubmissionModel : ChapterModel;
    const before = await model.findOne({ id: update.id }).lean();
    stream.write(JSON.stringify({ model: update.model, id: update.id, before }) + "\n");
  }
  await new Promise<void>((resolve, reject) => {
    stream.end(resolve);
    stream.on("error", reject);
  });
  return backupPath;
}

async function validateInvariants(unmapped: ReportRow[]) {
  const invalid: ReportRow[] = [];
  const tasks = await StudioTaskModel.find({}).lean();
  const submissions = await SubmissionModel.find({}).lean();
  const submissionsById = new Map((submissions as any[]).map((submission) => [submission.id, submission]));

  for (const task of tasks as any[]) {
    if (task.currentSubmissionId) {
      const submission = submissionsById.get(task.currentSubmissionId);
      if (!submission) {
        invalid.push({ type: "task", id: task.id, reason: "CURRENT_SUBMISSION_MISSING" });
      } else if ((submission as any).taskId !== task.id) {
        invalid.push({
          type: "task",
          id: task.id,
          reason: "CURRENT_SUBMISSION_TASK_MISMATCH",
          details: { currentSubmissionId: task.currentSubmissionId, submissionTaskId: (submission as any).taskId },
        });
      } else if ((submission as any).status === "SUPERSEDED") {
        invalid.push({
          type: "task",
          id: task.id,
          reason: "CURRENT_SUBMISSION_SUPERSEDED",
          details: { currentSubmissionId: task.currentSubmissionId },
        });
      }
    }
  }

  return [...unmapped, ...invalid];
}

async function duplicateReport() {
  const activeStatuses = ["OPEN"];
  const [sessions, series, votes, decisions, earnings] = await Promise.all([
    VotingSessionModel.find({ targetType: "PROPOSAL", status: { $in: activeStatuses } }).lean(),
    SeriesModel.find({ sourceProposalId: { $exists: true, $ne: null } }).lean(),
    ProposalVoteModel.find({ sessionId: { $exists: true, $ne: null } }).lean(),
    BoardDecisionModel.find({}).lean(),
    EarningModel.find({ sourceKey: { $exists: true, $ne: null } }).lean(),
  ]);
  return {
    activeVotingSessionByProposal: groupDuplicates(sessions as any[], (row) => `${row.targetType}:${row.proposalId}`),
    seriesBySourceProposalId: groupDuplicates(series as any[], (row) => String(row.sourceProposalId ?? "")),
    voteByMemberSession: groupDuplicates(
      votes as any[],
      (row) => `${row.sessionId}:${row.proposalId}:${row.voterId}`,
    ),
    boardDecisionByVotingSession: groupDuplicates(decisions as any[], (row) => String(row.votingSessionId ?? "")),
    earningBySourceKey: groupDuplicates(earnings as any[], (row) => String(row.sourceKey ?? "")),
  };
}

async function createUniqueIndexesIfClean(report: any) {
  const duplicateKinds = Object.entries(report.duplicates).filter(([, rows]) => Array.isArray(rows) && rows.length > 0);
  if (duplicateKinds.length > 0 || report.invariants.length > 0) {
    throw new Error("Refusing to create unique indexes while duplicates or invariants exist.");
  }
  await Promise.all([
    VotingSessionModel.collection.createIndex(
      { targetType: 1, proposalId: 1 },
      {
        name: "p0_one_active_voting_session_per_proposal",
        unique: true,
        partialFilterExpression: {
          targetType: "PROPOSAL",
          proposalId: { $type: "string" },
          status: { $in: ["OPEN"] },
        },
      },
    ),
    SeriesModel.collection.createIndex(
      { sourceProposalId: 1 },
      {
        name: "p0_one_series_per_source_proposal",
        unique: true,
        partialFilterExpression: { sourceProposalId: { $type: "string" } },
      },
    ),
    ProposalVoteModel.collection.createIndex(
      { sessionId: 1, proposalId: 1, voterId: 1 },
      {
        name: "p0_one_vote_per_member_session",
        unique: true,
        partialFilterExpression: { sessionId: { $type: "string" } },
      },
    ),
    BoardDecisionModel.collection.createIndex(
      { votingSessionId: 1 },
      { name: "p0_one_board_decision_per_session", unique: true },
    ),
    EarningModel.collection.createIndex(
      { sourceKey: 1 },
      {
        name: "p0_unique_earning_source_key",
        unique: true,
        partialFilterExpression: { sourceKey: { $type: "string" } },
      },
    ),
  ]);
}

async function main() {
  await mongoose.connect(mongoUri);
  const stamp = nowStamp();
  const unmapped: ReportRow[] = [];
  const updates: PlannedUpdate[] = [];

  const [tasks, submissions, chapters] = await Promise.all([
    StudioTaskModel.find({}).lean(),
    SubmissionModel.find({}).sort({ submittedAt: 1, createdAt: 1 }).lean(),
    ChapterModel.find({}).lean(),
  ]);

  const submissionsByTask = new Map<string, any[]>();
  for (const submission of submissions as any[]) {
    if (!submission.taskId) continue;
    submissionsByTask.set(submission.taskId, [...(submissionsByTask.get(submission.taskId) ?? []), submission]);
  }

  for (const task of tasks as any[]) {
    const patch: Record<string, unknown> = {};
    if (task.isRequired === undefined) patch.isRequired = true;

    const nextStatus = canonicalTaskStatus(task, submissionsByTask, unmapped);
    if (nextStatus && nextStatus !== task.status) patch.status = nextStatus;

    if (!task.currentSubmissionId) {
      const candidates = (submissionsByTask.get(task.id) ?? []).filter(
        (submission) => submission.status !== "SUPERSEDED",
      );
      const current = currentSubmissionForTask(task, submissionsByTask);
      if (current) {
        patch.currentSubmissionId = current.id;
      } else if (candidates.length > 0) {
        unmapped.push({
          type: "task",
          id: task.id,
          reason: "CURRENT_SUBMISSION_AMBIGUOUS",
          details: { candidateIds: candidates.map((submission) => submission.id) },
        });
      }
    }

    if (Object.keys(patch).length > 0) updates.push({ model: "task", id: task.id, patch });
  }

  for (const submission of submissions as any[]) {
    const patch: Record<string, unknown> = {};
    const nextStatus = canonicalSubmissionStatus(submission, unmapped);
    if (nextStatus && nextStatus !== submission.status) patch.status = nextStatus;
    if (!submission.submissionVersion) patch.submissionVersion = submission.version ?? 1;
    if (!submission.idempotencyKey && submission.taskId) {
      patch.idempotencyKey = `migration:${submission.taskId}:${submission.id}`;
    }
    if (Object.keys(patch).length > 0) updates.push({ model: "submission", id: submission.id, patch });
  }

  for (const chapter of chapters as any[]) {
    const nextStatus = canonicalChapterStatus(chapter);
    if (nextStatus && nextStatus !== chapter.status) {
      updates.push({
        model: "chapter",
        id: chapter.id,
        patch: { status: nextStatus },
        unset:
          chapter.status === "ARCHIVED"
            ? { archivedAt: "", archivedById: "", archiveReason: "" }
            : undefined,
      });
    } else if (!nextStatus) {
      unmapped.push({
        type: "chapter",
        id: chapter.id,
        reason: "CHAPTER_STATUS_UNMAPPED",
        details: { status: chapter.status },
      });
    }
  }

  const duplicates = await duplicateReport();
  const invariants = await validateInvariants(unmapped);
  const report = {
    mode: createIndexes ? "create-indexes" : apply ? "apply" : "dry-run",
    dryRun,
    generatedAt: new Date().toISOString(),
    counts: {
      tasks: tasks.length,
      submissions: submissions.length,
      chapters: chapters.length,
      plannedUpdates: updates.length,
      unmapped: unmapped.length,
      invariants: invariants.length,
    },
    duplicates,
    invariants,
    unmapped,
    plannedUpdates: dryRun ? updates.slice(0, 250) : undefined,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  if (createIndexes) {
    await createUniqueIndexesIfClean(report);
    await mongoose.disconnect();
    return;
  }

  if (apply) {
    if (invariants.length > 0) {
      throw new Error("Refusing to apply migration while unmapped records or invariant violations exist.");
    }
    const backupPath = await writeBackup(updates, stamp);
    for (const update of updates) {
      if (update.model === "task") await StudioTaskModel.updateOne({ id: update.id }, { $set: update.patch });
      if (update.model === "submission") await SubmissionModel.updateOne({ id: update.id }, { $set: update.patch });
      if (update.model === "chapter") {
        await ChapterModel.updateOne(
          { id: update.id },
          update.unset
            ? { $set: update.patch, $unset: update.unset }
            : { $set: update.patch },
        );
      }
    }
    console.log(JSON.stringify({ applied: updates.length, backupPath }, null, 2));
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
