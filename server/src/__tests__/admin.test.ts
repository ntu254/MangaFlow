import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";

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
      expect(response.body.pagination.total).toBeGreaterThan(0);
      expect(response.body.meta.summary.total).toBeGreaterThan(0);
    });

    it("supports MVP list pagination, search, filters, and sort", async () => {
      const admin = await loginAs("admin@beachread.jp");
      const filters = encodeURIComponent(
        JSON.stringify({
          role: { type: "select", value: "ASSISTANT" },
          active: { type: "boolean", value: true },
        }),
      );

      const response = await request(createApp())
        .get(`/api/admin/users?page=1&pageSize=2&q=suzuki&sortBy=email&sortDir=desc&filters=${filters}`)
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].email).toBe("jun@beachread.jp");
      expect(response.body.pagination).toMatchObject({
        page: 1,
        pageSize: 2,
        total: 1,
      });
      expect(response.body.meta.sort).toEqual({ field: "email", dir: "desc" });
      expect(response.body.meta.filters.role).toEqual({ type: "select", value: "ASSISTANT" });
    });
  });

  describe("GET /api/admin/audit - RBAC", () => {
    it("returns 403 for non-admin user", async () => {
      const editor = await loginAs("tanaka@beachread.jp");
      await request(createApp())
        .get("/api/admin/audit")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .expect(403);
    });

    it("returns 200 for admin", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .get("/api/admin/audit")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(200);
    });
  });

  describe("GET /api/admin/payroll - RBAC", () => {
    it("returns 403 for non-admin user", async () => {
      const editor = await loginAs("tanaka@beachread.jp");
      await request(createApp())
        .get("/api/admin/payroll")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .expect(403);
    });

    it("returns 200 for admin", async () => {
      const admin = await loginAs("admin@beachread.jp");
      const response = await request(createApp())
        .get("/api/admin/payroll")
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

    it("does not expose admin payroll confirmation/payment/void actions", async () => {
      const admin = await loginAs("admin@beachread.jp");

      await request(createApp())
        .post("/api/admin/payroll/earn-001/confirm")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(404);

      await request(createApp())
        .post("/api/admin/payroll/earn-002/mark-paid")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(404);

      await request(createApp())
        .post("/api/admin/payroll/earn-001/void")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ reason: "MVP should block this" })
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

    it("admin can change user role and creates audit entry", async () => {
      const admin = await loginAs("admin@beachread.jp");
      const response = await request(createApp())
        .patch("/api/admin/users/u-assist")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ role: "EDITOR" })
        .expect(200);
      expect(response.body.data.role).toBe("EDITOR");

      const auditRes = await request(createApp())
        .get("/api/admin/audit")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(200);
      const auditEntry = auditRes.body.data.find(
        (entry: any) => entry.action === "user.update" && entry.entityId === "u-assist"
      );
      expect(auditEntry).toBeDefined();
    });
  });

});
