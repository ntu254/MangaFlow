import http from "node:http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import { ProposalModel, StudioTaskModel, SubmissionModel } from "../db/models.js";

let mongo: MongoMemoryServer;

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

describe("MF-022 Backend Validation & Mass Assignment Guardrails", () => {
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

  it("rejects PATCH /series/:id with protected fields", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const res = await request(createApp())
      .post("/api/series")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ title: "MF-022 test series" })
      .expect(201);
    const seriesId = res.body.data.id;

    const patchRes = await request(createApp())
      .patch(`/api/series/${seriesId}`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ authorId: "hacked", createdAt: "2020-01-01" })
      .expect(400);
    expect(patchRes.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects PATCH /series/:id with invalid field type", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const res = await request(createApp())
      .post("/api/series")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ title: "MF-022 type test" })
      .expect(201);
    const seriesId = res.body.data.id;

    await request(createApp())
      .patch(`/api/series/${seriesId}`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ title: 12345 })
      .expect(400);
  });

  it("rejects POST /materials with unknown fields when strict schema is applied", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const res = await request(createApp())
      .post("/api/materials")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(201);

    const materialId = res.body.data.id;
    const patchRes = await request(createApp())
      .patch(`/api/materials/${materialId}`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ authorId: "hacked", status: "APPROVED" })
      .expect(400);
    expect(patchRes.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects PATCH /regions with workflow status fields", async () => {
    const editor = await loginAs("tanaka@beachread.jp");

    const patchRes = await request(createApp())
      .patch("/api/studio/regions/nonexistent-id")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ status: "APPROVED" })
      .expect(400);
    expect(patchRes.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects voting session creation with unknown fields", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const res = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ seriesId: "s-demo-1", unknownField: "bad" })
      .expect(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects review actions with unknown fields via strict schema", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const res = await request(createApp())
      .get("/api/submissions")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);
    const submission = res.body.data[0];
    if (!submission) return;

    const approveRes = await request(createApp())
      .post(`/api/submissions/${submission.id}/approve`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ badField: "hacked" })
      .expect(400);
    expect(approveRes.body.code).toBe("VALIDATION_ERROR");
  });

  it("blocks ASSISTANT from submission review actions (RBAC)", async () => {
    const assistant = await loginAs("sato@beachread.jp");
    const res = await request(createApp())
      .get("/api/submissions")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(200);
    const submission = res.body.data[0];
    if (!submission) return;

    const approveRes = await request(createApp())
      .post(`/api/submissions/${submission.id}/approve`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(403);
    expect(approveRes.body.code).toBe("FORBIDDEN");
  });

  it("blocks non-editor/non-mangaka from material creation (RBAC)", async () => {
    const assistant = await loginAs("sato@beachread.jp");
    await request(createApp())
      .post("/api/materials")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ title: "Should fail" })
      .expect(403);
  });

  it("blocks non-editor/non-mangaka from studio region creation (RBAC)", async () => {
    const assistant = await loginAs("sato@beachread.jp");
    await request(createApp())
      .post("/api/studio/regions")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ seriesId: "s-demo-1", chapterId: "ch-1-1", pageId: "page-1", type: "BUBBLE" })
      .expect(403);
  });

  it("blocks non-editor/non-mangaka from chapter PATCH (RBAC)", async () => {
    const assistant = await loginAs("sato@beachread.jp");
    await request(createApp())
      .patch("/api/chapters/ch-1-1")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ title: "Hacked title" })
      .expect(403);
  });

  it("blocks non-owner from reading notifications (ownership check)", async () => {
    const assistant = await loginAs("sato@beachread.jp");
    const notifRes = await request(createApp())
      .get("/api/notifications")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(200);
    const notification = notifRes.body.data[0];
    if (!notification) return;

    const editor = await loginAs("tanaka@beachread.jp");
    await request(createApp())
      .patch(`/api/notifications/${notification.id}/read`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(403);
  });

  // MF-015: Proposal live API tests

  it("GET /api/proposals/:id returns proposal", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const listRes = await request(createApp())
      .get("/api/proposals")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);
    const proposal = listRes.body.data[0];
    if (!proposal) return;

    const getRes = await request(createApp())
      .get(`/api/proposals/${proposal.id}`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);
    expect(getRes.body.data.id).toBe(proposal.id);
  });

  it("POST /api/proposals creates unique non-empty slugs for duplicate titles", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const create = () =>
      request(createApp())
        .post("/api/proposals")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ title: "Duplicate proposal title", slug: "" })
        .expect(201);

    const first = await create();
    const second = await create();

    expect(first.body.data.slug).toMatch(/^duplicate-proposal-title-/);
    expect(second.body.data.slug).toMatch(/^duplicate-proposal-title-/);
    expect(first.body.data.slug).not.toBe(second.body.data.slug);
  });

  it("RESUBMIT persists the revised proposal, real files, and resolved checklist", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await ProposalModel.create({
      id: "p-full-revision-test",
      slug: "full-revision-test",
      title: "Original title",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Original synopsis",
      genres: ["Drama"],
      targetAudience: "seinen",
      chaptersPlanned: 12,
      coverUrl: "metadata://old-cover",
      sampleChapterUrl: "metadata://old-sample",
      status: "CHANGES_REQUESTED",
      manuscripts: [],
      materials: [],
      requestedChanges: [
        {
          id: "rc-full-revision",
          editorId: "u-editor",
          editorName: "Tanaka Akira",
          comment: "Revise the pitch and manuscript.",
          createdAt: new Date().toISOString(),
          items: [{ id: "rci-full-revision", text: "Update manuscript", resolved: false }],
        },
      ],
      revisionRound: 1,
    });

    const response = await request(createApp())
      .post("/api/proposals/p-full-revision-test/actions/RESUBMIT")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({
        title: "Revised title",
        synopsis:
          "This revised synopsis is intentionally long enough to represent the complete updated pitch.",
        genres: ["Drama", "Action"],
        targetAudience: "seinen",
        chaptersPlanned: 24,
        coverUrl: "metadata://new-cover",
        sampleChapterUrl: "metadata://new-sample",
        logline: "A revised logline.",
        hook: "A revised hook.",
        mainCharacters: "Revised character notes.",
        originalWorkConfirmed: true,
        submissionNote: "Addressed the editor feedback.",
        advanced: { productionPlan: "Two chapters per month." },
        manuscript: {
          fileName: "revision.pdf",
          fileUrl: "metadata://revision.pdf",
          fileType: "application/pdf",
          sizeKB: 512,
        },
        materials: [
          {
            kind: "character",
            title: "Revised character sheet",
            fileName: "characters.png",
            fileUrl: "metadata://characters.png",
            fileType: "image/png",
            sizeKB: 128,
          },
        ],
        resolvedItems: {
          "rci-full-revision": { resolved: true, response: "Uploaded the revised manuscript." },
        },
        comment: "Ready for another review.",
      })
      .expect(200);

    expect(response.body.data.status).toBe("RESUBMITTED");
    expect(response.body.data.title).toBe("Revised title");
    expect(response.body.data.manuscripts).toHaveLength(1);
    expect(response.body.data.manuscripts[0].fileUrl).toBe("metadata://revision.pdf");
    expect(response.body.data.materials).toHaveLength(1);
    expect(response.body.data.requestedChanges[0].resolvedAt).toBeTruthy();
    expect(response.body.data.requestedChanges[0].items[0].response).toBe(
      "Uploaded the revised manuscript.",
    );

    const editor = await loginAs("tanaka@beachread.jp");
    const nextReview = await request(createApp())
      .post("/api/proposals/p-full-revision-test/actions/REQUEST_CHANGES")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ comment: "Please tighten the revised ending." })
      .expect(200);
    expect(nextReview.body.data.status).toBe("CHANGES_REQUESTED");
  });

  it("PATCH /api/proposals/:id rejects protected fields", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const listRes = await request(createApp())
      .get("/api/proposals")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);
    const proposal = listRes.body.data.find((p: any) => p.status === "DRAFT");
    if (!proposal) return;

    await request(createApp())
      .patch(`/api/proposals/${proposal.id}`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ authorId: "hacked", status: "APPROVED" })
      .expect(400);
  });

  it("PATCH /api/proposals/:id saves full revision content without resubmitting", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await ProposalModel.create({
      id: "p-edit-revision-test",
      slug: "edit-revision-test",
      title: "Before edit",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Before edit synopsis",
      genres: ["Drama"],
      targetAudience: "seinen",
      chaptersPlanned: 12,
      coverUrl: "metadata://cover-old",
      sampleChapterUrl: "metadata://manuscript-old",
      status: "CHANGES_REQUESTED",
      manuscripts: [
        {
          id: "mv-edit-old",
          version: 1,
          fileName: "old.pdf",
          fileUrl: "metadata://manuscript-old",
          fileType: "application/pdf",
          sizeKB: 100,
        },
      ],
      materials: [],
      requestedChanges: [],
      revisionRound: 1,
    });

    const response = await request(createApp())
      .patch("/api/proposals/p-edit-revision-test")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({
        title: "After edit",
        synopsis: "After edit synopsis with the complete revised proposal content.",
        logline: "Updated logline",
        hook: "Updated hook",
        mainCharacters: "Updated characters",
        genres: ["Drama", "Action"],
        targetAudience: "seinen",
        chaptersPlanned: 24,
        coverUrl: "metadata://cover-new",
        sampleChapterUrl: "metadata://manuscript-new",
        originalWorkConfirmed: true,
        submissionNote: "Saved before resubmitting.",
        advanced: { productionPlan: "Monthly" },
        manuscripts: [
          {
            id: "mv-edit-old",
            version: 1,
            fileName: "old.pdf",
            fileUrl: "metadata://manuscript-old",
            fileType: "application/pdf",
            sizeKB: 100,
          },
          {
            id: "mv-edit-new",
            version: 2,
            fileName: "new.pdf",
            fileUrl: "metadata://manuscript-new",
            fileType: "application/pdf",
            sizeKB: 200,
          },
        ],
        materials: [],
      })
      .expect(200);

    expect(response.body.data.status).toBe("CHANGES_REQUESTED");
    expect(response.body.data.title).toBe("After edit");
    expect(response.body.data.manuscripts).toHaveLength(2);
    expect(response.body.data.manuscripts[1].fileUrl).toBe("metadata://manuscript-new");
  });

  it("PATCH /api/proposals/:id rejects edits outside draft or revision", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .patch("/api/proposals/p-002")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ title: "Must not change" })
      .expect(409);
  });

  it("POST /api/proposals/:id/actions/SUBMIT works from DRAFT for author", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const listRes = await request(createApp())
      .get("/api/proposals")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);
    const proposal = listRes.body.data.find((p: any) => p.status === "DRAFT");
    if (!proposal) return;

    const actionRes = await request(createApp())
      .post(`/api/proposals/${proposal.id}/actions/SUBMIT`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({})
      .expect(200);
    expect(actionRes.body.data.status).toBe("PENDING_EDITOR");
  });

  it("POST /api/proposals/:id/actions/SUBMIT rejects invalid transition", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const listRes = await request(createApp())
      .get("/api/proposals")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);
    const proposal = listRes.body.data.find((p: any) => p.status === "PENDING_EDITOR");
    if (!proposal) return;

    await request(createApp())
      .post(`/api/proposals/${proposal.id}/actions/SUBMIT`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({})
      .expect(409);
  });

  it("allows the claiming editor to forward an EDITOR_REVIEWING proposal", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    await ProposalModel.create({
      id: "p-claim-forward-test",
      slug: "claim-forward-test",
      title: "Claim then forward",
      authorId: "u-mangaka",
      authorName: "Mangaka",
      status: "PENDING_EDITOR",
    });

    const claim = await request(createApp())
      .post("/api/proposals/p-claim-forward-test/actions/CLAIM")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200);
    expect(claim.body.data.status).toBe("EDITOR_REVIEWING");

    const forward = await request(createApp())
      .post("/api/proposals/p-claim-forward-test/actions/FORWARD")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200);
    expect(forward.body.data.status).toBe("PENDING_BOARD");
  });

  it("GET /api/proposals/:id returns 404 for nonexistent proposal", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .get("/api/proposals/nonexistent-id")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(404);
  });
});

describe("MF-027 Assistant Task Studio Live Submission Flow", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await seedDatabase();
    // Seed a task assigned to u-assist (jun@beachread.jp)
    await StudioTaskModel.create({
      id: "tsk-mf027-test",
      title: "MF-027 Test Task",
      chapterId: "ch-s-berserk-prod-4",
      pageId: "pg-001",
      status: "IN_PROGRESS",
      assigneeId: "u-assist",
      assigneeName: "Suzuki Jun",
      type: "character",
      priority: "normal",
      dueAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      instructions: "Test task for MF-027",
      createdAt: new Date().toISOString(),
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("ASSISTANT can create a submission via POST /api/submissions", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    const res = await request(createApp())
      .post("/api/submissions")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({
        taskId: "tsk-mf027-test",
        notes: "Test submission from assistant",
        fileKey: "test-file.png",
        intent: "SUBMIT",
      })
      .expect(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.taskId).toBe("tsk-mf027-test");
    expect(res.body.data.assistantId).toBe("u-assist");
    expect(res.body.data.assistantName).toBe("Suzuki Jun");
    expect(res.body.data.version).toBe(1);
    expect(res.body.data.versionLabel).toBe("v1");
    expect(res.body.data.status).toBe("PENDING");
    expect(res.body.data.submittedAt).toBeDefined();
  });

  it("ASSISTANT can create a submitted work item visible to live review filters", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    const createRes = await request(createApp())
      .post("/api/submissions")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({
        taskId: "tsk-mf027-test",
        notes: "Submitted from Task Studio",
        fileKey: "submitted-file.png",
        intent: "SUBMIT",
      })
      .expect(201);

    expect(createRes.body.data.assistantId).toBe("u-assist");
    expect(createRes.body.data.status).toBe("PENDING");

    const listRes = await request(createApp())
      .get("/api/submissions?assistantId=u-assist&status=PENDING")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(200);
    expect(listRes.body.data.some((sub: any) => sub.id === createRes.body.data.id)).toBe(true);
  });

  it("GET /api/submissions lists all submissions", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    const res = await request(createApp())
      .get("/api/submissions")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/submissions filters by assistantId", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    const me = await request(createApp())
      .get("/api/me/bootstrap")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(200);
    const assistantId = me.body.data.user.id;

    // Create a submission first
    await request(createApp())
      .post("/api/submissions")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ taskId: "tsk-mf027-test", notes: "filter test" })
      .expect(201);

    const res = await request(createApp())
      .get(`/api/submissions?assistantId=${assistantId}`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const sub of res.body.data) {
      expect(sub.assistantId).toBe(assistantId);
    }
  });

  it("GET /api/tasks/:taskId/submissions returns submissions for a task", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    // Create a submission first
    await request(createApp())
      .post("/api/submissions")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ taskId: "tsk-mf027-test", notes: "task submissions test" })
      .expect(201);

    const res = await request(createApp())
      .get("/api/tasks/tsk-mf027-test/submissions")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("ASSISTANT cannot approve their own submission (RBAC)", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    const createRes = await request(createApp())
      .post("/api/submissions")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ taskId: "tsk-mf027-test", notes: "test self-approve" })
      .expect(201);
    const subId = createRes.body.data.id;

    await request(createApp())
      .post(`/api/submissions/${subId}/approve`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(403);
  });

  it("MANGAKA can approve a submission", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    const mangaka = await loginAs("inoue@beachread.jp");
    const createRes = await request(createApp())
      .post("/api/submissions")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ taskId: "tsk-mf027-test", notes: "test approve" })
      .expect(201);
    const subId = createRes.body.data.id;

    const approveRes = await request(createApp())
      .post(`/api/submissions/${subId}/approve`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ reviewerNote: "Looks good!" })
      .expect(200);
    expect(approveRes.body.data.status).toBe("MANGAKA_APPROVED");
  });

  it("MANGAKA can request revision on a submission", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    const mangaka = await loginAs("inoue@beachread.jp");
    const createRes = await request(createApp())
      .post("/api/submissions")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ taskId: "tsk-mf027-test", notes: "test revision" })
      .expect(201);
    const subId = createRes.body.data.id;

    const revRes = await request(createApp())
      .post(`/api/submissions/${subId}/request-revision`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ reviewerNote: "Please fix the linework." })
      .expect(200);
    expect(revRes.body.data.status).toBe("MANGAKA_REVISION_REQUESTED");
  });

  it("submission creation rejects unknown fields via strict schema", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    await request(createApp())
      .post("/api/submissions")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ taskId: "tsk-mf027-test", hackerField: "evil", anotherBad: 123 })
      .expect(400);
  });
});

describe("MF-028 Mangaka Review Queue Live Submission Review", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await seedDatabase();
    // Seed tasks for review queue tests
    await StudioTaskModel.create({
      id: "tsk-review-q",
      title: "Review Queue Task",
      chapterId: "ch-s-berserk-prod-4",
      pageId: "pg-001",
      status: "IN_PROGRESS",
      assigneeId: "u-assist",
      assigneeName: "Suzuki Jun",
      type: "character",
      priority: "normal",
      dueAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      instructions: "Test task for MF-028",
      createdAt: new Date().toISOString(),
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("Mangaka can see review queue (submissions with SUBMITTED status)", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const assistant = await loginAs("jun@beachread.jp");

    // Insert a submission directly with SUBMITTED status (API defaults to PENDING)
    const subId = `sub-review-q-${Date.now()}`;
    await SubmissionModel.create({
      id: subId,
      taskId: "tsk-review-q",
      assistantId: "usr-6",
      assistantName: "Jun Tanaka",
      status: "SUBMITTED",
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Verify it appears in the SUBMITTED filter
    const queueRes = await request(createApp())
      .get("/api/submissions?status=SUBMITTED")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);
    expect(Array.isArray(queueRes.body.data)).toBe(true);
    const found = queueRes.body.data.find((s: any) => s.id === subId);
    expect(found).toBeDefined();
  });

  it("GET /api/submissions?status=SUBMITTED filters correctly", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");

    // Insert a SUBMITTED submission
    const subIdSubmitted = `sub-filter-submitted-${Date.now()}`;
    await SubmissionModel.create({
      id: subIdSubmitted,
      taskId: "tsk-filter-q",
      assistantId: "usr-6",
      assistantName: "Jun Tanaka",
      version: 1,
      status: "SUBMITTED",
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Insert a MANGAKA_APPROVED submission (should not appear in SUBMITTED filter)
    const subIdApproved = `sub-filter-approved-${Date.now()}`;
    await SubmissionModel.create({
      id: subIdApproved,
      taskId: "tsk-filter-q",
      assistantId: "usr-6",
      assistantName: "Jun Tanaka",
      version: 2,
      status: "MANGAKA_APPROVED",
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Verify only SUBMITTED ones appear in queue
    const queueRes = await request(createApp())
      .get("/api/submissions?status=SUBMITTED")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);
    expect(Array.isArray(queueRes.body.data)).toBe(true);
    const approved = queueRes.body.data.find((s: any) => s.id === subIdApproved);
    expect(approved).toBeUndefined();
    const submitted = queueRes.body.data.find((s: any) => s.id === subIdSubmitted);
    expect(submitted).toBeDefined();
  });

  it("Self-approval is blocked for submissions (SELF_APPROVAL_BLOCKED)", async () => {
    const assistant = await loginAs("jun@beachread.jp");

    // Insert a SUBMITTED submission where assistant is both creator and reviewer
    const subId = `sub-self-approve-${Date.now()}`;
    await SubmissionModel.create({
      id: subId,
      taskId: "tsk-self-approve",
      assistantId: "usr-6",
      assistantName: "Jun Tanaka",
      status: "SUBMITTED",
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Assistant tries to approve their own submission — should fail
    await request(createApp())
      .post(`/api/submissions/${subId}/approve`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ reviewerNote: "self approve attempt" })
      .expect(403);
  });

  it("Invalid review body returns 400 VALIDATION_ERROR", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    const mangaka = await loginAs("inoue@beachread.jp");

    // Create a submission
    const createRes = await request(createApp())
      .post("/api/submissions")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ taskId: "tsk-review-q", notes: "validation test" })
      .expect(201);
    const subId = createRes.body.data.id;

    // Try review with unknown fields
    await request(createApp())
      .post(`/api/submissions/${subId}/approve`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ hackerField: "evil", badField: 123 })
      .expect(400);
  });
});
