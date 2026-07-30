import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import { mobileInboxSchema } from "../mobile/mobile-work-item.contract.js";

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
