import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import { mobileInboxSchema } from "../mobile/mobile-work-item.contract.js";
import {
  AuditEntryModel,
  ChapterModel,
  ProposalModel,
  SeriesModel,
  StudioCommentModel,
  StudioRegionModel,
  StudioTaskModel,
  SubmissionModel,
} from "../db/models.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string } };
}

async function editorInbox(token: string) {
  const response = await request(createApp())
    .get("/api/editor/inbox")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  return response.body.data;
}

describe("mobile editor workflows", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => {
    await seedDatabase();
  }, 30_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  }, 30_000);

  it("returns a schema-valid Editor inbox with proposal and workflow kinds", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const inbox = await editorInbox(editor.accessToken);

    expect(() => mobileInboxSchema.parse(inbox)).not.toThrow();
    const kinds = new Set(inbox.items.map((item: any) => item.kind));
    // Foundation proposal work is still present.
    expect(kinds.has("PROPOSAL_REVIEW")).toBe(true);
    // Every emitted item is an Editor-appropriate kind (no Board vote leakage).
    for (const kind of kinds) {
      expect(["PROPOSAL_REVIEW", "CHAPTER_REVIEW", "COMMENT_REVIEW", "PUBLICATION"]).toContain(kind);
    }
  });

  it("returns only the authenticated Editor's auditable editorial actions with real context", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const proposal = await ProposalModel.findOne({}).lean();
    const chapter = await ChapterModel.findOne({ id: "ch-s-berserk-prod-5" }).lean();
    const series = await SeriesModel.findOne({ id: (chapter as any).seriesId }).lean();
    const [region, task, submission] = await Promise.all([
      StudioRegionModel.findOne({ chapterId: (chapter as any).id }).lean(),
      StudioTaskModel.findOne({ chapterId: (chapter as any).id }).lean(),
      SubmissionModel.findOne({ chapterId: (chapter as any).id }).lean(),
    ]);
    const comment = await StudioCommentModel.create({
      id: "activity-comment",
      seriesId: (series as any).id,
      chapterId: (chapter as any).id,
      targetType: "CHAPTER",
      targetId: (chapter as any).id,
      authorId: editor.user.id,
      authorName: "Tanaka Akira",
      authorRole: "editor",
      body: "Clarify the final panel.",
      status: "OPEN",
      createdAt: new Date("2026-08-04T08:00:00.000Z"),
      updatedAt: new Date("2026-08-04T08:00:00.000Z"),
    });
    const indirectComments = await StudioCommentModel.insertMany([
      {
        id: "activity-comment-page",
        targetType: "PAGE",
        targetId: (chapter as any).pages[0].id,
        authorId: editor.user.id,
        authorName: "Tanaka Akira",
        authorRole: "editor",
        body: "Adjust the page composition.",
        status: "OPEN",
      },
      {
        id: "activity-comment-region",
        targetType: "REGION",
        targetId: (region as any).id,
        authorId: editor.user.id,
        authorName: "Tanaka Akira",
        authorRole: "editor",
        body: "Rework the selected region.",
        status: "OPEN",
      },
      {
        id: "activity-comment-task",
        targetType: "TASK",
        targetId: (task as any).id,
        authorId: editor.user.id,
        authorName: "Tanaka Akira",
        authorRole: "editor",
        body: "Review the assigned task.",
        status: "OPEN",
      },
      {
        id: "activity-comment-submission",
        targetType: "SUBMISSION",
        targetId: (submission as any).id,
        authorId: editor.user.id,
        authorName: "Tanaka Akira",
        authorRole: "editor",
        body: "Polish the submitted revision.",
        status: "OPEN",
      },
    ]);

    await AuditEntryModel.insertMany([
      {
        id: "activity-proposal",
        actorId: editor.user.id,
        actorRole: "EDITOR",
        action: "PROPOSAL_FORWARDED_TO_BOARD",
        entityType: "proposal",
        entityId: (proposal as any).id,
        metadata: { toStatus: "PENDING_BOARD" },
        createdAt: new Date("2026-08-04T09:00:00.000Z"),
      },
      {
        id: "activity-chapter",
        actorId: editor.user.id,
        actorRole: "EDITOR",
        action: "CHAPTER_TANTOU_REVISION_REQUESTED",
        entityType: "chapter",
        entityId: (chapter as any).id,
        metadata: { toStatus: "REVISION_REQUIRED" },
        createdAt: new Date("2026-08-04T08:45:00.000Z"),
      },
      {
        id: "activity-comment-row",
        actorId: editor.user.id,
        actorRole: "EDITOR",
        action: "comment.create",
        entityType: "comment",
        entityId: (comment as any).id,
        createdAt: new Date("2026-08-04T08:30:00.000Z"),
      },
      ...indirectComments.map((indirectComment: any, index) => ({
        id: `${indirectComment.id}-row`,
        actorId: editor.user.id,
        actorRole: "EDITOR",
        action: "comment.create",
        entityType: "comment",
        entityId: indirectComment.id,
        createdAt: new Date(`2026-08-04T08:2${9 - index}:00.000Z`),
      })),
      {
        id: "activity-publication",
        actorId: editor.user.id,
        actorRole: "EDITOR",
        action: "PUBLICATION_SCHEDULED",
        entityType: "publication",
        entityId: (chapter as any).id,
        metadata: { scheduledAt: "2026-08-05T09:00:00.000Z" },
        createdAt: new Date("2026-08-04T08:15:00.000Z"),
      },
      {
        id: "activity-other-editor",
        actorId: "u-another-editor",
        actorRole: "EDITOR",
        action: "CHAPTER_PUBLISHED",
        entityType: "chapter",
        entityId: (chapter as any).id,
        createdAt: new Date("2026-08-04T10:00:00.000Z"),
      },
      {
        id: "activity-wrong-role",
        actorId: editor.user.id,
        actorRole: "MANGAKA",
        action: "CHAPTER_PUBLISHED",
        entityType: "chapter",
        entityId: (chapter as any).id,
        createdAt: new Date("2026-08-04T10:15:00.000Z"),
      },
    ]);

    const response = await request(createApp())
      .get("/api/editor/activity")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    const commentActivity = response.body.data.filter((item: any) => item.area === "COMMENT");
    expect(commentActivity).toHaveLength(5);
    for (const item of commentActivity) {
      expect(item).toMatchObject({
        seriesTitle: (series as any).title,
        chapterNumber: (chapter as any).number,
      });
    }
    expect(response.body.data.map((item: any) => item.id)).toEqual([
      "activity-proposal",
      "activity-chapter",
      "activity-comment-row",
      "activity-comment-page-row",
      "activity-comment-region-row",
      "activity-comment-task-row",
      "activity-comment-submission-row",
      "activity-publication",
    ]);
    expect(response.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "activity-proposal",
        action: "PROPOSAL_FORWARDED_TO_BOARD",
        area: "PROPOSAL",
        subject: (proposal as any).title,
        outcome: "PENDING_BOARD",
      }),
      expect.objectContaining({
        id: "activity-chapter",
        area: "CHAPTER",
        subject: `${(series as any).title} · Chapter ${(chapter as any).number}`,
        seriesTitle: (series as any).title,
        chapterNumber: (chapter as any).number,
      }),
      expect.objectContaining({
        id: "activity-comment-row",
        area: "COMMENT",
        subject: `${(series as any).title} · Chapter ${(chapter as any).number}`,
      }),
      expect.objectContaining({
        id: "activity-publication",
        area: "PUBLICATION",
        subject: `${(series as any).title} · Chapter ${(chapter as any).number}`,
      }),
    ]));
  });

  it("returns 50 classified records when newer redundant chapter audits exceed the cap", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const chapterId = "ch-s-berserk-prod-5";
    await AuditEntryModel.deleteMany({ actorId: editor.user.id, actorRole: "EDITOR" });
    await AuditEntryModel.insertMany([
      ...Array.from({ length: 55 }, (_, index) => ({
        id: `activity-cap-redundant-${index}`,
        actorId: editor.user.id,
        actorRole: "EDITOR",
        action: "chapter.editor_approve",
        entityType: "chapter",
        entityId: chapterId,
        createdAt: new Date(Date.UTC(2026, 7, 5, 12, 0, index)),
      })),
      ...Array.from({ length: 50 }, (_, index) => ({
        id: `activity-cap-classified-${index}`,
        actorId: editor.user.id,
        actorRole: "EDITOR",
        action: "CHAPTER_TANTOU_REVISION_REQUESTED",
        entityType: "chapter",
        entityId: chapterId,
        createdAt: new Date(Date.UTC(2026, 7, 4, 12, 0, index)),
      })),
    ]);

    const response = await request(createApp())
      .get("/api/editor/activity")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    expect(response.body.data).toHaveLength(50);
    expect(response.body.data.every((item: any) => item.area === "CHAPTER")).toBe(true);
    expect(response.body.data.map((item: any) => item.id)).toEqual(
      Array.from({ length: 50 }, (_, index) => `activity-cap-classified-${49 - index}`),
    );
  });

  it("never exposes an Assistant-submission approval action to the Editor", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const inbox = await editorInbox(editor.accessToken);
    const actions = inbox.items.flatMap((item: any) => item.actions.map((a: any) => a.action));
    // Editor mobile reviews chapters via EDITOR_APPROVE; it never approves an
    // Assistant submission (that is Mangaka-owned).
    expect(actions).not.toContain("SUBMISSION_APPROVE");
  });

  it("every disabled action carries a non-empty reason and every enabled one none", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const inbox = await editorInbox(editor.accessToken);
    for (const item of inbox.items) {
      for (const action of item.actions) {
        if (action.enabled) expect(action.disabledReason).toBeNull();
        else expect((action.disabledReason ?? "").length).toBeGreaterThan(0);
      }
    }
  });

  it("serves a proposal detail with capability descriptors to the Editor", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const inbox = await editorInbox(editor.accessToken);
    const proposalItem = inbox.items.find((item: any) => item.kind === "PROPOSAL_REVIEW");
    expect(proposalItem).toBeTruthy();

    const response = await request(createApp())
      .get(`/api/editor/proposals/${proposalItem.entityId}/detail`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);
    const detail = response.body.data;
    expect(detail.proposal.id).toBe(proposalItem.entityId);
    expect(detail.actions.map((a: any) => a.action)).toEqual(
      expect.arrayContaining(["CLAIM", "REQUEST_CHANGES", "REJECT", "FORWARD"]),
    );
  });

  it("returns every stored editorial checklist value in a claimed proposal detail", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const inbox = await editorInbox(editor.accessToken);
    const proposalItem = inbox.items.find((item: any) => item.kind === "PROPOSAL_REVIEW");
    const checklist = {
      hook: true,
      characterMotivation: false,
      audienceFit: true,
      storyboardFlow: false,
      manuscriptQuality: true,
      serializePotential: false,
    };

    await request(createApp())
      .post(`/api/proposals/${proposalItem.entityId}/actions/CLAIM`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200);
    await request(createApp())
      .post(`/api/proposals/${proposalItem.entityId}/actions/UPDATE_EDITORIAL_CHECKLIST`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ editorialChecklist: checklist })
      .expect(200);

    const response = await request(createApp())
      .get(`/api/editor/proposals/${proposalItem.entityId}/detail`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    expect(response.body.data.editorialChecklist).toMatchObject(checklist);
  });

  it("exposes publication capability to the assigned Tantou", async () => {
    // Tanaka is the assigned editor for the seeded production series, so their
    // inbox includes chapter/publication work.
    const editor = await loginAs("tanaka@beachread.jp");
    const inbox = await editorInbox(editor.accessToken);
    const publication = inbox.items.find((item: any) => item.kind === "PUBLICATION");
    if (publication) {
      const schedule = publication.actions.find((a: any) => a.action === "SCHEDULE");
      expect(schedule).toMatchObject({ enabled: true, requiresConfirmation: true, requiresReason: false });
    }
    const chapterReview = inbox.items.find((item: any) => item.kind === "CHAPTER_REVIEW");
    if (chapterReview) {
      expect(chapterReview.actions.map((a: any) => a.action)).toEqual(
        expect.arrayContaining(["REQUEST_REVISION", "REJECT", "EDITOR_APPROVE"]),
      );
    }
    // At least one of chapter/publication work must exist for the assigned editor.
    expect(Boolean(publication) || Boolean(chapterReview)).toBe(true);
  });

  it("denies proposal/chapter detail to a non-editor role", async () => {
    const board = await loginAs("sato@beachread.jp");
    await request(createApp())
      .get("/api/editor/proposals/p-002/detail")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(403);
    await request(createApp())
      .get("/api/editor/chapters/any/detail")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(403);
  });
});
