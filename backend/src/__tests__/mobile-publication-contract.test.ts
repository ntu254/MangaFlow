import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { mobileInboxSchema } from "../mobile/mobile-work-item.contract.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

describe("mobile publication inbox contract", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
    await seedDatabase();
  }, 30_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  }, 30_000);

  it("emits explicit series and chapter context from the live Editor inbox", async () => {
    const login = await request(createApp())
      .post("/api/auth/login")
      .send({ email: "tanaka@beachread.jp", password: "tanaka@beachread.jp" })
      .expect(200);
    const response = await request(createApp())
      .get("/api/editor/inbox")
      .set("Authorization", `Bearer ${login.body.data.accessToken}`)
      .expect(200);

    const inbox = mobileInboxSchema.parse(response.body.data);
    const publication = inbox.items.find(
      (item) => item.kind === "PUBLICATION" && item.entityId === "ch-s-berserk-prod-4",
    );

    expect(publication).toMatchObject({
      kind: "PUBLICATION",
      entityType: "CHAPTER",
      entityId: "ch-s-berserk-prod-4",
      title: "Echoes",
      status: "SCHEDULED",
      chapterContext: {
        seriesId: "s-berserk-prod",
        seriesTitle: "Berserk: Lost Chapters",
        chapterId: "ch-s-berserk-prod-4",
        chapterNumber: 4,
        chapterTitle: "Echoes",
      },
    });
  });
});
