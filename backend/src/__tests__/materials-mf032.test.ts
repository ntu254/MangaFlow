import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { MaterialModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryServer;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; refreshToken: string; user: { id: string; role: string } };
}

describe("MF-032 Material R2 file persistence", () => {
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

  it("persists a created material with R2 fileKey metadata and survives a re-fetch", async () => {
    const editor = await loginAs("tanaka@beachread.jp");

    const createRes = await request(createApp())
      .post("/api/materials")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({
        seriesId: "s-berserk-prod",
        title: "MF-032 Reference Sheet",
        kind: "reference",
        tags: ["props", "weapons"],
        fileKey: "materials/mf-032-file-1-reference-sheet.png",
        url: "https://pub.example.com/materials/mf-032-file-1-reference-sheet.png",
        mimeType: "image/png",
        size: 123456,
        metadata: { status: "DRAFT", fileName: "reference_sheet.png", fileType: "image/png" },
      })
      .expect(201);

    const materialId = createRes.body.data.id;
    expect(createRes.body.data.fileKey).toBe("materials/mf-032-file-1-reference-sheet.png");
    expect(createRes.body.data.url).toMatch(/reference-sheet\.png$/);
    expect(createRes.body.data.versions).toHaveLength(1);
    expect(createRes.body.data.versions[0].fileKey).toBeDefined();
    expect(createRes.body.data.versions[0].url).toBeDefined();

    // Re-fetch via series-scoped list to prove persistence (refresh scenario).
    const listRes = await request(createApp())
      .get("/api/materials?seriesId=s-berserk-prod")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    const found = listRes.body.data.find((m: any) => m.id === materialId);
    expect(found).toBeDefined();
    expect(found.fileKey).toBe("materials/mf-032-file-1-reference-sheet.png");
    expect(found.url).toMatch(/reference-sheet\.png$/);
    expect(found.metadata?.status).toBe("DRAFT");

    // No blob: URL is ever persisted.
    const allUrls = JSON.stringify(listRes.body.data);
    expect(allUrls).not.toContain("blob:");
  });

  it("adds a material version with R2 metadata and sees currentVersion increment", async () => {
    const editor = await loginAs("tanaka@beachread.jp");

    const createRes = await request(createApp())
      .post("/api/materials")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({
        seriesId: "s-berserk-prod",
        title: "MF-032 Versioned Doc",
        kind: "manuscript",
        fileKey: "materials/mf-032-doc-v1.pdf",
        url: "https://pub.example.com/materials/mf-032-doc-v1.pdf",
        mimeType: "application/pdf",
        size: 5000,
        metadata: { status: "IN_REVIEW", fileName: "doc_v1.pdf", fileType: "application/pdf" },
      })
      .expect(201);

    const materialId = createRes.body.data.id;

    const versionRes = await request(createApp())
      .post(`/api/materials/${materialId}/versions`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({
        fileKey: "materials/mf-032-doc-v2.pdf",
        url: "https://pub.example.com/materials/mf-032-doc-v2.pdf",
        mimeType: "application/pdf",
        size: 7200,
        note: "Updated 3 pages",
        metadata: { fileName: "doc_v2.pdf", fileType: "application/pdf" },
      })
      .expect(200);

    expect(versionRes.body.data.currentVersion).toBe(2);
    expect(versionRes.body.data.versions).toHaveLength(2);
    const v2 = versionRes.body.data.versions.find((v: any) => v.version === 2);
    expect(v2.fileKey).toBe("materials/mf-032-doc-v2.pdf");
    expect(v2.note).toBe("Updated 3 pages");
    expect(v2.metadata?.fileName).toBe("doc_v2.pdf");

    // Refresh-proof: re-fetch and the second version is still present.
    const refetched = await MaterialModel.findOne({ id: materialId }).lean() as any;
    expect(refetched?.versions).toHaveLength(2);
    expect(refetched?.currentVersion).toBe(2);
  });

  it("deletes a material by id", async () => {
    const editor = await loginAs("tanaka@beachread.jp");

    const createRes = await request(createApp())
      .post("/api/materials")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({
        seriesId: "s-berserk-prod",
        title: "MF-032 Disposable",
        fileKey: "materials/mf-032-disposable.png",
        url: "https://pub.example.com/materials/mf-032-disposable.png",
        mimeType: "image/png",
        size: 100,
      })
      .expect(201);

    const materialId = createRes.body.data.id;

    await request(createApp())
      .delete(`/api/materials/${materialId}`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    const stillThere = await MaterialModel.findOne({ id: materialId }).lean();
    expect(stillThere).toBeNull();

    // A subsequent get via list does not surface the deleted material.
    const listRes = await request(createApp())
      .get("/api/materials?seriesId=s-berserk-prod")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);
    expect(listRes.body.data.find((m: any) => m.id === materialId)).toBeUndefined();
  });
});
