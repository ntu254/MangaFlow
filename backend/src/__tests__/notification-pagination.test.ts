import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { NotificationModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string } };
}

describe("notification pagination contract", () => {
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

  it("keeps page two reachable and reports unread rows across the owner's whole feed", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    await NotificationModel.deleteMany({ userId: editor.user.id });
    await NotificationModel.insertMany(
      Array.from({ length: 55 }, (_, index) => ({
        id: `notification-page-${index + 1}`,
        userId: editor.user.id,
        kind: "workflow.update",
        title: `Notification ${index + 1}`,
        message: `Message ${index + 1}`,
        readAt: index % 2 === 0 ? new Date("2026-08-04T08:00:00.000Z") : null,
        createdAt: new Date(Date.UTC(2026, 7, 4, 12, 0, index)),
      })),
    );
    await NotificationModel.create({
      id: "notification-other-user",
      userId: "u-board",
      kind: "workflow.update",
      title: "Someone else's notification",
      message: "Must not affect totals.",
      createdAt: new Date("2026-08-04T13:00:00.000Z"),
    });

    const first = await request(createApp())
      .get("/api/notifications?page=1&limit=50")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);
    const second = await request(createApp())
      .get("/api/notifications?page=2&limit=50")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    expect(first.body).toMatchObject({
      success: true,
      data: {
        pagination: { page: 1, limit: 50, total: 55, totalPages: 2 },
        unreadTotal: 27,
      },
    });
    expect(first.body.data.data).toHaveLength(50);
    expect(first.body.data.data[0].id).toBe("notification-page-55");
    expect(second.body).toMatchObject({
      success: true,
      data: {
        pagination: { page: 2, limit: 50, total: 55, totalPages: 2 },
        unreadTotal: 27,
      },
    });
    expect(second.body.data.data.map((item: { id: string }) => item.id)).toEqual([
      "notification-page-5",
      "notification-page-4",
      "notification-page-3",
      "notification-page-2",
      "notification-page-1",
    ]);
  });
});
