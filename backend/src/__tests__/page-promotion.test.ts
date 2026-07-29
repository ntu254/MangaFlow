import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import { AuditEntryModel, ChapterModel, StudioTaskModel } from "../db/models.js";

let mongo: MongoMemoryReplSet;

const CHAPTER_ID = "ch-s-berserk-prod-4";
const PAGE_ID = "ch-s-berserk-prod-4-p1";
const OTHER_PAGE_ID = "ch-s-berserk-prod-4-p2";
const ORIGINAL_KEY = "chapters/ch-s-berserk-prod-4/pages/original.png";

async function loginAs(email: string) {
  const res = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password: email })
    .expect(200);
  return res.body.data as { accessToken: string };
}

async function seedTask(overrides: Record<string, unknown> = {}) {
  const taskId = String(overrides.id ?? `tsk-promo-${Math.random().toString(16).slice(2, 10)}`);
  await StudioTaskModel.create({
    title: "Promotion test task",
    seriesId: "s-berserk-prod",
    chapterId: CHAPTER_ID,
    pageId: PAGE_ID,
    status: "IN_PROGRESS",
    assigneeId: "u-assist",
    assigneeName: "Suzuki Jun",
    type: "character",
    priority: "normal",
    createdAt: new Date().toISOString(),
    ...overrides,
    id: taskId,
  });
  return taskId;
}

/** Give the page a real asset so promotion has something to archive. */
async function givePageAnAsset(pageId = PAGE_ID, fileKey = ORIGINAL_KEY) {
  await ChapterModel.updateOne(
    { id: CHAPTER_ID, "pages.id": pageId },
    {
      $set: {
        "pages.$.fileKey": fileKey,
        "pages.$.fileUrl": `https://cdn.example/${fileKey}`,
        "pages.$.imageUrl": `https://cdn.example/${fileKey}`,
        "pages.$.imageWidth": 1000,
        "pages.$.imageHeight": 1400,
        "pages.$.mimeType": "image/png",
        "pages.$.status": "IN_PRODUCTION",
        "pages.$.metadata": {
          uploadedById: "u-mangaka",
          uploadedByName: "Inoue Takehiko",
          aiWhitened: { fileKey: `ai/pages/${pageId}/whitened.png`, fileUrl: "https://cdn/w.png" },
        },
      },
    },
  );
}

async function readPage(pageId = PAGE_ID, chapterId = CHAPTER_ID) {
  const chapter = (await ChapterModel.findOne({ id: chapterId }).lean()) as any;
  return ((chapter?.pages ?? []) as any[]).find((page) => page.id === pageId);
}

function submitTask(
  accessToken: string,
  taskId: string,
  idempotencyKey: string,
  body: Record<string, unknown> = {},
) {
  return request(createApp())
    .post(`/api/tasks/${taskId}/submit`)
    .set("Authorization", `Bearer ${accessToken}`)
    .set("Idempotency-Key", idempotencyKey)
    .send({
      expectedCurrentSubmissionId: null,
      notes: "Revised page render",
      fileKey: `submissions/${idempotencyKey}.png`,
      fileName: "revised.png",
      fileUrl: `https://cdn.example/submissions/${idempotencyKey}.png`,
      mimeType: "image/png",
      fileSizeKB: 420,
      ...body,
    });
}

function approve(accessToken: string, submissionId: string) {
  return request(createApp())
    .post(`/api/submissions/${submissionId}/approve`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ reviewerNote: "Approved." });
}

/** Full submit → approve round trip; returns the submission body. */
async function submitAndApprove(
  taskId: string,
  idempotencyKey: string,
  body: Record<string, unknown> = {},
) {
  const assistant = await loginAs("jun@beachread.jp");
  const mangaka = await loginAs("inoue@beachread.jp");
  const created = await submitTask(assistant.accessToken, taskId, idempotencyKey, body).expect(201);
  await approve(mangaka.accessToken, created.body.data.id).expect(200);
  return created.body.data as Record<string, any>;
}

describe("approved submission promotion to the chapter page", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 60_000);

  beforeEach(async () => {
    await seedDatabase();
  }, 60_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  }, 30_000);

  it("replaces the page image and archives the outgoing one", async () => {
    await givePageAnAsset();
    const taskId = await seedTask();
    const submission = await submitAndApprove(taskId, "promo-happy");

    const page = await readPage();
    expect(page.fileKey).toBe(submission.fileKey);
    expect(page.fileUrl).toBe(submission.fileUrl);
    expect(page.imageUrl).toBe(submission.fileUrl);
    expect(page.fileName).toBe("revised.png");
    expect(page.sizeKB).toBe(420);

    // Unknown dimensions must not linger, and the stale AI render must not win
    // over the new artwork in the studio canvas.
    expect(page.imageWidth).toBeUndefined();
    expect(page.imageHeight).toBeUndefined();
    expect(page.metadata?.aiWhitened).toBeUndefined();

    expect(page.metadata.promotedFrom.submissionId).toBe(submission.id);
    expect(page.metadata.promotedFrom.taskId).toBe(taskId);
    expect(page.metadata.promotedFrom.approvedById).toBe("u-mangaka");
    expect(page.metadata.promotedFrom.previousFileKey).toBe(ORIGINAL_KEY);

    expect(page.versions).toHaveLength(1);
    expect(page.versions[0].version).toBe(1);
    expect(page.versions[0].fileKey).toBe(ORIGINAL_KEY);
    expect(page.versions[0].metadata.imageWidth).toBe(1000);
    expect(page.versions[0].metadata.imageHeight).toBe(1400);
    expect(page.versions[0].metadata.aiWhitened.fileKey).toBe(
      `ai/pages/${PAGE_ID}/whitened.png`,
    );
    expect(page.versions[0].metadata.replacedBySubmissionId).toBe(submission.id);
    expect(page.metadata.promotedFrom.pageVersionId).toBe(page.versions[0].id);

    const audit = await AuditEntryModel.findOne({
      action: "PAGE_IMAGE_PROMOTED",
      entityId: PAGE_ID,
    }).lean();
    expect(audit).toBeTruthy();
  });

  it("leaves the page untouched for a notes-only submission", async () => {
    await givePageAnAsset();
    const taskId = await seedTask();
    const before = await readPage();

    await submitAndApprove(taskId, "promo-notes-only", {
      fileKey: undefined,
      fileName: undefined,
      fileUrl: undefined,
      mimeType: undefined,
      fileSizeKB: undefined,
    });

    const after = await readPage();
    expect(after.fileKey).toBe(before.fileKey);
    expect(after.versions).toBeUndefined();
    expect(after.metadata?.promotedFrom).toBeUndefined();

    // NO_FILE_KEY is a normal outcome, not drifted data — it must not be audited.
    const skips = await AuditEntryModel.countDocuments({
      action: "PAGE_IMAGE_PROMOTION_SKIPPED",
    });
    expect(skips).toBe(0);
  });

  it("leaves chapter pages untouched when the task has no page target", async () => {
    await givePageAnAsset();
    const taskId = await seedTask({ pageId: undefined });
    const before = await readPage();

    await submitAndApprove(taskId, "promo-no-page");

    const after = await readPage();
    expect(after.fileKey).toBe(before.fileKey);
    expect(after.versions).toBeUndefined();
  });

  it("approves and records a skip when the task points at a missing page", async () => {
    const taskId = await seedTask({ pageId: "pg-does-not-exist" });

    await submitAndApprove(taskId, "promo-orphan-page");

    const skip = (await AuditEntryModel.findOne({
      action: "PAGE_IMAGE_PROMOTION_SKIPPED",
    }).lean()) as any;
    expect(skip).toBeTruthy();
    expect(skip.metadata.reason).toBe("PAGE_NOT_FOUND");
    expect(skip.metadata.pageId).toBe("pg-does-not-exist");
  });

  it("stacks page versions across repeated promotions", async () => {
    await givePageAnAsset();
    const first = await submitAndApprove(await seedTask(), "promo-stack-1");
    const second = await submitAndApprove(await seedTask(), "promo-stack-2");

    const page = await readPage();
    expect(page.fileKey).toBe(second.fileKey);
    expect(page.versions).toHaveLength(2);
    expect(page.versions.map((item: any) => item.version)).toEqual([1, 2]);
    expect(page.versions[0].fileKey).toBe(ORIGINAL_KEY);
    expect(page.versions[1].fileKey).toBe(first.fileKey);
  });

  it("keeps the cross-entity guard correct once a submission key owns the page", async () => {
    await givePageAnAsset();
    const promoted = await submitAndApprove(await seedTask(), "promo-guard-seed");
    const assistant = await loginAs("jun@beachread.jp");

    // Same page: re-submitting the key the page now owns is legitimate.
    await submitTask(assistant.accessToken, await seedTask(), "promo-guard-same", {
      fileKey: promoted.fileKey,
    }).expect(201);

    // Different page in the same chapter: still a cross-entity attachment.
    await submitTask(
      assistant.accessToken,
      await seedTask({ pageId: OTHER_PAGE_ID }),
      "promo-guard-other",
      { fileKey: promoted.fileKey },
    )
      .expect(400)
      .expect((res) => {
        expect(res.body.code).toBe("CROSS_ENTITY_ATTACHMENT");
      });
  });

  it("keeps both the promoted key and the archived version resolvable", async () => {
    await givePageAnAsset();
    const submission = await submitAndApprove(await seedTask(), "promo-visibility");
    const mangaka = await loginAs("inoue@beachread.jp");
    const page = await readPage();

    await request(createApp())
      .post("/api/files/display-url")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ key: submission.fileKey })
      .expect(200);

    await request(createApp())
      .post("/api/files/display-url")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ key: page.versions[0].fileKey })
      .expect(200);
  });

  it("makes an open chapter review stale", async () => {
    const chapterId = "ch-promo-stale";
    const pageId = "pg-promo-stale";
    const staleKey = "chapters/ch-promo-stale/pages/frozen.png";
    await ChapterModel.create({
      id: chapterId,
      seriesId: "s-berserk-prod",
      number: 91,
      title: "Promotion staleness",
      status: "TANTOU_REVIEW",
      pages: [
        {
          id: pageId,
          pageNumber: 1,
          fileKey: staleKey,
          fileUrl: `https://cdn.example/${staleKey}`,
          status: "TANTOU_REVIEW",
        },
      ],
      // Frozen against the page's CURRENT fileKey — pageReviewVersion() falls
      // through to fileKey, so promoting a new image must invalidate this.
      reviewSnapshot: {
        chapterVersionId: `chapter:${chapterId}:${pageId}:${staleKey}`,
        pageVersionIds: [{ pageId, pageVersionId: staleKey }],
        frozenAt: new Date().toISOString(),
      },
      reviewNotes: [],
      revisionRound: 0,
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await submitAndApprove(
      await seedTask({ chapterId, pageId }),
      "promo-stale",
    );

    const editor = await loginAs("tanaka@beachread.jp");
    await request(createApp())
      .post(`/api/chapters/${chapterId}/actions/EDITOR_APPROVE`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("REVIEW_SNAPSHOT_STALE");
      });
  });
});
