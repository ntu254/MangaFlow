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

async function boardInbox(token: string) {
  const response = await request(createApp())
    .get("/api/board/inbox")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  return response.body.data;
}

describe("mobile board workflows", () => {
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

  it("gives an ordinary member vote work but no chair actions", async () => {
    const member = await loginAs("sato@beachread.jp");
    const inbox = await boardInbox(member.accessToken);
    expect(() => mobileInboxSchema.parse(inbox)).not.toThrow();
    expect(inbox.items.length).toBeGreaterThan(0);
    expect(inbox.items.every((item: any) => item.kind === "BOARD_VOTE" || item.kind === "BOARD_REVOTE")).toBe(true);
    const actions = inbox.items.flatMap((item: any) => item.actions.map((a: any) => a.action));
    expect(actions).toContain("VOTE");
    expect(actions).not.toContain("SESSION_FINALIZE");
    expect(actions).not.toContain("AT_RISK_DECIDE");
  });

  it("gives the Chair finalize (and at-risk) capability", async () => {
    const chair = await loginAs("board@beachread.jp");
    const inbox = await boardInbox(chair.accessToken);
    const kinds = new Set(inbox.items.map((item: any) => item.kind));
    expect(kinds.has("SESSION_FINALIZE")).toBe(true);
    // Finalize is gated on quorum/decisive tally.
    const finalize = inbox.items.find((item: any) => item.kind === "SESSION_FINALIZE");
    const action = finalize.actions.find((a: any) => a.action === "SESSION_FINALIZE");
    expect(typeof action.enabled).toBe("boolean");
    if (!action.enabled) expect((action.disabledReason ?? "").length).toBeGreaterThan(0);
  });

  it("serves a board session detail with tally and version", async () => {
    const chair = await loginAs("board@beachread.jp");
    const inbox = await boardInbox(chair.accessToken);
    const voteItem = inbox.items.find(
      (item: any) => item.kind === "BOARD_VOTE" || item.kind === "BOARD_REVOTE",
    );
    expect(voteItem).toBeTruthy();
    const detail = await request(createApp())
      .get(`/api/board/sessions/${voteItem.entityId}/detail`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .expect(200);
    expect(detail.body.data.session.id).toBe(voteItem.entityId);
    expect(typeof detail.body.data.tally.quorum).toBe("number");
    expect(typeof detail.body.data.tally.canFinalize).toBe("boolean");
  });

  it("does not expose a separate mobile tie-break command", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    await request(createApp())
      .post("/api/board/series/p-005/decisions/tie-break")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ value: "APPROVE" })
      .expect(404);
  });

  it("serves read-only rankings and denies the board inbox to an editor", async () => {
    const chair = await loginAs("board@beachread.jp");
    await request(createApp())
      .get("/api/board/rankings")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .expect(200);

    const editor = await loginAs("editor@mangaflow.local");
    await request(createApp())
      .get("/api/board/inbox")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(403);
  });
});
