import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { MaterialModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";
import { isMaterialTransitionAllowed } from "../services/material-status.service.js";

let mongo: MongoMemoryServer;

async function loginAs(email: string) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password: email })
    .expect(200);
  return response.body.data as { accessToken: string };
}

async function createMaterial(accessToken: string) {
  const response = await request(createApp())
    .post("/api/materials")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ seriesId: "s-berserk-prod", title: "Transition fixture", kind: "reference" })
    .expect(201);
  return response.body.data.id as string;
}

describe("canonical Material status transitions", () => {
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

  it("allows only the documented transition matrix", () => {
    expect(isMaterialTransitionAllowed("DRAFT", "ACTIVE")).toBe(true);
    expect(isMaterialTransitionAllowed("ACTIVE", "IN_REVIEW")).toBe(true);
    expect(isMaterialTransitionAllowed("IN_REVIEW", "ACTIVE")).toBe(true);
    expect(isMaterialTransitionAllowed("ACTIVE", "APPROVED")).toBe(true);
    expect(isMaterialTransitionAllowed("IN_REVIEW", "APPROVED")).toBe(true);
    expect(isMaterialTransitionAllowed("DRAFT", "APPROVED")).toBe(false);
    expect(isMaterialTransitionAllowed("APPROVED", "ACTIVE")).toBe(false);
    expect(isMaterialTransitionAllowed("ARCHIVED", "ACTIVE")).toBe(false);
  });

  it("supports owner review submission and revision return without metadata status", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const mangaka = await loginAs("inoue@beachread.jp");
    const materialId = await createMaterial(editor.accessToken);

    await request(createApp())
      .patch(`/api/materials/${materialId}`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ status: "ACTIVE" })
      .expect(200);
    const inReview = await request(createApp())
      .patch(`/api/materials/${materialId}`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ status: "IN_REVIEW" })
      .expect(200);
    expect(inReview.body.data.status).toBe("IN_REVIEW");
    const activeAgain = await request(createApp())
      .patch(`/api/materials/${materialId}`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ status: "ACTIVE" })
      .expect(200);
    expect(activeAgain.body.data.status).toBe("ACTIVE");
    expect(activeAgain.body.data.metadata?.status).toBeUndefined();
  });

  it("requires assigned Tantou for approval and rejects direct DRAFT approval", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const mangaka = await loginAs("inoue@beachread.jp");
    const materialId = await createMaterial(editor.accessToken);

    const direct = await request(createApp())
      .patch(`/api/materials/${materialId}`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ status: "APPROVED" })
      .expect(409);
    expect(direct.body.code).toBe("INVALID_TRANSITION");

    await request(createApp())
      .patch(`/api/materials/${materialId}`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ status: "ACTIVE" })
      .expect(200);
    const forbidden = await request(createApp())
      .patch(`/api/materials/${materialId}`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ status: "APPROVED" })
      .expect(403);
    expect(forbidden.body.code).toBe("TANTOU_ASSIGNMENT_REQUIRED");

    await request(createApp())
      .patch(`/api/materials/${materialId}`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ status: "APPROVED" })
      .expect(200);
  });

  it("does not append a working version to an approved Material", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const materialId = await createMaterial(editor.accessToken);
    await request(createApp())
      .patch(`/api/materials/${materialId}`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ status: "ACTIVE" })
      .expect(200);
    await request(createApp())
      .patch(`/api/materials/${materialId}`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ status: "APPROVED" })
      .expect(200);

    const response = await request(createApp())
      .post(`/api/materials/${materialId}/versions`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ fileKey: "materials/replacement.png" })
      .expect(409);
    expect(response.body.code).toBe("APPROVED_MATERIAL_IMMUTABLE");
    const approved = (await MaterialModel.findOne({ id: materialId }).lean() as any);
    expect(approved?.versions ?? []).toHaveLength(0);
    expect(approved?.currentVersion).toBeUndefined();
  });

  it("does not delete an approved Material that must remain auditable", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const materialId = await createMaterial(editor.accessToken);
    await request(createApp())
      .patch(`/api/materials/${materialId}`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ status: "ACTIVE" })
      .expect(200);
    await request(createApp())
      .patch(`/api/materials/${materialId}`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ status: "APPROVED" })
      .expect(200);

    const response = await request(createApp())
      .delete(`/api/materials/${materialId}`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(409);
    expect(response.body.code).toBe("APPROVED_MATERIAL_IMMUTABLE");
    expect(await MaterialModel.exists({ id: materialId })).not.toBeNull();
  });
});
