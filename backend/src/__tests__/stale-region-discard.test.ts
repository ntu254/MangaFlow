import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { ChapterModel, StudioRegionModel, StudioTaskModel, SubmissionModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string; role: string } };
}

const CHAPTER_ID = "ch-s-berserk-prod-4";
const PAGE_ID = `${CHAPTER_ID}-p1`;

describe("Stale region discard on submission approval", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => {
    await seedDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  async function createApprovableSubmission(suffix: string) {
    await StudioTaskModel.create({
      id: `tsk-discard-${suffix}`,
      title: "Task for region discard test",
      chapterId: CHAPTER_ID,
      pageId: PAGE_ID,
      status: "SUBMITTED",
      assigneeId: "u-assist",
      currentSubmissionId: `sub-discard-${suffix}`,
    });
    return SubmissionModel.create({
      id: `sub-discard-${suffix}`,
      taskId: `tsk-discard-${suffix}`,
      chapterId: CHAPTER_ID,
      pageId: PAGE_ID,
      assistantId: "u-assist",
      assistantName: "Jun",
      fileUrl: "https://mock-s3-bucket/final-page.png",
      fileKey: "tests/final-page.png",
      status: "PENDING",
      submittedAt: new Date().toISOString(),
    });
  }

  it("discards AI-detected and manually confirmed regions on the page once its submission is approved", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();

    await StudioRegionModel.create([
      {
        id: "reg-discard-ai",
        chapterId: CHAPTER_ID,
        pageId: PAGE_ID,
        type: "speech_bubble",
        status: "DETECTED",
        metadata: { source: "ai", kind: "bubble.detect" },
      },
      {
        id: "reg-discard-manual",
        chapterId: CHAPTER_ID,
        pageId: PAGE_ID,
        type: "other",
        status: "CONFIRMED",
      },
    ]);

    const submission = await createApprovableSubmission("1");

    await request(app)
      .post(`/api/submissions/${submission.id}/approve`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);

    const aiRegion = await StudioRegionModel.findOne({ id: "reg-discard-ai" }).lean();
    const manualRegion = await StudioRegionModel.findOne({ id: "reg-discard-manual" }).lean();
    expect((aiRegion as any).status).toBe("DISCARDED");
    expect((manualRegion as any).status).toBe("DISCARDED");
  });

  it("leaves an already-discarded region's status stable across a later approval on the same page", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();

    await StudioRegionModel.create({
      id: "reg-already-discarded",
      chapterId: CHAPTER_ID,
      pageId: PAGE_ID,
      type: "speech_bubble",
      status: "DISCARDED",
    });

    const submission = await createApprovableSubmission("2");

    const matched = await StudioRegionModel.countDocuments({
      pageId: PAGE_ID,
      status: { $ne: "DISCARDED" },
    });
    expect(matched).toBe(0);

    await request(app)
      .post(`/api/submissions/${submission.id}/approve`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);

    const region = await StudioRegionModel.findOne({ id: "reg-already-discarded" }).lean();
    expect((region as any).status).toBe("DISCARDED");
  });

  it("clears a stale cached AI-whitened render when a submission's file is promoted onto the page", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();

    const chapterBefore = (await ChapterModel.findOne({ id: CHAPTER_ID }).lean()) as any;
    const pagesWithWhitened = chapterBefore.pages.map((page: any) =>
      String(page.id) === PAGE_ID
        ? {
            ...page,
            metadata: {
              ...(page.metadata ?? {}),
              aiWhitened: {
                fileKey: "stale/whitened.png",
                fileUrl: "https://mock-s3-bucket/stale/whitened.png",
                processingId: "proc-1",
                mimeType: "image/png",
                generatedAt: new Date().toISOString(),
              },
            },
          }
        : page,
    );
    await ChapterModel.updateOne({ id: CHAPTER_ID }, { $set: { pages: pagesWithWhitened } });

    const submission = await createApprovableSubmission("4");

    await request(app)
      .post(`/api/submissions/${submission.id}/approve`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);

    const chapterAfter = (await ChapterModel.findOne({ id: CHAPTER_ID }).lean()) as any;
    const page = chapterAfter.pages.find((candidate: any) => String(candidate.id) === PAGE_ID);
    expect(page.metadata?.aiWhitened).toBeUndefined();
    expect(page.fileKey).toBe("tests/final-page.png");
    expect(page.fileUrl).toBe("https://mock-s3-bucket/final-page.png");
  });

  it("does not discard regions on a different page", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();
    const otherPageId = `${CHAPTER_ID}-p2`;

    await StudioRegionModel.create({
      id: "reg-other-page",
      chapterId: CHAPTER_ID,
      pageId: otherPageId,
      type: "speech_bubble",
      status: "DETECTED",
    });

    const submission = await createApprovableSubmission("3");

    await request(app)
      .post(`/api/submissions/${submission.id}/approve`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);

    const region = await StudioRegionModel.findOne({ id: "reg-other-page" }).lean();
    expect((region as any).status).toBe("DETECTED");
  });
});
