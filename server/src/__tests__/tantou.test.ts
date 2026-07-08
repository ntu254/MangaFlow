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

describe("Tantou Editor Assignment", () => {
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

  describe("GET /api/series/:seriesId/editor - RBAC", () => {
    it("returns editor for authenticated user", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const response = await request(createApp())
        .get("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.role).toBe("editor");
      expect(response.body.data.userId).toBe("u-editor");
    });

    it("returns editor with user info", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const response = await request(createApp())
        .get("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toBe("u-editor");
      expect(response.body.data.userName).toBe("Tanaka Akira");
      expect(response.body.data.userEmail).toBe("tanaka@beachread.jp");
    });
  });

  describe("POST /api/series/:seriesId/editor - RBAC", () => {
    it("returns 403 for non-mangaka user", async () => {
      const editor = await loginAs("tanaka@beachread.jp");
      await request(createApp())
        .post("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({ editorId: "u-editor", editorName: "Tanaka Akira" })
        .expect(403);
    });

    it("returns 403 for assistant", async () => {
      const assistant = await loginAs("jun@beachread.jp");
      await request(createApp())
        .post("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .send({ editorId: "u-editor", editorName: "Tanaka Akira" })
        .expect(403);
    });

    it("mangaka can assign editor to own series", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      // First remove existing editor
      await request(createApp())
        .delete("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);

      // Then assign new one
      const response = await request(createApp())
        .post("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ editorId: "u-mobile-editor", editorName: "Mobile Editor" })
        .expect(200);
      expect(response.body.data.userId).toBe("u-mobile-editor");
      expect(response.body.data.role).toBe("editor");
    });

    it("cannot assign editor if one already exists", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      await request(createApp())
        .post("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ editorId: "u-mobile-editor", editorName: "Mobile Editor" })
        .expect(409);
    });

    it("returns 400 when assigning non-editor user", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      // First remove existing editor
      await request(createApp())
        .delete("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);

      // Try to assign a mangaka user as editor
      await request(createApp())
        .post("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ editorId: "u-mangaka", editorName: "Inoue Takehiko" })
        .expect(400);
    });

    it("returns 404 for non-existent series", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      await request(createApp())
        .post("/api/series/nonexistent/editor")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ editorId: "u-editor", editorName: "Tanaka Akira" })
        .expect(404);
    });
  });

  describe("DELETE /api/series/:seriesId/editor - RBAC", () => {
    it("returns 403 for non-mangaka user", async () => {
      const editor = await loginAs("tanaka@beachread.jp");
      await request(createApp())
        .delete("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .expect(403);
    });

    it("mangaka can remove editor from own series", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const response = await request(createApp())
        .delete("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      expect(response.body.data.id).toBe("sm-editor-berserk");

      // Verify editor is gone
      const checkRes = await request(createApp())
        .get("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      expect(checkRes.body.data).toBeNull();
    });

    it("returns 404 after editor already removed", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      // Remove editor first
      await request(createApp())
        .delete("/api/series/s-vinland-prod/editor")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      // Try to remove again
      await request(createApp())
        .delete("/api/series/s-vinland-prod/editor")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(404);
    });
  });
});
