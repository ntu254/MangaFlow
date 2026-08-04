import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { StudioCommentModel, AuditEntryModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";
import { resolveComment, reopenComment } from "../services/comment-lifecycle.service.js";
import type { AuthedRequest } from "../types.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string; role: string } };
}

async function createComment(overrides: Record<string, unknown> = {}) {
  const id = `cmt-${Math.random().toString(36).slice(2, 10)}`;
  await StudioCommentModel.create({
    id,
    seriesId: "s-berserk-prod",
    chapterId: "ch-s-berserk-prod-5",
    authorId: "u-editor",
    authorName: "Tanaka Akira",
    authorRole: "editor",
    body: "Fix the speech bubble on page 1",
    status: "OPEN",
    isBlocking: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });
  return id;
}

describe("COM-001 — Comment reopen + resolution metadata", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => {
    await seedDatabase();
    await StudioCommentModel.deleteMany({});
    await AuditEntryModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("captures resolvedBy / resolvedAt when an Editor resolves a blocking comment", async () => {
    const commentId = await createComment();
    const editor = await loginAs("tanaka@beachread.jp");
    const req = { actor: { id: "u-editor", name: "Tanaka Akira", role: "EDITOR" } } as AuthedRequest;

    const updated = await resolveComment(req, editor.user as any, commentId, {
      note: "Speech bubble cleaned",
    });

    expect(updated.status).toBe("RESOLVED");
    expect(updated.resolvedById).toBe("u-editor");
    expect(updated.resolvedByName).toBe("Tanaka Akira");
    expect(updated.resolvedAt).toBeInstanceOf(Date);
    expect(updated.resolutionNote).toBe("Speech bubble cleaned");

    const audit = await AuditEntryModel.findOne({ entityId: commentId, action: "comment.resolved" }).lean();
    expect(audit).toBeTruthy();
  });

  it("blocks a non-Editor from resolving a blocking Editor-authored comment", async () => {
    const commentId = await createComment();
    const mangaka = await loginAs("inoue@beachread.jp");
    const req = { actor: { id: "u-mangaka", name: "Inoue Takehiko", role: "MANGAKA" } } as AuthedRequest;

    await expect(
      resolveComment(req, mangaka.user as any, commentId),
    ).rejects.toMatchObject({
      status: 403,
      code: "REVIEWER_RESOLVE_REQUIRED",
    });
  });

  it("allows a non-Editor to resolve an OPEN, non-blocking comment", async () => {
    const commentId = await createComment({ isBlocking: false });
    const mangaka = await loginAs("inoue@beachread.jp");
    const req = { actor: { id: "u-mangaka", name: "Inoue Takehiko", role: "MANGAKA" } } as AuthedRequest;

    const updated = await resolveComment(req, mangaka.user as any, commentId);
    expect(updated.status).toBe("RESOLVED");
    expect(updated.resolvedById).toBe("u-mangaka");
  });

  it("rejects reopening when no reason is provided", async () => {
    const commentId = await createComment();
    const editor = await loginAs("tanaka@beachread.jp");
    const req = { actor: { id: "u-editor", name: "Tanaka Akira", role: "EDITOR" } } as AuthedRequest;
    await resolveComment(req, editor.user as any, commentId);

    await expect(
      reopenComment(req, editor.user as any, commentId, { reason: "  " }),
    ).rejects.toMatchObject({
      status: 400,
      code: "REASON_REQUIRED",
    });
  });

  it("reopens a resolved comment with REOPENED status and a captured reason", async () => {
    const commentId = await createComment();
    const editor = await loginAs("tanaka@beachread.jp");
    const req = { actor: { id: "u-editor", name: "Tanaka Akira", role: "EDITOR" } } as AuthedRequest;
    await resolveComment(req, editor.user as any, commentId);

    const updated = await reopenComment(req, editor.user as any, commentId, {
      reason: "Bubble still misaligned after export",
    });
    expect(updated.status).toBe("REOPENED");
    expect(updated.reopenedById).toBe("u-editor");
    expect(updated.reopenedByName).toBe("Tanaka Akira");
    expect(updated.reopenedAt).toBeInstanceOf(Date);
    expect(updated.resolutionNote).toMatch(/Reopened:/);

    const audit = await AuditEntryModel.findOne({ entityId: commentId, action: "comment.reopened" }).lean();
    expect(audit).toBeTruthy();
    expect((audit?.metadata as any)?.reason).toContain("misaligned");
  });

  it("refuses to reopen a comment that is not RESOLVED", async () => {
    const commentId = await createComment();
    const editor = await loginAs("tanaka@beachread.jp");
    const req = { actor: { id: "u-editor", name: "Tanaka Akira", role: "EDITOR" } } as AuthedRequest;

    await expect(
      reopenComment(req, editor.user as any, commentId, { reason: "Not yet resolved" }),
    ).rejects.toMatchObject({
      status: 409,
      code: "COMMENT_NOT_RESOLVED",
    });
  });

  it("refuses to resolve a comment that is already RESOLVED", async () => {
    const commentId = await createComment();
    const editor = await loginAs("tanaka@beachread.jp");
    const req = { actor: { id: "u-editor", name: "Tanaka Akira", role: "EDITOR" } } as AuthedRequest;
    await resolveComment(req, editor.user as any, commentId);

    await expect(
      resolveComment(req, editor.user as any, commentId, { note: "Double check" }),
    ).rejects.toMatchObject({
      status: 409,
      code: "COMMENT_ALREADY_RESOLVED",
    });
  });
});