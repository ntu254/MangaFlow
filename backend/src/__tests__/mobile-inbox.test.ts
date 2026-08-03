import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { ProposalModel, StudioCommentModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";
import { mobileInboxSchema } from "../mobile/mobile-work-item.contract.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string; role: string } };
}

describe("mobile inbox projections", () => {
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

  it("returns only proposal work to an Editor in the foundation slice", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const response = await request(createApp())
      .get("/api/editor/inbox")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    expect(response.body.data.items.length).toBeGreaterThan(0);
    expect(
      response.body.data.items.every((item: any) => item.kind === "PROPOSAL_REVIEW"),
    ).toBe(true);
    expect(() => mobileInboxSchema.parse(response.body.data)).not.toThrow();
    // No Assistant-submission approval or Board-only actions leak into Editor foundation slice.
    const actions = response.body.data.items.flatMap((item: any) => item.actions);
    expect(actions.every((action: any) => action.action !== "EDITOR_APPROVE")).toBe(true);
  });

  it("exposes RELEASE_CLAIM only to the Editor who owns the claim", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const proposal = await ProposalModel.findOne({
      status: { $in: ["PENDING_EDITOR", "EDITOR_REVIEWING", "RESUBMITTED"] },
    });
    expect(proposal).toBeTruthy();

    await ProposalModel.updateOne(
      { id: (proposal as any).id },
      {
        $set: {
          claimedByEditorId: editor.user.id,
          claimedByEditorName: "Tanaka Akira",
          claimedAt: new Date(),
        },
      },
    );

    const response = await request(createApp())
      .get("/api/editor/inbox")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);
    const item = response.body.data.items.find(
      (candidate: any) => candidate.entityId === (proposal as any).id,
    );
    expect(item).toBeTruthy();
    expect(item.actions).toContainEqual(
      expect.objectContaining({ action: "RELEASE_CLAIM", enabled: true }),
    );
  });

  it("shows addressed blocking comments created by a previous Tantou", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    await StudioCommentModel.create({
      id: "comment-previous-tantou",
      seriesId: "s-berserk-prod",
      chapterId: "ch-s-berserk-prod-4",
      targetType: "CHAPTER",
      targetId: "ch-s-berserk-prod-4",
      authorId: "u-previous-editor",
      authorName: "Previous Editor",
      authorRole: "editor",
      body: "Please verify this correction.",
      status: "ADDRESSED",
      isBlocking: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(createApp())
      .get("/api/editor/inbox")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    expect(
      response.body.data.items.some(
        (item: any) => item.kind === "COMMENT_REVIEW" && item.entityId === "comment-previous-tantou",
      ),
    ).toBe(true);
  });

  it("returns Board vote and re-vote work with a VOTE action", async () => {
    const board = await loginAs("sato@beachread.jp");
    const response = await request(createApp())
      .get("/api/board/inbox")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);

    expect(response.body.data.role).toBe("BOARD");
    expect(response.body.data.items.length).toBeGreaterThan(0);
    expect(
      response.body.data.items.every((item: any) =>
        ["BOARD_VOTE", "BOARD_REVOTE"].includes(item.kind),
      ),
    ).toBe(true);
    expect(() => mobileInboxSchema.parse(response.body.data)).not.toThrow();
    const actions = response.body.data.items.flatMap((item: any) => item.actions);
    expect(actions.some((action: any) => action.action === "VOTE")).toBe(true);
  });

  it("does not expose Chair/finalize actions to an ordinary Board member", async () => {
    const board = await loginAs("sato@beachread.jp");
    const response = await request(createApp())
      .get("/api/board/inbox")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);
    expect(
      response.body.data.items
        .flatMap((item: any) => item.actions)
        .some((action: any) => action.action === "SESSION_FINALIZE"),
    ).toBe(false);
  });

  it.each(["jun@beachread.jp", "admin@beachread.jp"])(
    "denies unsupported mobile role %s on the Editor inbox",
    async (email) => {
      const user = await loginAs(email);
      await request(createApp())
        .get("/api/editor/inbox")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .expect(403);
    },
  );

  it("denies an Editor on the Board inbox and a Board member on the Editor inbox", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const board = await loginAs("sato@beachread.jp");

    await request(createApp())
      .get("/api/board/inbox")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(403);
    await request(createApp())
      .get("/api/editor/inbox")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(403);
  });
});
