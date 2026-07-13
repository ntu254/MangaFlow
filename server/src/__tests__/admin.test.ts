import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import { AuditEntryModel } from "../db/models.js";

let mongo: MongoMemoryServer;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; refreshToken: string; user: { id: string; role: string } };
}

describe("Admin RBAC and mutations", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await seedDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  describe("GET /api/admin/users - RBAC", () => {
    it("returns 403 for non-admin user", async () => {
      const editor = await loginAs("tanaka@beachread.jp");
      await request(createApp())
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .expect(403);
    });

    it("returns 403 for mangaka", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      await request(createApp())
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(403);
    });

    it("returns 200 for admin", async () => {
      const admin = await loginAs("admin@beachread.jp");
      const response = await request(createApp())
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(200);
      expect(response.body.data).toEqual(expect.any(Array));
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("MVP excludes manual workflow/payment mutation endpoints", () => {
    it("does not expose admin override", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .post("/api/admin/override")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ action: "force_status", targetId: "series-001", reason: "MVP should block this" })
        .expect(404);
    });

  });

  describe("PATCH /api/admin/users/:userId - RBAC", () => {
    it("returns 403 for non-admin user", async () => {
      const editor = await loginAs("tanaka@beachread.jp");
      await request(createApp())
        .patch("/api/admin/users/u-assist")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({ name: "Hacked Name" })
        .expect(403);
    });

    it("admin can update user name", async () => {
      const admin = await loginAs("admin@beachread.jp");
      const response = await request(createApp())
        .patch("/api/admin/users/u-assist")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ name: "Updated Suzuki Jun" })
        .expect(200);
      expect(response.body.data.name).toBe("Updated Suzuki Jun");
    });

    it("admin cannot overwrite protected fields", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .patch("/api/admin/users/u-assist")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ passwordHash: "hacked-hash", id: "hacked-id" })
        .expect(400);
    });

    it("admin can change user role and records an internal audit entry", async () => {
      const admin = await loginAs("admin@beachread.jp");
      const response = await request(createApp())
        .patch("/api/admin/users/u-assist")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ role: "EDITOR" })
        .expect(200);
      expect(response.body.data.role).toBe("EDITOR");

      const auditEntry = await AuditEntryModel.findOne({
        action: "user.update",
        entityId: "u-assist",
      }).lean();
      expect(auditEntry).toBeDefined();
    });
  });

});
