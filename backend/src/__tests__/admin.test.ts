import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { AuditEntryModel, UserModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; refreshToken: string; user: { id: string; role: string } };
}

describe("Admin RBAC and mutations", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
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

  describe("Removed admin routes - 404", () => {
    it("returns 404 for GET /api/admin/payroll", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .get("/api/admin/payroll")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(404);
    });

    it("returns 404 for payroll confirm/mark-paid/void", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .post("/api/admin/payroll/earn-001/confirm")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(404);
      await request(createApp())
        .post("/api/admin/payroll/earn-001/mark-paid")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(404);
      await request(createApp())
        .post("/api/admin/payroll/earn-001/void")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ reason: "test" })
        .expect(404);
    });

    it("returns 404 for admin materials endpoints", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .get("/api/admin/materials")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(404);
      await request(createApp())
        .post("/api/admin/materials")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(404);
    });

    it("returns 404 for workflow-overrides and override", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .post("/api/admin/workflow-overrides")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ action: "test", entityId: "x", reason: "test" })
        .expect(404);
      await request(createApp())
        .post("/api/admin/override")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ action: "test", targetId: "x", reason: "test" })
        .expect(404);
    });
  });

  describe("Demo routes - non-production gating", () => {
    it("resets demo data for admin in test env", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .post("/api/admin/demo/reset")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(200);
    });

    it("clears demo data for admin in test env", async () => {
      // Demo reset/clear wipe the session table, so re-login between calls.
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .post("/api/admin/demo/clear")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(200);
    });

    it("returns 403 for non-admin user on demo routes", async () => {
      const editor = await loginAs("tanaka@beachread.jp");
      await request(createApp())
        .post("/api/admin/demo/reset")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .expect(403);
    });

    it("refuses demo reset when NODE_ENV is production (handler backstop)", async () => {
      const admin = await loginAs("admin@beachread.jp");
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      try {
        await request(createApp())
          .post("/api/admin/demo/reset")
          .set("Authorization", `Bearer ${admin.accessToken}`)
          .expect(403);
      } finally {
        process.env.NODE_ENV = original;
      }
    });

    it("refuses demo clear when NODE_ENV is production (handler backstop)", async () => {
      const admin = await loginAs("admin@beachread.jp");
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      try {
        await request(createApp())
          .post("/api/admin/demo/clear")
          .set("Authorization", `Bearer ${admin.accessToken}`)
          .expect(403);
      } finally {
        process.env.NODE_ENV = original;
      }
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

    it("admin can change user role and creates internal audit entry", async () => {
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

    it("atomically reassigns the single active Board Chair", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .patch("/api/admin/users/u-board-2")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ isChair: true })
        .expect(200);

      const chairs = await UserModel.find({
        role: "BOARD",
        active: { $ne: false },
        isChair: true,
      }).lean();
      expect(chairs).toHaveLength(1);
      expect((chairs[0] as any).id).toBe("u-board-2");
    });

    it("clears incompatible designations when role or active state changes", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .patch("/api/admin/users/u-board")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ role: "EDITOR" })
        .expect(200)
        .expect((response) => {
          expect(response.body.data.isChair).toBe(false);
        });

      await request(createApp())
        .patch("/api/admin/users/u-editor")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ active: false })
        .expect(200)
        .expect((response) => {
          expect(response.body.data.isEditorInChief).toBe(false);
        });
    });

    it("rejects a designation that is incompatible with the target role", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .patch("/api/admin/users/u-assist")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ isChair: true })
        .expect(400)
        .expect((response) => {
          expect(response.body.code).toBe("INVALID_BOARD_CHAIR");
        });
    });

    it("rejects a sixth active Board seat", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .patch("/api/admin/users/u-assist")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ role: "BOARD" })
        .expect(409)
        .expect((response) => {
          expect(response.body.code).toBe("BOARD_ROSTER_FULL");
        });
    });
  });

});
