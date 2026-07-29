import http from "node:http";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import {
  AiProcessingModel,
  ChapterModel,
  ProposalModel,
  SeriesModel,
  StudioRegionModel,
} from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as {
    accessToken: string;
    refreshToken: string;
    user: { id: string; role: string };
  };
}

describe("MangaFlow backend live contract", () => {
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

  async function createUploadedPage(accessToken: string, pageId: string) {
    const app = createApp();
    const uploadRes = await request(app)
      .post("/api/files/presign-upload")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        fileName: `${pageId}.png`,
        contentType: "image/png",
        folder: "chapters/ch-s-berserk-prod-5/pages",
      })
      .expect(200);

    const uploadPath = new URL(uploadRes.body.data.uploadUrl, "http://localhost:3001").pathname;
    await request(app)
      .put(uploadPath)
      .set("Content-Type", "image/png")
      .send(Buffer.from("fake-png-bytes"))
      .expect(204);

    await request(app)
      .post("/api/chapters/ch-s-berserk-prod-5/pages")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        id: pageId,
        pageNumber: 99,
        imageUrl: uploadRes.body.data.downloadUrl,
        fileUrl: uploadRes.body.data.downloadUrl,
        fileKey: uploadRes.body.data.key,
        fileName: `${pageId}.png`,
        mimeType: "image/png",
        sizeKB: 1,
      })
      .expect(201);

    return { key: uploadRes.body.data.key, pageId };
  }

  it("authenticates seeded web and mobile users with uppercase API roles", async () => {
    const web = await loginAs("tanaka@beachread.jp");
    expect(web.user.role).toBe("EDITOR");

    const mobile = await loginAs("board@beachread.jp");
    expect(mobile.user.role).toBe("BOARD");

    await request(createApp())
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${web.accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.email).toBe("tanaka@beachread.jp");
      });

    const refreshed = await request(createApp())
      .post("/api/auth/refresh")
      .send({ refreshToken: web.refreshToken })
      .expect(200);
    expect(refreshed.body.data.accessToken).toEqual(expect.any(String));
  });

  it("returns bootstrap and mobile review queues from the same seeded workflow state", async () => {
    const editor = await loginAs("editor@mangaflow.local");

    await request(createApp())
      .get("/api/me/bootstrap")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.navRole).toBe("editor");
        expect(response.body.data.featureFlags.liveBackend).toBe(true);
      });

    await request(createApp())
      .get("/api/editor/manuscripts/review-queue")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0].series.status).toMatch(/EDITOR_REVIEW|REVISION_REQUESTED/);
      });
  });

  it("applies board voting with quorum and creates audit-backed state changes", async () => {
    await ProposalModel.create({
      id: "p-integration-board",
      title: "Integration Board",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Integration board proof.",
      status: "PENDING_BOARD",
      currentVersion: 1,
      manuscripts: [{ id: "ms-integration-board", version: 1 }],
      requestedPublicationType: "WEEKLY",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const chair = await loginAs("board@beachread.jp");
    const board2 = await loginAs("sato@beachread.jp");
    const board3 = await loginAs("kobayashi@beachread.jp");
    const session = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ proposalId: "p-integration-board", proposalVersionId: "1" })
      .expect(201);
    const sessionId = session.body.data.id;

    await request(createApp())
      .post("/api/board/series/p-integration-board/votes")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ value: "APPROVE", sessionId })
      .expect(200);
    await request(createApp())
      .post("/api/board/series/p-integration-board/votes")
      .set("Authorization", `Bearer ${board2.accessToken}`)
      .send({ value: "APPROVE", sessionId })
      .expect(200);
    await request(createApp())
      .post("/api/board/series/p-integration-board/votes")
      .set("Authorization", `Bearer ${board3.accessToken}`)
      .send({ value: "APPROVE", note: "The concept is production-ready.", sessionId })
      .expect(200);

    const response = await request(createApp())
      .post(`/api/voting-sessions/${sessionId}/close`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({})
      .expect(200);

    expect(response.body.data.status).toBe("FINALIZED");
    expect(response.body.data.result).toBe("APPROVED");
  });

  it("normalizes AI bridge responses without storing base64 output", async () => {
    const server = http.createServer((req, res) => {
      res.setHeader("Content-Type", "application/json");
      if (req.url === "/health") {
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }
      if (req.url === "/bubble/detect" && req.method === "POST") {
        req.resume();
        res.end(
          JSON.stringify({ bubbles: [{ x: 1, y: 2, w: 3, h: 4 }], image_base64: "do-not-return" }),
        );
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "missing" }));
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected test server port.");

    try {
      const editor = await loginAs("tanaka@beachread.jp");
      await request(createApp({ aiServiceUrl: `http://127.0.0.1:${address.port}` }))
        .post("/api/ai/bubbles/detect")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .attach("file", Buffer.from("fake-image"), "page.png")
        .expect(200)
        .expect((response) => {
          expect(response.body.data.bubbles).toHaveLength(1);
          expect(response.body.data.image_base64).toBeUndefined();
        });

      const record = (await AiProcessingModel.findOne({ action: "bubble.detect" }).lean()) as any;
      expect(JSON.stringify(record?.metadata)).not.toContain("do-not-return");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("issues scoped backend display URLs and streams uploaded Studio page files", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const assistant = await loginAs("jun@beachread.jp");
    const uploaded = await createUploadedPage(mangaka.accessToken, "pg-display-test");

    const assistantDisplay = await request(createApp())
      .post("/api/files/display-url")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ key: uploaded.key, fileName: "pg-display-test.png" });
    expect(assistantDisplay.status).toBe(200);

    const display = await request(createApp())
      .post("/api/files/display-url")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ key: uploaded.key, fileName: "pg-display-test.png" })
      .expect(200);

    const displayPath = new URL(display.body.data.url, "http://localhost:3001").pathname;
    await request(createApp())
      .get(displayPath)
      .expect("Content-Type", /image\/png/)
      .expect(200)
      .expect((response) => {
        expect(response.body.toString()).toBe("fake-png-bytes");
      });
  });

  it("runs page-aware AI detection, persists regions once, and strips base64 metadata", async () => {
    const server = http.createServer((req, res) => {
      res.setHeader("Content-Type", "application/json");
      if (req.url === "/bubble/detect" && req.method === "POST") {
        req.resume();
        res.end(
          JSON.stringify({
            bubble_count: 1,
            image_base64: "do-not-store",
            bubbles: [
              {
                id: 1,
                bbox: { x: 12, y: 24, width: 120, height: 60 },
                confidence: 0.91,
                has_mask: true,
              },
            ],
          }),
        );
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "missing" }));
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected test server port.");

    try {
      const mangaka = await loginAs("inoue@beachread.jp");
      const uploaded = await createUploadedPage(mangaka.accessToken, "pg-ai-detect-test");
      const app = createApp({ aiServiceUrl: `http://127.0.0.1:${address.port}` });

      await request(app)
        .post(`/api/studio/pages/${uploaded.pageId}/ai/detect-bubbles`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({})
        .expect(200)
        .expect((response) => {
          expect(response.body.data.regions).toHaveLength(1);
          expect(response.body.data.regions[0].metadata.source).toBe("ai");
        });

      await request(app)
        .post(`/api/studio/pages/${uploaded.pageId}/ai/detect-bubbles`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({})
        .expect(200);

      const regions = await StudioRegionModel.find({
        pageId: uploaded.pageId,
        "metadata.source": "ai",
      }).lean();
      expect(regions).toHaveLength(1);

      const record = (await AiProcessingModel.findOne({
        action: "studio.page.bubble.detect",
      }).lean()) as any;
      expect(JSON.stringify(record?.metadata)).not.toContain("do-not-store");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("runs page-aware AI whitening and stores a real page variant file", async () => {
    const server = http.createServer((req, res) => {
      if (req.url === "/bubble/whiten" && req.method === "POST") {
        req.resume();
        res.setHeader("Content-Type", "image/png");
        res.end(Buffer.from("whitened-png-bytes"));
        return;
      }
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "missing" }));
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected test server port.");

    try {
      const mangaka = await loginAs("inoue@beachread.jp");
      const uploaded = await createUploadedPage(mangaka.accessToken, "pg-ai-whiten-test");
      const app = createApp({ aiServiceUrl: `http://127.0.0.1:${address.port}` });

      const whiten = await request(app)
        .post(`/api/studio/pages/${uploaded.pageId}/ai/whiten-bubbles`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({})
        .expect(200);

      expect(whiten.body.data.fileKey).toContain("whitened.png");
      const chapter = (await ChapterModel.findOne({ "pages.id": uploaded.pageId }).lean()) as any;
      const page = chapter.pages.find((item: any) => item.id === uploaded.pageId);
      expect(page.metadata.aiWhitened.fileKey).toBe(whiten.body.data.fileKey);

      const displayPath = new URL(whiten.body.data.fileUrl, "http://localhost:3001").pathname;
      await request(createApp())
        .get(displayPath)
        .expect("Content-Type", /image\/png/)
        .expect(200)
        .expect((response) => {
          expect(response.body.toString()).toBe("whitened-png-bytes");
        });
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("returns my chapters filtered by role via /chapters?mine=true", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const response = await request(createApp())
      .get("/api/chapters?mine=true")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    expect(response.body.data).toEqual(expect.any(Array));
    for (const ch of response.body.data) {
      expect(["TANTOU_REVIEW", "READY_FOR_PUBLICATION", "PUBLISHED"]).toContain(ch.status);
    }

    const mangaka = await loginAs("inoue@beachread.jp");
    const mangakaRes = await request(createApp())
      .get("/api/chapters?mine=true")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);

    for (const ch of mangakaRes.body.data) {
      expect(ch.assigneeId).toBe(mangaka.user.id);
      expect(["PLANNED", "IN_PRODUCTION", "REVISION_REQUIRED"]).toContain(ch.status);
    }
  });

  it("rejects invalid body with 400 and validation error", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const mangaka = await loginAs("inoue@beachread.jp");

    // POST /proposals with invalid title type (Mangaka-only authorship).
    await request(createApp())
      .post("/api/proposals")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ title: 12345 })
      .expect(400);

    // Series is provisioned automatically after finalized Board approval.
    const removedSeriesRoute = await request(createApp())
      .post("/api/series")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ title: 12345 })
      .expect(404);
    expect(removedSeriesRoute.body.code).toBe("NOT_FOUND");

    // POST /materials accepts a minimal valid owned target.
    const matRes = await request(createApp())
      .post("/api/materials")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ seriesId: "s-berserk-prod", title: "Integration material" })
      .expect(201);
    expect(matRes.body.data.id).toBeDefined();
  });

  it("blocks protected fields on PATCH /series/:id", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    // Series creation now requires a Board-approved proposal; insert a series
    // fixture directly since this test only exercises PATCH guardrails.
    const seriesId = "s-patch-guardrails";
    await SeriesModel.create({
      id: seriesId,
      slug: seriesId,
      title: "Validation test series",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      editorId: "u-editor",
      editorName: "Tanaka Akira",
      status: "PLANNING",
    });

    // PATCH with protected field should be rejected
    await request(createApp())
      .patch(`/api/series/${seriesId}`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ authorId: "hacked", createdAt: "2020-01-01" })
      .expect(400);

    // PATCH with allowed fields should succeed
    await request(createApp())
      .patch(`/api/series/${seriesId}`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ title: "Updated title" })
      .expect(200);
  });
});
