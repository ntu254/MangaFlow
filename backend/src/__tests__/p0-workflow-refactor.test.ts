import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { vi } from "vitest";
import { createApp } from "../app.js";
import {
  ChapterModel,
  ChapterReviewModel,
  BoardDecisionModel,
  EarningModel,
  OutboxEventModel,
  PublicationModel,
  ProposalModel,
  ProposalVoteModel,
  ProposalVersionModel,
  SeriesModel,
  StudioCommentModel,
  StudioRegionModel,
  StudioTaskModel,
  SubmissionModel,
  VotingSessionModel,
} from "../db/models.js";
import { seedDatabase } from "../seed.js";
import { processOutboxBatch } from "../services/outbox.service.js";
import { startOutboxRunner } from "../services/outbox-runner.service.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string; role: string } };
}

describe("P0 canonical task submission workflow", () => {
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

  it("submits task work only through the new idempotent task endpoint", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    await StudioTaskModel.create({
      id: "task-p0-submit",
      chapterId: "ch-s-berserk-prod-4",
      seriesId: "s-berserk-prod",
      pageId: "pg-p0-submit",
      assigneeId: assistant.user.id,
      assigneeName: "Jun Assistant",
      status: "IN_PROGRESS",
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const submit = await request(createApp())
      .post("/api/tasks/task-p0-submit/submit")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .set("Idempotency-Key", "idem-task-p0-submit")
      .send({
        expectedCurrentSubmissionId: null,
        fileKey: "pages/task-p0-submit.png",
        fileName: "task-p0-submit.png",
      })
      .expect(201);

    expect(submit.body.data.status).toBe("PENDING");
    expect(submit.body.data.submissionVersion).toBe(1);
    expect(submit.body.data.idempotencyKey).toBe("idem-task-p0-submit");

    const task = (await StudioTaskModel.findOne({ id: "task-p0-submit" }).lean()) as any;
    expect(task?.status).toBe("SUBMITTED");
    expect(task?.currentSubmissionId).toBe(submit.body.data.id);

    const replay = await request(createApp())
      .post("/api/tasks/task-p0-submit/submit")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .set("Idempotency-Key", "idem-task-p0-submit")
      .send({
        expectedCurrentSubmissionId: null,
        fileKey: "pages/task-p0-submit.png",
        fileName: "task-p0-submit.png",
      })
      .expect(201);
    expect(replay.body.data.id).toBe(submit.body.data.id);

    await request(createApp())
      .post("/api/tasks/task-p0-submit/submit")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .set("Idempotency-Key", "idem-task-p0-submit")
      .send({
        expectedCurrentSubmissionId: null,
        fileKey: "pages/different-payload.png",
        fileName: "task-p0-submit.png",
      })
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("IDEMPOTENCY_KEY_REUSED");
      });
  });

  it("returns a precise conflict code when the current submission is stale", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    await StudioTaskModel.create({
      id: "task-p0-current-conflict",
      chapterId: "ch-s-berserk-prod-4",
      seriesId: "s-berserk-prod",
      assigneeId: assistant.user.id,
      status: "IN_PROGRESS",
      currentSubmissionId: "submission-current",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .post("/api/tasks/task-p0-current-conflict/submit")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .set("Idempotency-Key", "idem-current-conflict")
      .send({ expectedCurrentSubmissionId: "submission-old", fileKey: "pages/stale.png" })
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("CURRENT_SUBMISSION_CONFLICT");
      });
  });

  it("rejects deprecated submission write paths with endpoint-specific responses", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    const editor = await loginAs("tanaka@beachread.jp");

    await request(createApp())
      .post("/api/submissions")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ taskId: "task-any" })
      .expect(410)
      .expect((res) => {
        expect(res.body.code).toBe("ENDPOINT_DEPRECATED");
        expect(res.body.replacement).toBe("/api/tasks/:taskId/submit");
      });

    await SubmissionModel.create({
      id: "sub-editor-removed",
      taskId: "task-editor-removed",
      assistantId: assistant.user.id,
      status: "MANGAKA_APPROVED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .post("/api/submissions/sub-editor-removed/editor-approve")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ reviewerNote: "Looks good" })
      .expect(410)
      .expect((res) => {
        expect(res.body.code).toBe("WORKFLOW_REMOVED");
        expect(res.body.replacement).toBe("/api/chapters/:chapterId/reviews");
      });
  });

  it("writes canonical proposal review statuses on submit, claim, changes, resubmit, and forward", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const editor = await loginAs("tanaka@beachread.jp");
    await ProposalModel.create({
      id: "prop-p0-canonical",
      title: "Canonical Proposal",
      authorId: mangaka.user.id,
      authorName: "Inoue",
      synopsis: "A proposal using canonical write statuses.",
      status: "DRAFT",
      requestedChanges: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .post("/api/proposals/prop-p0-canonical/actions/SUBMIT")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({})
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("PENDING_EDITOR");
      });

    await request(createApp())
      .post("/api/proposals/prop-p0-canonical/actions/CLAIM")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("EDITOR_REVIEWING");
      });

    await request(createApp())
      .post("/api/proposals/prop-p0-canonical/actions/UPDATE_EDITORIAL_CHECKLIST")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({
        editorialChecklist: {
          hook: true,
          characterMotivation: true,
          audienceFit: true,
          storyboardFlow: true,
          manuscriptQuality: true,
          serializePotential: true,
        },
      })
      .expect(200);

    await request(createApp())
      .post("/api/proposals/prop-p0-canonical/actions/REQUEST_CHANGES")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ comment: "Please revise the sample chapter." })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("CHANGES_REQUESTED");
      });

    const proposal = (await ProposalModel.findOne({ id: "prop-p0-canonical" }).lean()) as any;
    const latestChange = proposal.requestedChanges.at(-1);
    await request(createApp())
      .post("/api/proposals/prop-p0-canonical/actions/RESUBMIT")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({
        resolvedItems: Object.fromEntries(
          latestChange.items.map((item: any) => [item.id, { resolved: true }]),
        ),
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("EDITOR_REVIEWING");
      });

    await request(createApp())
      .post("/api/proposals/prop-p0-canonical/actions/FORWARD")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("PENDING_BOARD");
      });
  });

  it("blocks Mangaka approval of historical submissions", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const assistant = await loginAs("jun@beachread.jp");

    await StudioTaskModel.create({
      id: "task-current-only",
      chapterId: "ch-s-berserk-prod-4",
      seriesId: "s-berserk-prod",
      assigneeId: assistant.user.id,
      assigneeName: "Jun Assistant",
      status: "SUBMITTED",
      currentSubmissionId: "sub-current",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await SubmissionModel.insertMany([
      {
        id: "sub-old",
        taskId: "task-current-only",
        assistantId: assistant.user.id,
        status: "PENDING",
        version: 1,
        submissionVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "sub-current",
        taskId: "task-current-only",
        assistantId: assistant.user.id,
        status: "PENDING",
        version: 2,
        submissionVersion: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await request(createApp())
      .post("/api/submissions/sub-old/approve")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ reviewerNote: "Approved" })
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("NOT_CURRENT_SUBMISSION");
      });
  });

  it("rejects removed Task review action aliases before workflow execution", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    const mangaka = await loginAs("inoue@beachread.jp");
    await StudioTaskModel.create({
      id: "task-legacy-review-blocked",
      chapterId: "ch-s-berserk-prod-4",
      seriesId: "s-berserk-prod",
      assigneeId: assistant.user.id,
      assigneeName: "Jun Assistant",
      status: "SUBMITTED",
      currentSubmissionId: "sub-legacy-review-blocked",
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await SubmissionModel.create({
      id: "sub-legacy-review-blocked",
      taskId: "task-legacy-review-blocked",
      assistantId: assistant.user.id,
      status: "PENDING",
      version: 1,
      submissionVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    for (const action of [
      "APPROVE",
      "MANGAKA_APPROVE",
      "REQUEST_REVISION",
      "EDITOR_APPROVE",
      "REJECT",
    ]) {
      await request(createApp())
        .post(`/api/studio/tasks/task-legacy-review-blocked/actions/${action}`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.code).toBe("INVALID_ACTION");
        });
    }

    const task = (await StudioTaskModel.findOne({
      id: "task-legacy-review-blocked",
    }).lean()) as any;
    const submission = (await SubmissionModel.findOne({
      id: "sub-legacy-review-blocked",
    }).lean()) as any;
    expect(task.status).toBe("SUBMITTED");
    expect(submission.status).toBe("PENDING");
  });

  it("blocks direct proposal FORCE_STATUS from bypassing VotingSession finalize", async () => {
    const board = await loginAs("board@beachread.jp");

    await ProposalModel.create({
      id: "prop-force-status-blocked",
      title: "Force Status Blocked",
      authorId: "u-mangaka",
      authorName: "Inoue",
      synopsis: "This proposal must be finalized through a VotingSession.",
      status: "PENDING_BOARD",
      requestedChanges: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .post("/api/proposals/prop-force-status-blocked/actions/FORCE_STATUS")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ forceStatus: "APPROVED", publicationType: "WEEKLY" })
      .expect(410)
      .expect((res) => {
        expect(res.body.code).toBe("WORKFLOW_REMOVED");
      });

    const proposal = (await ProposalModel.findOne({
      id: "prop-force-status-blocked",
    }).lean()) as any;
    expect(proposal.status).toBe("PENDING_BOARD");
  });

  it("blocks Admin from normal workflow approval and vote bypass routes", async () => {
    const admin = await loginAs("admin@beachread.jp");
    const assistant = await loginAs("jun@beachread.jp");

    await ProposalModel.create({
      id: "prop-admin-normal-bypass",
      title: "Admin Normal Bypass",
      authorId: "u-mangaka",
      authorName: "Inoue",
      synopsis: "Admin should not act as Board or Tantou here.",
      status: "PENDING_BOARD",
      votes: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .post("/api/board/series/prop-admin-normal-bypass/votes")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ voteDecision: "APPROVE" })
      .expect(403);

    await ProposalModel.updateOne(
      { id: "prop-admin-normal-bypass" },
      { $set: { status: "TANTOU_REVIEW" } },
    );
    await request(createApp())
      .post("/api/proposals/prop-admin-normal-bypass/actions/REJECT")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ rejectReason: "Admin cannot reject through normal Tantou path." })
      .expect(403);

    await ChapterModel.create({
      id: "chapter-admin-normal-bypass",
      seriesId: "s-berserk-prod",
      number: 900,
      title: "Admin Chapter Bypass",
      status: "TANTOU_REVIEW",
      pages: [],
      history: [],
      reviewSnapshot: { chapterVersionId: "chapter-admin-normal-bypass|", pageVersionIds: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await request(createApp())
      .post("/api/chapters/chapter-admin-normal-bypass/actions/EDITOR_APPROVE")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({})
      .expect(403);

    await StudioTaskModel.create({
      id: "task-admin-submission-bypass",
      chapterId: "ch-s-berserk-prod-4",
      seriesId: "s-berserk-prod",
      assigneeId: assistant.user.id,
      assigneeName: "Jun Assistant",
      status: "SUBMITTED",
      currentSubmissionId: "sub-admin-submission-bypass",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await SubmissionModel.create({
      id: "sub-admin-submission-bypass",
      taskId: "task-admin-submission-bypass",
      assistantId: assistant.user.id,
      status: "PENDING",
      version: 1,
      submissionVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await request(createApp())
      .post("/api/submissions/sub-admin-submission-bypass/approve")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ reviewerNote: "Admin cannot approve through normal Mangaka path." })
      .expect(403);
  });

  it("requires reopen before submitting a revision-requested task", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    await StudioTaskModel.create({
      id: "task-p0-revision-reopen",
      chapterId: "ch-s-berserk-prod-4",
      seriesId: "s-berserk-prod",
      assigneeId: assistant.user.id,
      assigneeName: "Jun Assistant",
      status: "REVISION_REQUESTED",
      currentSubmissionId: "sub-revision-old",
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await SubmissionModel.create({
      id: "sub-revision-old",
      taskId: "task-p0-revision-reopen",
      assistantId: assistant.user.id,
      status: "REVISION_REQUESTED",
      version: 1,
      submissionVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .post("/api/tasks/task-p0-revision-reopen/submit")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .set("Idempotency-Key", "idem-revision-without-reopen")
      .send({
        expectedCurrentSubmissionId: "sub-revision-old",
        fileKey: "pages/revision.png",
      })
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("INVALID_TRANSITION");
      });

    await request(createApp())
      .post("/api/tasks/task-p0-revision-reopen/reopen")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(200);

    const res = await request(createApp())
      .post("/api/tasks/task-p0-revision-reopen/submit")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .set("Idempotency-Key", "idem-revision-after-reopen")
      .send({
        expectedCurrentSubmissionId: "sub-revision-old",
        fileKey: "pages/revision-v2.png",
      })
      .expect(201);

    expect(res.body.data.submissionVersion).toBe(2);
    const oldSubmission = (await SubmissionModel.findOne({ id: "sub-revision-old" }).lean()) as any;
    expect(oldSubmission?.status).toBe("SUPERSEDED");
  });

  it("creates backend-computed earning and transactional outbox on Mangaka approval", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    const mangaka = await loginAs("inoue@beachread.jp");
    await StudioTaskModel.create({
      id: "task-p0-earning",
      chapterId: "ch-s-berserk-prod-4",
      seriesId: "s-berserk-prod",
      assigneeId: assistant.user.id,
      assigneeName: "Jun Assistant",
      status: "IN_PROGRESS",
      isRequired: true,
      quantity: 3,
      rateSnapshot: 1200,
      estimatedAmount: 999999,
      currency: "VND",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const submit = await request(createApp())
      .post("/api/tasks/task-p0-earning/submit")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .set("Idempotency-Key", "idem-task-p0-earning")
      .send({
        expectedCurrentSubmissionId: null,
        fileKey: "pages/task-p0-earning.png",
      })
      .expect(201);

    await request(createApp())
      .post(`/api/submissions/${submit.body.data.id}/approve`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ reviewerNote: "Approved" })
      .expect(200);

    const earning = (await EarningModel.findOne({
      sourceKey: `TASK_APPROVAL:task-p0-earning:${submit.body.data.id}`,
    }).lean()) as any;
    expect(earning?.status).toBe("EARNED");
    expect(earning?.amount).toBe(3600);

    const outbox = await OutboxEventModel.find({
      aggregateId: {
        $in: ["task-p0-earning", `TASK_APPROVAL:task-p0-earning:${submit.body.data.id}`],
      },
    }).lean();
    expect(outbox.map((event: any) => event.type)).toEqual(
      expect.arrayContaining(["task.submitted", "earning.earned"]),
    );
  });

  it("freezes VotingSession on a proposal version and returns Proposal to PENDING_BOARD on NO_QUORUM", async () => {
    const board = await loginAs("board@beachread.jp");
    const mangaka = await loginAs("inoue@beachread.jp");
    await ProposalModel.create({
      id: "prop-p0-board-session",
      title: "Board Snapshot",
      authorId: mangaka.user.id,
      authorName: "Inoue",
      status: "PENDING_BOARD",
      currentVersion: 4,
      manuscripts: [{ id: "ms-board-session", version: 4 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const created = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ proposalId: "prop-p0-board-session" })
      .expect(201);

    expect(created.body.data.targetType).toBe("PROPOSAL");
    expect(created.body.data.proposalVersionId).toBe("4");
    const frozenVersion = await ProposalVersionModel.findOne({
      proposalId: "prop-p0-board-session",
      proposalVersionId: "4",
    }).lean();
    expect((frozenVersion as any)?.status).toBe("FROZEN");
    expect((frozenVersion as any)?.snapshot.manuscripts[0].version).toBe(4);
    await request(createApp())
      .get("/api/proposals/prop-p0-board-session/versions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].proposalVersionId).toBe("4");
      });
    await request(createApp())
      .get("/api/proposals/prop-p0-board-session/versions/4")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.snapshot.manuscripts[0].version).toBe(4);
      });

    const inReview = (await ProposalModel.findOne({ id: "prop-p0-board-session" }).lean()) as any;
    expect(inReview.status).toBe("BOARD_REVIEW");
    expect(inReview.activeVotingSessionId).toBe(created.body.data.id);

    // Board queue must project the active VotingSession id so web/mobile can finalize.
    await request(createApp())
      .get("/api/board/queue")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200)
      .expect((res) => {
        const item = (res.body.data as any[]).find((row) => row.id === "prop-p0-board-session");
        expect(item).toBeDefined();
        expect(item.activeVotingSessionId).toBe(created.body.data.id);
        expect(item.sessionId).toBe(created.body.data.id);
      });

    await request(createApp())
      .patch("/api/proposals/prop-p0-board-session")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ title: "Edited During Board Review" })
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("PROPOSAL_VERSION_LOCKED");
      });

    const stillFrozen = (await ProposalVersionModel.findOne({
      proposalId: "prop-p0-board-session",
      proposalVersionId: "4",
    }).lean()) as any;
    expect(stillFrozen.snapshot.title).toBe("Board Snapshot");

    await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ proposalId: "prop-p0-board-session" })
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("ACTIVE_VOTING_SESSION_EXISTS");
      });

    await request(createApp())
      .post(`/api/voting-sessions/${created.body.data.id}/close`)
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ note: "Closed without quorum; revisit next cycle." })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("NO_QUORUM");
        expect(res.body.data.result).toBeNull();
      });

    const afterNoQuorum = (await ProposalModel.findOne({
      id: "prop-p0-board-session",
    }).lean()) as any;
    expect(afterNoQuorum.status).toBe("PENDING_BOARD");
    expect(afterNoQuorum.activeVotingSessionId).toBeUndefined();
    expect(afterNoQuorum.activeProposalVersionId).toBeUndefined();

    const closedSession = (await VotingSessionModel.findOne({
      id: created.body.data.id,
    }).lean()) as any;
    expect(closedSession.closingNote).toBe("Closed without quorum; revisit next cycle.");
    expect((closedSession.notes ?? []).some((n: any) => n.kind === "FINALIZE")).toBe(true);
  });

  it("rejects arbitrary Proposal versions without creating a session", async () => {
    const chair = await loginAs("board@beachread.jp");
    await ProposalModel.create({
      id: "prop-server-version-only",
      title: "Server Version Only",
      authorId: "u-mangaka",
      authorName: "Inoue",
      status: "PENDING_BOARD",
      currentVersion: 4,
      manuscripts: [{ id: "ms-server-version-only", version: 4 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ proposalId: "prop-server-version-only", proposalVersionId: "999" })
      .expect(409);

    expect(
      await VotingSessionModel.countDocuments({ proposalId: "prop-server-version-only" }),
    ).toBe(0);
    expect(
      await ProposalVersionModel.countDocuments({ proposalId: "prop-server-version-only" }),
    ).toBe(0);
  });

  it("rolls back session creation when the Proposal state transition loses its predicate", async () => {
    const chair = await loginAs("board@beachread.jp");
    await ProposalModel.create({
      id: "prop-state-changed-during-session-create",
      title: "State Changed During Session Create",
      authorId: "u-mangaka",
      authorName: "Inoue",
      status: "PENDING_BOARD",
      currentVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const updateOne = vi
      .spyOn(ProposalModel, "updateOne")
      .mockResolvedValueOnce({ acknowledged: true, matchedCount: 0, modifiedCount: 0 } as any);

    try {
      await request(createApp())
        .post("/api/voting-sessions")
        .set("Authorization", `Bearer ${chair.accessToken}`)
        .send({ proposalId: "prop-state-changed-during-session-create" })
        .expect(409)
        .expect((res) => {
          expect(res.body.code).toBe("PROPOSAL_STATE_CHANGED");
        });
    } finally {
      updateOne.mockRestore();
    }

    expect(
      await VotingSessionModel.countDocuments({
        proposalId: "prop-state-changed-during-session-create",
      }),
    ).toBe(0);
    expect(
      await ProposalVersionModel.countDocuments({
        proposalId: "prop-state-changed-during-session-create",
      }),
    ).toBe(0);
  });

  it("resolves Board sessions using the canonical three-of-five outcomes", async () => {
    const chair = await loginAs("board@beachread.jp");
    const voters = await Promise.all(
      [
        "board@beachread.jp",
        "sato@beachread.jp",
        "kobayashi@beachread.jp",
        "watanabe@beachread.jp",
        "mori@beachread.jp",
      ].map((email) => loginAs(email)),
    );
    const cases = [
      {
        id: "approve",
        votes: ["APPROVE", "APPROVE", "APPROVE"],
        status: "FINALIZED",
        result: "APPROVED",
      },
      {
        id: "reject",
        votes: ["REJECT", "REJECT", "REJECT"],
        status: "FINALIZED",
        result: "REJECTED",
      },
      {
        id: "abstain",
        votes: ["APPROVE", "APPROVE", "REJECT", "ABSTAIN", "ABSTAIN"],
        status: "NO_QUORUM",
        result: null,
      },
      {
        id: "tie",
        votes: ["APPROVE", "APPROVE", "REJECT", "REJECT", "ABSTAIN"],
        status: "TIED",
        result: null,
      },
    ] as const;

    for (const testCase of cases) {
      const proposalId = `prop-p0-three-of-five-${testCase.id}`;
      await ProposalModel.create({
        id: proposalId,
        title: `Three of five ${testCase.id}`,
        authorId: "u-mangaka",
        authorName: "Inoue",
        status: "PENDING_BOARD",
        currentVersion: 1,
        manuscripts: [{ id: `ms-${testCase.id}`, version: 1 }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const created = await request(createApp())
        .post("/api/voting-sessions")
        .set("Authorization", `Bearer ${chair.accessToken}`)
        .send({ proposalId })
        .expect(201);

      for (const [index, value] of testCase.votes.entries()) {
        await request(createApp())
          .post(`/api/board/series/${proposalId}/votes`)
          .set("Authorization", `Bearer ${voters[index].accessToken}`)
          .send({ value, sessionId: created.body.data.id })
          .expect(200);
      }

      const closed = await request(createApp())
        .post(`/api/voting-sessions/${created.body.data.id}/close`)
        .set("Authorization", `Bearer ${chair.accessToken}`)
        .send({})
        .expect(200);
      expect(closed.body.data.status).toBe(testCase.status);
      expect(closed.body.data.result).toBe(testCase.result);
      const proposal = (await ProposalModel.findOne({ id: proposalId }).lean()) as any;
      if (testCase.status === "TIED") {
        expect(proposal.status).toBe("BOARD_REVIEW");
        expect(proposal.activeVotingSessionId).not.toBe(created.body.data.id);
        expect(proposal.activeProposalVersionId).toBe(created.body.data.proposalVersionId);
      } else {
        expect(proposal.activeVotingSessionId).toBeUndefined();
        expect(proposal.activeProposalVersionId).toBeUndefined();
        if (testCase.status === "NO_QUORUM") {
          expect(proposal.status).toBe("PENDING_BOARD");
        }
      }
    }
  });

  it("creates linked empty re-vote rounds without mutating tied session history", async () => {
    const chair = await loginAs("board@beachread.jp");
    const voters = await Promise.all(
      [
        "board@beachread.jp",
        "sato@beachread.jp",
        "kobayashi@beachread.jp",
        "watanabe@beachread.jp",
        "mori@beachread.jp",
      ].map((email) => loginAs(email)),
    );
    await ProposalModel.create({
      id: "prop-p0-revote",
      title: "Re-vote",
      authorId: "u-mangaka",
      authorName: "Inoue",
      status: "PENDING_BOARD",
      currentVersion: 3,
      manuscripts: [{ id: "ms-revote", version: 3 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const firstRound = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ proposalId: "prop-p0-revote" })
      .expect(201);
    for (const [index, value] of ["APPROVE", "APPROVE", "REJECT", "REJECT", "ABSTAIN"].entries()) {
      await request(createApp())
        .post("/api/board/series/prop-p0-revote/votes")
        .set("Authorization", `Bearer ${voters[index].accessToken}`)
        .send({ value, sessionId: firstRound.body.data.id })
        .expect(200);
    }
    const firstClose = await request(createApp())
      .post(`/api/voting-sessions/${firstRound.body.data.id}/close`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({})
      .expect(200);

    expect(firstClose.body.data.status).toBe("TIED");
    const afterFirstTie = (await VotingSessionModel.find({ proposalId: "prop-p0-revote" })
      .sort({ openedAt: 1 })
      .lean()) as any[];
    expect(afterFirstTie).toHaveLength(2);
    expect(afterFirstTie[0]).toMatchObject({ id: firstRound.body.data.id, status: "TIED" });
    expect(afterFirstTie[1]).toMatchObject({
      status: "OPEN",
      reVoteOfSessionId: firstRound.body.data.id,
      proposalId: "prop-p0-revote",
      proposalVersionId: firstRound.body.data.proposalVersionId,
      eligibleVoterIds: firstRound.body.data.eligibleVoterIds,
      quorum: firstRound.body.data.quorum,
    });
    expect(await ProposalVoteModel.countDocuments({ sessionId: afterFirstTie[1].id })).toBe(0);
    const proposalAfterFirstTie = (await ProposalModel.findOne({
      id: "prop-p0-revote",
    }).lean()) as any;
    expect(proposalAfterFirstTie).toMatchObject({
      status: "BOARD_REVIEW",
      activeVotingSessionId: afterFirstTie[1].id,
      activeProposalVersionId: firstRound.body.data.proposalVersionId,
    });

    await request(createApp())
      .post("/api/board/series/prop-p0-revote/votes")
      .set("Authorization", `Bearer ${voters[0].accessToken}`)
      .send({ value: "APPROVE", sessionId: firstRound.body.data.id })
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("SESSION_NOT_ACTIVE");
      });

    const firstRoundVotes = await ProposalVoteModel.find({ sessionId: firstRound.body.data.id })
      .sort({ voterId: 1 })
      .lean();
    for (const [index, value] of ["REJECT", "REJECT", "APPROVE", "APPROVE", "ABSTAIN"].entries()) {
      await request(createApp())
        .post("/api/board/series/prop-p0-revote/votes")
        .set("Authorization", `Bearer ${voters[index].accessToken}`)
        .send({ value, sessionId: afterFirstTie[1].id })
        .expect(200);
    }
    const secondRoundVotes = await ProposalVoteModel.find({ sessionId: afterFirstTie[1].id })
      .sort({ voterId: 1 })
      .lean();
    await request(createApp())
      .post(`/api/voting-sessions/${afterFirstTie[1].id}/close`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({})
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("TIED");
      });

    const afterSecondTie = (await VotingSessionModel.find({ proposalId: "prop-p0-revote" })
      .sort({ openedAt: 1 })
      .lean()) as any[];
    expect(afterSecondTie).toHaveLength(3);
    expect(afterSecondTie.map((round) => round.status)).toEqual(["TIED", "TIED", "OPEN"]);
    expect(afterSecondTie[2]).toMatchObject({
      reVoteOfSessionId: afterFirstTie[1].id,
      proposalId: "prop-p0-revote",
      proposalVersionId: firstRound.body.data.proposalVersionId,
      eligibleVoterIds: firstRound.body.data.eligibleVoterIds,
      quorum: firstRound.body.data.quorum,
    });
    expect(await ProposalVoteModel.countDocuments({ sessionId: afterSecondTie[2].id })).toBe(0);
    expect(
      await ProposalVoteModel.find({ sessionId: firstRound.body.data.id })
        .sort({ voterId: 1 })
        .lean(),
    ).toEqual(firstRoundVotes);
    expect(
      await ProposalVoteModel.find({ sessionId: afterFirstTie[1].id }).sort({ voterId: 1 }).lean(),
    ).toEqual(secondRoundVotes);
    const proposalAfterSecondTie = (await ProposalModel.findOne({
      id: "prop-p0-revote",
    }).lean()) as any;
    expect(proposalAfterSecondTie).toMatchObject({
      status: "BOARD_REVIEW",
      activeVotingSessionId: afterSecondTie[2].id,
      activeProposalVersionId: firstRound.body.data.proposalVersionId,
    });
  });

  it("does not write a vote when an open session becomes terminal after the initial read", async () => {
    const chair = await loginAs("board@beachread.jp");
    await ProposalModel.create({
      id: "prop-p0-vote-close-race",
      title: "Vote close race",
      authorId: "u-mangaka",
      authorName: "Inoue",
      status: "PENDING_BOARD",
      currentVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const created = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ proposalId: "prop-p0-vote-close-race" })
      .expect(201);
    const sessionId = created.body.data.id;
    const findSession = VotingSessionModel.findOne.bind(VotingSessionModel);
    const findOne = vi
      .spyOn(VotingSessionModel, "findOne")
      .mockImplementationOnce((...args: any[]) => {
        const query = findSession(...args) as any;
        const lean = query.lean.bind(query);
        query.lean = (...leanArgs: any[]) =>
          lean(...leanArgs).then(async (session: any) => {
            await VotingSessionModel.updateOne({ id: sessionId }, { $set: { status: "TIED" } });
            return session;
          });
        return query;
      });

    try {
      await request(createApp())
        .post("/api/board/series/prop-p0-vote-close-race/votes")
        .set("Authorization", `Bearer ${chair.accessToken}`)
        .send({ value: "APPROVE", sessionId })
        .expect(409);
    } finally {
      findOne.mockRestore();
    }

    expect(await ProposalVoteModel.countDocuments({ sessionId })).toBe(0);
    expect(((await VotingSessionModel.findOne({ id: sessionId }).lean()) as any).status).toBe(
      "TIED",
    );
  });

  it("rejects an open-session vote from a Board member outside the eligible electorate", async () => {
    const chair = await loginAs("board@beachread.jp");
    const ineligibleBoardMember = await loginAs("mori@beachread.jp");
    await ProposalModel.create({
      id: "prop-p0-ineligible-voter",
      title: "Ineligible voter",
      authorId: "u-mangaka",
      authorName: "Inoue",
      status: "PENDING_BOARD",
      currentVersion: 1,
      manuscripts: [{ id: "ms-ineligible-voter", version: 1 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const session = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ proposalId: "prop-p0-ineligible-voter" })
      .expect(201);
    await VotingSessionModel.updateOne(
      { id: session.body.data.id },
      { $set: { eligibleVoterIds: ["u-board", "u-board-2", "u-board-3", "u-board-4"] } },
    );

    await request(createApp())
      .post("/api/board/series/prop-p0-ineligible-voter/votes")
      .set("Authorization", `Bearer ${ineligibleBoardMember.accessToken}`)
      .send({ value: "APPROVE", sessionId: session.body.data.id })
      .expect(403)
      .expect((res) => {
        expect(res.body.code).toBe("FORBIDDEN");
      });
  });

  it("ignores non-eligible stored votes when closing a session", async () => {
    const chair = await loginAs("board@beachread.jp");
    await ProposalModel.create({
      id: "prop-p0-ineligible-tally",
      title: "Ineligible tally",
      authorId: "u-mangaka",
      authorName: "Inoue",
      status: "PENDING_BOARD",
      currentVersion: 1,
      manuscripts: [{ id: "ms-ineligible-tally", version: 1 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const session = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ proposalId: "prop-p0-ineligible-tally" })
      .expect(201);
    await VotingSessionModel.updateOne(
      { id: session.body.data.id },
      { $set: { eligibleVoterIds: ["u-board", "u-board-2", "u-board-3", "u-board-4"] } },
    );
    await ProposalVoteModel.insertMany([
      {
        id: "pv-p0-eligible-1",
        sessionId: session.body.data.id,
        proposalId: "prop-p0-ineligible-tally",
        voterId: "u-board",
        voterName: "Yamamoto",
        voterRole: "BOARD",
        decision: "APPROVE",
        votedAt: new Date(),
      },
      {
        id: "pv-p0-eligible-2",
        sessionId: session.body.data.id,
        proposalId: "prop-p0-ineligible-tally",
        voterId: "u-board-2",
        voterName: "Sato",
        voterRole: "BOARD",
        decision: "APPROVE",
        votedAt: new Date(),
      },
      {
        id: "pv-p0-eligible-3",
        sessionId: session.body.data.id,
        proposalId: "prop-p0-ineligible-tally",
        voterId: "u-board-3",
        voterName: "Kobayashi",
        voterRole: "BOARD",
        decision: "REJECT",
        votedAt: new Date(),
      },
      {
        id: "pv-p0-eligible-4",
        sessionId: session.body.data.id,
        proposalId: "prop-p0-ineligible-tally",
        voterId: "u-board-4",
        voterName: "Watanabe",
        voterRole: "BOARD",
        decision: "ABSTAIN",
        votedAt: new Date(),
      },
      {
        id: "pv-p0-ineligible",
        sessionId: session.body.data.id,
        proposalId: "prop-p0-ineligible-tally",
        voterId: "u-board-5",
        voterName: "Mori",
        voterRole: "BOARD",
        decision: "APPROVE",
        votedAt: new Date(),
      },
    ]);

    await request(createApp())
      .post(`/api/voting-sessions/${session.body.data.id}/close`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({})
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("NO_QUORUM");
        expect(res.body.data.result).toBeNull();
      });
  });

  it("rejects multi-proposal VotingSession writes for the P0 one-proposal model", async () => {
    const board = await loginAs("board@beachread.jp");

    await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ title: "Invalid multi proposal", proposalIds: ["prop-a", "prop-b"] })
      .expect(400)
      .expect((res) => {
        expect(res.body.code).toBe("MULTI_PROPOSAL_SESSION_UNSUPPORTED");
      });
  });

  it("blocks Admin from voting, claiming, or approving submissions through normal workflow routes", async () => {
    const admin = await loginAs("admin@beachread.jp");
    expect(admin.user.role).toBe("ADMIN");

    await ProposalModel.create({
      id: "prop-admin-vote",
      title: "Admin Vote Attempt",
      authorId: "u-mangaka",
      authorName: "Inoue",
      status: "READY_FOR_BOARD",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await ProposalModel.create({
      id: "prop-admin-claim",
      title: "Admin Claim Attempt",
      authorId: "u-mangaka",
      authorName: "Inoue",
      status: "SUBMITTED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await SubmissionModel.create({
      id: "sub-admin-approve",
      taskId: "task-admin-approve",
      assistantId: "u-assist",
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Admin cannot cast a Board vote through the normal proposal action route.
    await request(createApp())
      .post("/api/proposals/prop-admin-vote/actions/VOTE")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ decision: "APPROVE" })
      .expect(403)
      .expect((res) => {
        expect(res.body.code).toBe("FORBIDDEN");
      });

    // Admin cannot claim a proposal as Tantou/Editor.
    await request(createApp())
      .post("/api/proposals/prop-admin-claim/actions/CLAIM")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({})
      .expect(403);

    // Admin cannot approve an Assistant submission through the Mangaka review route.
    await request(createApp())
      .post("/api/submissions/sub-admin-approve/approve")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({})
      .expect(403)
      .expect((res) => {
        expect(res.body.code).toBe("FORBIDDEN");
      });

    // No audit override record was created by these rejected normal-path attempts.
    const overrideAudits = await OutboxEventModel.countDocuments({ type: /override/i });
    expect(overrideAudits).toBe(0);
  });

  it("rejects VotingSession close when Proposal current version no longer matches the frozen snapshot", async () => {
    const board = await loginAs("board@beachread.jp");
    const mangaka = await loginAs("inoue@beachread.jp");
    await ProposalModel.create({
      id: "prop-p0-stale-finalize",
      title: "Stale Finalize",
      authorId: mangaka.user.id,
      authorName: "Inoue",
      status: "PENDING_BOARD",
      currentVersion: 2,
      manuscripts: [{ id: "ms-stale-finalize", version: 2 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const created = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ proposalId: "prop-p0-stale-finalize", proposalVersionId: "2" })
      .expect(201);

    await ProposalModel.updateOne(
      { id: "prop-p0-stale-finalize" },
      {
        $set: {
          currentVersion: 3,
          manuscripts: [{ id: "ms-stale-finalize-v3", version: 3 }],
          updatedAt: new Date(),
        },
      },
    );

    await request(createApp())
      .post(`/api/voting-sessions/${created.body.data.id}/close`)
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({})
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("REVIEW_SNAPSHOT_STALE");
      });

    const session = (await VotingSessionModel.findOne({ id: created.body.data.id }).lean()) as any;
    const proposal = (await ProposalModel.findOne({ id: "prop-p0-stale-finalize" }).lean()) as any;
    expect(session.status).toBe("OPEN");
    expect(proposal.status).toBe("BOARD_REVIEW");
  });

  it("requires Board Chair for sessions and creates immutable BoardDecision on approved finalize", async () => {
    const chair = await loginAs("board@beachread.jp");
    const nonChair = await loginAs("kobayashi@beachread.jp");
    const board2 = await loginAs("sato@beachread.jp");
    const mangaka = await loginAs("inoue@beachread.jp");
    await ProposalModel.create({
      id: "prop-p0-board-approved",
      title: "Board Approved",
      slug: "board-approved",
      authorId: mangaka.user.id,
      authorName: "Inoue",
      status: "PENDING_BOARD",
      currentVersion: 2,
      manuscripts: [{ id: "ms-board-approved", version: 2 }],
      requestedPublicationType: "WEEKLY",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${nonChair.accessToken}`)
      .send({ proposalId: "prop-p0-board-approved" })
      .expect(403)
      .expect((res) => {
        expect(res.body.code).toBe("BOARD_CHAIR_REQUIRED");
      });

    const created = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ proposalId: "prop-p0-board-approved", proposalVersionId: "2" })
      .expect(201);

    await request(createApp())
      .post("/api/board/series/prop-p0-board-approved/votes")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ value: "APPROVE", sessionId: created.body.data.id })
      .expect(200);

    await request(createApp())
      .post(`/api/voting-sessions/${created.body.data.id}/close`)
      .set("Authorization", `Bearer ${nonChair.accessToken}`)
      .send({})
      .expect(403);

    const closed = await request(createApp())
      .post(`/api/voting-sessions/${created.body.data.id}/close`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({})
      .expect(200);
    expect(closed.body.data.status).toBe("NO_QUORUM");

    await ProposalModel.updateOne(
      { id: "prop-p0-board-approved" },
      { $set: { status: "BOARD_REVIEW" } },
    );
    await VotingSessionModel.updateOne(
      { id: created.body.data.id },
      { $set: { status: "OPEN", result: null, quorum: 2 } },
    );
    await request(createApp())
      .post("/api/board/series/prop-p0-board-approved/votes")
      .set("Authorization", `Bearer ${board2.accessToken}`)
      .send({ value: "APPROVE", sessionId: created.body.data.id })
      .expect(200);
    const approved = await request(createApp())
      .post(`/api/voting-sessions/${created.body.data.id}/close`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({})
      .expect(200);

    expect(approved.body.data.status).toBe("FINALIZED");
    expect(approved.body.data.result).toBe("APPROVED");
    const decision = await BoardDecisionModel.findOne({
      votingSessionId: created.body.data.id,
    }).lean();
    expect((decision as any)?.result).toBe("APPROVED");
    expect((decision as any)?.proposalVersionId).toBe("2");
    expect((decision as any)?.quorumSnapshot).toBe(2);
    const series = await SeriesModel.findOne({ sourceProposalId: "prop-p0-board-approved" }).lean();
    expect((series as any)?.status).toBe("PRE_PRODUCTION");
    expect((series as any)?.sourceProposalVersionId).toBe("2");
  });

  it("enforces Tantou blocking comment address, resolve, and reopen permissions", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const editor = await loginAs("tanaka@beachread.jp");
    const assistant = await loginAs("jun@beachread.jp");

    await SeriesModel.updateOne(
      { id: "s-berserk-prod" },
      { $set: { editorId: editor.user.id, editorName: "Tanaka Editor" } },
    );
    await StudioCommentModel.create({
      id: "comment-tantou-blocking",
      seriesId: "s-berserk-prod",
      chapterId: "ch-s-berserk-prod-4",
      targetType: "CHAPTER",
      targetId: "ch-s-berserk-prod-4",
      authorId: editor.user.id,
      authorName: "Tanaka Editor",
      authorRole: "EDITOR",
      body: "Please fix the chapter pacing.",
      isBlocking: true,
      status: "OPEN",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .post("/api/comments/comment-tantou-blocking/resolve")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({})
      .expect(403);

    await request(createApp())
      .post("/api/comments/comment-tantou-blocking/resolve")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(403);

    await request(createApp())
      .post("/api/comments/comment-tantou-blocking/address")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({})
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("ADDRESSED");
      });

    await request(createApp())
      .post("/api/comments/comment-tantou-blocking/reopen")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("REOPENED");
      });

    await request(createApp())
      .post("/api/comments/comment-tantou-blocking/address")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({})
      .expect(200);

    await request(createApp())
      .post("/api/comments/comment-tantou-blocking/resolve")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("RESOLVED");
      });
  });

  it("starts production only for series backed by an approved proposal", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await ProposalModel.create({
      id: "prop-p0-start-production",
      title: "Start Production",
      authorId: mangaka.user.id,
      authorName: "Inoue",
      status: "APPROVED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await SeriesModel.create({
      id: "series-p0-start-production",
      title: "Start Production",
      authorId: mangaka.user.id,
      authorName: "Inoue",
      status: "PRE_PRODUCTION",
      sourceProposalId: "prop-p0-start-production",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await SeriesModel.create({
      id: "series-p0-start-production-blocked",
      title: "Blocked Start",
      authorId: mangaka.user.id,
      authorName: "Inoue",
      status: "PRE_PRODUCTION",
      sourceProposalId: "prop-p0-start-production-missing",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const started = await request(createApp())
      .post("/api/series/series-p0-start-production/actions/START_PRODUCTION")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({})
      .expect(200);
    expect(started.body.data.status).toBe("ONGOING");

    await request(createApp())
      .post("/api/series/series-p0-start-production-blocked/actions/START_PRODUCTION")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({})
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("PROPOSAL_NOT_APPROVED");
      });
  });

  it("allows direct Mangaka chapter work to enter Tantou review without assistant tasks", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const editor = await loginAs("tanaka@beachread.jp");
    await ProposalModel.create({
      id: "prop-p0-direct",
      title: "Direct Work",
      authorId: mangaka.user.id,
      authorName: "Inoue",
      status: "APPROVED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await SeriesModel.create({
      id: "series-p0-direct",
      title: "Direct Work",
      authorId: mangaka.user.id,
      authorName: "Inoue",
      editorId: editor.user.id,
      editorName: "Tanaka",
      status: "ONGOING",
      publicationType: "WEEKLY",
      sourceProposalId: "prop-p0-direct",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await ChapterModel.create({
      id: "chapter-p0-direct",
      seriesId: "series-p0-direct",
      number: 1,
      title: "Chapter 1",
      status: "IN_PRODUCTION",
      pages: [
        { id: "page-p0-direct", pageNumber: 1, fileKey: "page-p0-direct.png", status: "UPLOADED" },
      ],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(createApp())
      .post("/api/studio/chapters/chapter-p0-direct/send-editor-review")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);

    expect(res.body.data.nextStatus).toBe("TANTOU_REVIEW");
    expect(res.body.data.flow).toBe("DIRECT");
    expect(res.body.data.chapter.reviewSnapshot.pageVersionIds).toHaveLength(1);
    expect(res.body.data.chapter.pages[0].status).toBe("TANTOU_REVIEW");
    const reviews = await request(createApp())
      .get("/api/chapters/chapter-p0-direct/reviews")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);
    expect(reviews.body.data).toHaveLength(1);
    expect(reviews.body.data[0].status).toBe("OPEN");
    expect(reviews.body.data[0].chapterVersionId).toBe(
      res.body.data.chapter.reviewSnapshot.chapterVersionId,
    );

    await request(createApp())
      .post("/api/chapters/chapter-p0-direct/actions/EDITOR_APPROVE")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200);
    const decidedReview = await ChapterReviewModel.findOne({
      chapterId: "chapter-p0-direct",
    }).lean();
    expect((decidedReview as any)?.status).toBe("APPROVED");
    expect((decidedReview as any)?.decidedById).toBe(editor.user.id);
  });

  it("blocks normal chapter Tantou review for completed series", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await ProposalModel.create({
      id: "prop-p0-completed",
      title: "Completed Series",
      authorId: mangaka.user.id,
      authorName: "Inoue",
      status: "APPROVED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await SeriesModel.create({
      id: "series-p0-completed",
      title: "Completed Series",
      authorId: mangaka.user.id,
      authorName: "Inoue",
      status: "COMPLETED",
      sourceProposalId: "prop-p0-completed",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await ChapterModel.create({
      id: "chapter-p0-completed",
      seriesId: "series-p0-completed",
      number: 1,
      title: "Chapter 1",
      status: "IN_PRODUCTION",
      pages: [
        {
          id: "page-p0-completed",
          pageNumber: 1,
          fileKey: "page-p0-completed.png",
          status: "UPLOADED",
        },
      ],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .post("/api/studio/chapters/chapter-p0-completed/send-editor-review")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({})
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("SERIES_NOT_IN_PRODUCTION");
      });
  });

  it("restricts production region edits to Mangaka and blocks deleting assigned regions", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const mangaka = await loginAs("inoue@beachread.jp");
    await StudioRegionModel.create({
      id: "region-p0-assigned",
      seriesId: "s-berserk-prod",
      chapterId: "ch-s-berserk-prod-4",
      pageId: "pg-p0-region",
      activeTaskId: "task-linked",
      status: "CONFIRMED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .patch("/api/studio/regions/region-p0-assigned")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ label: "Editor should not edit" })
      .expect(403);

    await request(createApp())
      .delete("/api/studio/regions/region-p0-assigned")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({})
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("REGION_ASSIGNED");
      });
  });

  it("prevents Mangaka from assigning Tantou and allows EIC assignment", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const editorInChief = await loginAs("tanaka@beachread.jp");
    await SeriesModel.create({
      id: "series-p0-tantou-assign",
      title: "Tantou Assign",
      authorId: mangaka.user.id,
      authorName: "Inoue",
      status: "PRE_PRODUCTION",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .post("/api/series/series-p0-tantou-assign/editor")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ editorId: "u-editor", editorName: "Tanaka Akira" })
      .expect(403);

    await request(createApp())
      .post("/api/series/series-p0-tantou-assign/editor")
      .set("Authorization", `Bearer ${editorInChief.accessToken}`)
      .send({ editorId: "u-editor", editorName: "Tanaka Akira" })
      .expect(200);
  });

  it("uses canonical publication schedule, postpone, and publish chapter states", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    await SeriesModel.create({
      id: "series-p0-publication",
      title: "Publication Flow",
      authorId: "u-mangaka",
      authorName: "Mangaka",
      editorId: editor.user.id,
      editorName: "Tanaka",
      status: "ONGOING",
      publicationType: "WEEKLY",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await ChapterModel.create({
      id: "chapter-p0-publication",
      seriesId: "series-p0-publication",
      number: 1,
      title: "Chapter 1",
      status: "READY_FOR_PUBLICATION",
      pages: [
        {
          id: "page-p0-publication",
          pageNumber: 1,
          fileKey: "page-p0-publication.png",
          status: "FINALIZED",
        },
      ],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await request(createApp())
      .post("/api/chapters/chapter-p0-publication/actions/SCHEDULE")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ scheduledAt: future })
      .expect(200)
      .expect((res) => {
        // The chapter stays READY_FOR_PUBLICATION; scheduling lives on Publication.
        expect(res.body.data.status).toBe("READY_FOR_PUBLICATION");
      });
    const scheduled = await PublicationModel.findOne({
      chapterId: "chapter-p0-publication",
    }).lean();
    expect((scheduled as any)?.status).toBe("SCHEDULED");

    await request(createApp())
      .post("/api/chapters/chapter-p0-publication/actions/POSTPONE")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("READY_FOR_PUBLICATION");
      });
    const cancelled = await PublicationModel.findOne({
      chapterId: "chapter-p0-publication",
    }).lean();
    expect((cancelled as any)?.status).toBe("CANCELLED");

    const past = new Date(Date.now() - 60 * 1000);
    // Chapter remains READY_FOR_PUBLICATION; only the Publication is re-scheduled.
    await PublicationModel.updateOne(
      { chapterId: "chapter-p0-publication" },
      { $set: { status: "SCHEDULED", scheduledAt: past } },
    );
    await request(createApp())
      .post("/api/chapters/chapter-p0-publication/actions/PUBLISH")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("PUBLISHED");
      });
  });

  it("rejects Tantou approval when the review snapshot is stale", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    await SeriesModel.create({
      id: "series-p0-stale",
      title: "Stale Review",
      authorId: "u-mangaka",
      authorName: "Mangaka",
      editorId: editor.user.id,
      editorName: "Tanaka",
      status: "ONGOING",
      publicationType: "WEEKLY",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await ChapterModel.create({
      id: "chapter-p0-stale",
      seriesId: "series-p0-stale",
      number: 1,
      title: "Chapter 1",
      status: "TANTOU_REVIEW",
      pages: [
        {
          id: "page-p0-stale",
          pageNumber: 1,
          fileKey: "page-p0-stale.png",
          status: "TANTOU_REVIEW",
          version: 2,
        },
      ],
      reviewSnapshot: {
        chapterVersionId: "1",
        pageVersionIds: [{ pageId: "page-p0-stale", pageVersionId: "1" }],
        frozenAt: new Date().toISOString(),
      },
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .post("/api/chapters/chapter-p0-stale/actions/EDITOR_APPROVE")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("REVIEW_SNAPSHOT_STALE");
      });
  });

  it("rejects direct Page status writes outside backend workflow commands", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");

    await request(createApp())
      .post("/api/chapters/ch-s-berserk-prod-4/pages")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ pageNumber: 99, status: "FINALIZED", fileKey: "pages/direct-status.png" })
      .expect(400)
      .expect((res) => {
        expect(res.body.code).toBe("STATUS_IMMUTABLE");
      });

    const created = await request(createApp())
      .post("/api/chapters/ch-s-berserk-prod-4/pages")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ pageNumber: 100, fileKey: "pages/backend-owned-status.png" })
      .expect(201);

    expect(created.body.data.status).toBe("UPLOADED");

    await request(createApp())
      .patch(`/api/pages/${created.body.data.id}`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ status: "FINALIZED" })
      .expect(400)
      .expect((res) => {
        expect(res.body.code).toBe("STATUS_IMMUTABLE");
      });

    await ChapterModel.updateOne(
      { "pages.id": created.body.data.id },
      { $set: { "pages.$.status": "REVISION_REQUIRED" } },
    );
    const replacement = await request(createApp())
      .patch(`/api/pages/${created.body.data.id}`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({
        fileKey: "pages/revised-page.png",
        fileUrl: "metadata://pages/revised-page.png",
        fileName: "revised-page.png",
      })
      .expect(200);

    expect(replacement.body.data.status).toBe("UPLOADED");
    expect(replacement.body.data.fileKey).toBe("pages/revised-page.png");
  });

  it("rejects cross-entity Assistant submission file attachment", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    await ChapterModel.create({
      id: "chapter-cross-file-owner",
      seriesId: "s-berserk-prod",
      number: 901,
      title: "File owner",
      status: "IN_PRODUCTION",
      pages: [
        {
          id: "page-cross-owner",
          pageNumber: 1,
          fileKey: "pages/cross-owner.png",
          status: "UPLOADED",
        },
      ],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await StudioTaskModel.create({
      id: "task-cross-attach",
      chapterId: "ch-s-berserk-prod-4",
      seriesId: "s-berserk-prod",
      pageId: "pg-cross-task",
      assigneeId: assistant.user.id,
      assigneeName: "Jun Assistant",
      status: "IN_PROGRESS",
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .post("/api/tasks/task-cross-attach/submit")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .set("Idempotency-Key", "idem-cross-attach")
      .send({
        expectedCurrentSubmissionId: null,
        fileKey: "pages/cross-owner.png",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.code).toBe("CROSS_ENTITY_ATTACHMENT");
      });
  });

  it("rejects stale AI detection results before whitening", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await ChapterModel.create({
      id: "chapter-stale-ai",
      seriesId: "s-berserk-prod",
      number: 902,
      title: "Stale AI",
      status: "IN_PRODUCTION",
      pages: [
        { id: "page-stale-ai", pageNumber: 1, fileKey: "pages/stale-ai.png", status: "UPLOADED" },
      ],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await StudioRegionModel.create({
      id: "region-stale-ai-latest",
      chapterId: "chapter-stale-ai",
      seriesId: "s-berserk-prod",
      pageId: "page-stale-ai",
      type: "speech_bubble",
      status: "DETECTED",
      metadata: { source: "ai", kind: "bubble.detect", processingId: "ai-latest" },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .post("/api/studio/pages/page-stale-ai/ai/whiten-bubbles")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ expectedProcessingId: "ai-stale" })
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("AI_RESULT_STALE");
      });
  });

  it("uses VotingSession version for optimistic concurrency on Board commands", async () => {
    const chair = await loginAs("board@beachread.jp");
    await ProposalModel.create({
      id: "prop-version-conflict",
      title: "Version Conflict",
      authorId: "u-mangaka",
      authorName: "Inoue",
      status: "PENDING_BOARD",
      currentVersion: 1,
      manuscripts: [{ id: "ms-version-conflict", version: 1 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const created = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ proposalId: "prop-version-conflict", proposalVersionId: "1" })
      .expect(201);

    await request(createApp())
      .post("/api/board/series/prop-version-conflict/votes")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ value: "APPROVE", sessionId: created.body.data.id, expectedVersion: 999 })
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("VERSION_CONFLICT");
      });

    await request(createApp())
      .post(`/api/voting-sessions/${created.body.data.id}/close`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ expectedVersion: 999 })
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("VERSION_CONFLICT");
      });
  });

  it("moves failing Outbox delivery to dead-letter after retry budget is exhausted", async () => {
    await OutboxEventModel.deleteMany({});
    await OutboxEventModel.create({
      id: "outbox-dead-letter-proof",
      type: "proof.event",
      aggregateType: "proof",
      aggregateId: "proof-1",
      payload: { ok: true },
      status: "PENDING",
      attempts: 0,
      nextAttemptAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await processOutboxBatch(
      async () => {
        throw new Error("delivery failed");
      },
      { maxAttempts: 1 },
    );

    expect(result.deadLettered).toBe(1);
    const event = await OutboxEventModel.findOne({ id: "outbox-dead-letter-proof" }).lean();
    expect((event as any)?.status).toBe("DEAD_LETTER");
    expect((event as any)?.attempts).toBe(1);
    expect((event as any)?.lastError).toContain("delivery failed");
  });

  it("delivers due events once and stops after cleanup", async () => {
    await OutboxEventModel.create({
      id: "outbox-runner-proof",
      type: "proof.event",
      aggregateType: "proof",
      aggregateId: "proof-runner",
      payload: { ok: true },
      status: "PENDING",
      nextAttemptAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const stop = startOutboxRunner(1);
    try {
      for (let attempt = 0; attempt < 50; attempt += 1) {
        const event = await OutboxEventModel.findOne({ id: "outbox-runner-proof" }).lean();
        if ((event as any)?.status === "SENT") break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      const event = await OutboxEventModel.findOne({ id: "outbox-runner-proof" }).lean();
      expect((event as any)?.status).toBe("SENT");
    } finally {
      stop();
    }

    await OutboxEventModel.create({
      id: "outbox-runner-stopped",
      type: "proof.event",
      aggregateType: "proof",
      aggregateId: "proof-stopped",
      status: "PENDING",
      nextAttemptAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    const stoppedEvent = await OutboxEventModel.findOne({ id: "outbox-runner-stopped" }).lean();
    expect((stoppedEvent as any)?.status).toBe("PENDING");
  });

  it("releases a cancelled region back to the canonical UNLOCKED state", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await StudioRegionModel.create({
      id: "region-p0-release",
      chapterId: "ch-s-berserk-prod-4",
      seriesId: "s-berserk-prod",
      taskId: "task-p0-release",
      activeTaskId: "task-p0-release",
      lockedByTaskId: "task-p0-release",
      lockStatus: "LOCKED",
      status: "IN_PROGRESS",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await StudioTaskModel.create({
      id: "task-p0-release",
      chapterId: "ch-s-berserk-prod-4",
      seriesId: "s-berserk-prod",
      regionId: "region-p0-release",
      assigneeId: "u-assist",
      status: "IN_PROGRESS",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await request(createApp())
      .post("/api/studio/tasks/task-p0-release/actions/CANCEL")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ reason: "Release test" })
      .expect(200);

    const region = (await StudioRegionModel.findOne({ id: "region-p0-release" }).lean()) as any;
    expect(region?.lockStatus).toBe("UNLOCKED");
    expect(region?.activeTaskId).toBeNull();
  });
});
