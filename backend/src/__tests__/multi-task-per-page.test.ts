import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { ChapterModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password: email })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string } };
}

describe("multiple tasks per page", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => seedDatabase());

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  }, 30_000);

  async function preparePage() {
    const chapter = await ChapterModel.findOne({
      id: "ch-s-berserk-prod-5",
    }).lean();
    await ChapterModel.updateOne(
      { id: "ch-s-berserk-prod-5" },
      {
        $set: {
          status: "IN_PRODUCTION",
          pages: (chapter?.pages ?? []).map((page: any) => ({
            ...page,
            status: "UPLOADED",
            fileKey: "tests/multi-task-page.jpg",
          })),
        },
      },
    );
    const owner = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .post(`/api/studio/pages/ch-s-berserk-prod-5-p2/assignment`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);
    return owner;
  }

  it("allows supporting work beside the single final page delivery", async () => {
    const mangaka = await preparePage();
    const app = createApp();
    const base = {
      chapterId: "ch-s-berserk-prod-5",
      pageId: "ch-s-berserk-prod-5-p2",
      assigneeId: "u-assist",
      rateCode: "SPEECH_BUBBLE",
      quantity: 1,
    };

    const first = await request(app)
      .post("/api/studio/tasks")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ ...base, title: "Final page", deliveryRole: "FINAL_PAGE" })
      .expect(201);

    const second = await request(app)
      .post("/api/studio/tasks")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ ...base, title: "Cleanup note", deliveryRole: "SUPPORTING" })
      .expect(201);

    expect(first.body.data.pageId).toBe("ch-s-berserk-prod-5-p2");
    expect(second.body.data.pageId).toBe("ch-s-berserk-prod-5-p2");
    expect(second.body.data.id).not.toBe(first.body.data.id);
    expect(first.body.data.deliveryRole).toBe("FINAL_PAGE");
    expect(second.body.data.deliveryRole).toBe("SUPPORTING");
    expect(second.body.data.pageTaskActive).toBe(false);
  });

  it("rejects a second active final delivery for the same page", async () => {
    const mangaka = await preparePage();
    const app = createApp();
    const base = {
      chapterId: "ch-s-berserk-prod-5",
      pageId: "ch-s-berserk-prod-5-p2",
      assigneeId: "u-assist",
      rateCode: "SPEECH_BUBBLE",
      quantity: 1,
      deliveryRole: "FINAL_PAGE",
    };

    await request(app)
      .post("/api/studio/tasks")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ ...base, title: "Final page v1" })
      .expect(201);

    const duplicate = await request(app)
      .post("/api/studio/tasks")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ ...base, title: "Another final page" })
      .expect(409);

    expect(duplicate.body.code).toBe("FINAL_PAGE_DELIVERY_EXISTS");
  });
});
