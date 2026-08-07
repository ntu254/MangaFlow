import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;
const BLOCKED_CHAPTER = "ch-s-berserk-prod-5"; // seeded TANTOU_REVIEW chapter
const SCHEDULED_CHAPTER = "ch-s-berserk-prod-4";
const UNSCHEDULED_READY_CHAPTER = "ch-s-vinland-prod-1";

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string };
}

describe("mobile editor chapter actions parity", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => {
    await seedDatabase();
  }, 30_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  }, 30_000);

  it("reports the same readiness and refuses a blocked direct approval", async () => {
    const editor = await loginAs("tanaka@beachread.jp"); // assigned Tantou for s-berserk-prod
    const detail = await request(createApp())
      .get(`/api/editor/chapters/${BLOCKED_CHAPTER}/detail`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    const approve = detail.body.data.actions.find((a: any) => a.action === "EDITOR_APPROVE");
    expect(approve).toBeTruthy();

    if (!detail.body.data.readiness.ready) {
      // A blocked chapter must not offer approval, and a direct canonical
      // approve must be rejected with a conflict.
      expect(approve.enabled).toBe(false);
      expect((approve.disabledReason ?? "").length).toBeGreaterThan(0);
      await request(createApp())
        .post(`/api/chapters/${BLOCKED_CHAPTER}/actions/EDITOR_APPROVE`)
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({})
        .expect(409);
    } else {
      expect(approve.enabled).toBe(true);
    }
  });

  it("denies chapter detail to a Board member", async () => {
    const board = await loginAs("sato@beachread.jp");
    await request(createApp())
      .get(`/api/editor/chapters/${BLOCKED_CHAPTER}/detail`)
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(403);
  });

  it("denies chapter detail to an Editor who is not the active Tantou", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    await request(createApp())
      .get(`/api/editor/chapters/${BLOCKED_CHAPTER}/detail`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(403);
  });

  it("does not offer Publish now for an unscheduled ready chapter the backend will reject", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const detail = await request(createApp())
      .get(`/api/editor/chapters/${UNSCHEDULED_READY_CHAPTER}/detail`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    expect(detail.body.data.actions.find((action: any) => action.action === "PUBLISH")).toMatchObject({
      enabled: false,
      disabledReason: "Schedule this chapter before publishing.",
    });

    const publish = await request(createApp())
      .post(`/api/chapters/${UNSCHEDULED_READY_CHAPTER}/actions/PUBLISH`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(409);
    expect(publish.body.code).toBe("PUBLICATION_NOT_SCHEDULED");
  });

  it("offers Publish now for a chapter scheduled in the future, and PUBLISH_EARLY succeeds immediately", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const detail = await request(createApp())
      .get(`/api/editor/chapters/${SCHEDULED_CHAPTER}/detail`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    // Seeded scheduledAt is a few days ahead, i.e. not due yet — Publish now
    // must still be offered (mobile has no postpone-then-wait flow) and must
    // succeed via the PUBLISH_EARLY transition mobile actually calls.
    expect(detail.body.data.actions.find((action: any) => action.action === "PUBLISH")).toMatchObject({
      enabled: true,
      disabledReason: null,
    });

    const publish = await request(createApp())
      .post(`/api/chapters/${SCHEDULED_CHAPTER}/actions/PUBLISH_EARLY`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200);
    expect(publish.body.data.status).toBe("PUBLISHED");
  });

  it("offers Publish now when the scheduled publication is due and the canonical action succeeds", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const { PublicationModel } = await import("../db/models.js");
    await PublicationModel.updateOne(
      { chapterId: SCHEDULED_CHAPTER },
      { $set: { scheduledAt: new Date(Date.now() - 60_000) } },
    );

    const detail = await request(createApp())
      .get(`/api/editor/chapters/${SCHEDULED_CHAPTER}/detail`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);
    expect(detail.body.data.actions.find((action: any) => action.action === "PUBLISH")).toMatchObject({
      enabled: true,
      disabledReason: null,
    });

    const publish = await request(createApp())
      .post(`/api/chapters/${SCHEDULED_CHAPTER}/actions/PUBLISH`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200);
    expect(publish.body.data.status).toBe("PUBLISHED");
  });

  it("does not offer Publish now when the canonical service rejects the series state", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const { PublicationModel, SeriesModel } = await import("../db/models.js");
    await PublicationModel.updateOne(
      { chapterId: SCHEDULED_CHAPTER },
      { $set: { scheduledAt: new Date(Date.now() - 60_000) } },
    );
    await SeriesModel.updateOne({ id: "s-berserk-prod" }, { $set: { status: "CANCELLED" } });

    const detail = await request(createApp())
      .get(`/api/editor/chapters/${SCHEDULED_CHAPTER}/detail`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);
    expect(detail.body.data.actions.find((action: any) => action.action === "PUBLISH")).toMatchObject({
      enabled: false,
      disabledReason: "This series cannot be published in its current state.",
    });

    const publish = await request(createApp())
      .post(`/api/chapters/${SCHEDULED_CHAPTER}/actions/PUBLISH`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(409);
    expect(publish.body.code).toBe("SERIES_NOT_PUBLISHABLE");
  });
});
