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

  describe("POST /api/admin/payroll/:earningId/confirm - RBAC", () => {
    it("returns 403 for non-admin user", async () => {
      const editor = await loginAs("tanaka@beachread.jp");
      await request(createApp())
        .post("/api/admin/payroll/earn-001/confirm")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .expect(403);
    });

    it("admin can confirm pending earning", async () => {
      const admin = await loginAs("admin@beachread.jp");
      const response = await request(createApp())
        .post("/api/admin/payroll/earn-001/confirm")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(200);
      expect(response.body.data.status).toBe("CONFIRMED");
    });

    it("cannot confirm already paid earning", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .post("/api/admin/payroll/earn-003/confirm")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(409);
    });

    it("returns 404 for non-existent earning", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .post("/api/admin/payroll/earn-nonexistent/confirm")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(404);
    });
  });

  describe("POST /api/admin/payroll/:earningId/mark-paid - RBAC", () => {
    it("returns 403 for non-admin user", async () => {
      const editor = await loginAs("tanaka@beachread.jp");
      await request(createApp())
        .post("/api/admin/payroll/earn-002/mark-paid")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .expect(403);
    });

    it("admin can mark confirmed earning as paid", async () => {
      const admin = await loginAs("admin@beachread.jp");
      const response = await request(createApp())
        .post("/api/admin/payroll/earn-002/mark-paid")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(200);
      expect(response.body.data.status).toBe("PAID");
    });

    it("cannot mark pending earning as paid", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .post("/api/admin/payroll/earn-001/mark-paid")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(409);
    });
  });

  describe("POST /api/admin/payroll/:earningId/void - RBAC", () => {
    it("returns 403 for non-admin user", async () => {
      const editor = await loginAs("tanaka@beachread.jp");
      await request(createApp())
        .post("/api/admin/payroll/earn-001/void")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({ reason: "Test void" })
        .expect(403);
    });

    it("admin can void earning with reason", async () => {
      const admin = await loginAs("admin@beachread.jp");
      const response = await request(createApp())
        .post("/api/admin/payroll/earn-001/void")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ reason: "Duplicate entry" })
        .expect(200);
      expect(response.body.data.status).toBe("VOIDED");
    });

    it("void without reason returns 400", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .post("/api/admin/payroll/earn-001/void")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({})
        .expect(400);
    });

    it("cannot void already voided earning", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .post("/api/admin/payroll/earn-001/void")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ reason: "First void" })
        .expect(200);
      await request(createApp())
        .post("/api/admin/payroll/earn-001/void")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ reason: "Second void" })
        .expect(409);
    });
  });
});
