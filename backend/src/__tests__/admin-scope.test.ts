import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import { NotificationModel, ProposalModel, SeriesModel } from "../db/models.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as {
    accessToken: string;
    user: { id: string; role: string };
  };
}

describe("CT-11 admin scope reduction", () => {
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

  it("rejects ADMIN importing rankings (403)", async () => {
    const admin = await loginAs("admin@beachread.jp");
    await request(createApp())
      .post("/api/rankings/import")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ period: "2026-W30", source: "SURVEY", rows: [{ seriesId: "s-berserk-prod", score: 9 }] })
      .expect(403);
  });

  it("does not expose editorial or production records to ADMIN", async () => {
    const admin = await loginAs("admin@beachread.jp");

    const proposals = await request(createApp())
      .get("/api/proposals")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(proposals.body.data).toEqual([]);

    await request(createApp())
      .get("/api/series/s-berserk-prod")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(403);

    const materials = await request(createApp())
      .get("/api/materials")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(materials.body.data).toEqual([]);

    const submissions = await request(createApp())
      .get("/api/submissions")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(submissions.body.data).toEqual([]);

    await request(createApp())
      .get("/api/rankings")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(403);
  });

  it("keeps personal notification state owner-only", async () => {
    const admin = await loginAs("admin@beachread.jp");
    await NotificationModel.create({
      id: "notification-owner-only",
      userId: "u-mangaka",
      kind: "workflow.private",
      title: "Private notification",
      message: "Owner state must remain private.",
      status: "SENT",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(createApp())
      .post("/api/notifications/notification-owner-only/read")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(403);
    await request(createApp())
      .post("/api/notifications/notification-owner-only/archive")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(403);
  });

  describe("Tantou assign/remove is EIC-only", () => {
    it("rejects ADMIN assigning a Tantou (403)", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .post("/api/series/s-vinland-prod/editor")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ editorId: "u-mobile-editor", editorName: "Mobile Editor" })
        .expect(403);
    });

    it("rejects a non-chief BOARD member assigning a Tantou (403)", async () => {
      const board = await loginAs("board@beachread.jp");
      await request(createApp())
        .post("/api/series/s-vinland-prod/editor")
        .set("Authorization", `Bearer ${board.accessToken}`)
        .send({ editorId: "u-mobile-editor", editorName: "Mobile Editor" })
        .expect(403);
    });

    it("rejects ADMIN removing a Tantou (403)", async () => {
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .delete("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(403);
    });

    it("allows the Editor-in-Chief to remove and reassign a Tantou", async () => {
      const eic = await loginAs("tanaka@beachread.jp");
      await request(createApp())
        .delete("/api/series/s-vinland-prod/editor")
        .set("Authorization", `Bearer ${eic.accessToken}`)
        .expect(200);

      const response = await request(createApp())
        .post("/api/series/s-vinland-prod/editor")
        .set("Authorization", `Bearer ${eic.accessToken}`)
        .send({ editorId: "u-mobile-editor", editorName: "Mobile Editor" })
        .expect(200);
      expect(response.body.data.userId).toBe("u-mobile-editor");
    });
  });

  describe("Series lifecycle §3.1 matrix", () => {
    async function makeSeries(id: string, status: string) {
      await SeriesModel.create({
        id,
        slug: id,
        title: `Admin scope series ${id}`,
        authorId: "u-mangaka",
        authorName: "Inoue Takehiko",
        editorId: "u-mobile-editor",
        editorName: "Mobile Editor",
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    it("rejects ADMIN on START_PRODUCTION/UNPUBLISH/ARCHIVE (403)", async () => {
      await makeSeries("s-admin-scope-start", "PRE_PRODUCTION");
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .post("/api/series/s-admin-scope-start/actions/START_PRODUCTION")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({})
        .expect(403);
      await request(createApp())
        .post("/api/series/s-admin-scope-start/actions/UNPUBLISH")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({})
        .expect(403);
      await request(createApp())
        .post("/api/series/s-admin-scope-start/actions/ARCHIVE")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({})
        .expect(403);
    });

    it("rejects the owning Mangaka from unpublishing (Tantou-only)", async () => {
      await makeSeries("s-admin-scope-unpub", "ONGOING");
      const mangaka = await loginAs("inoue@beachread.jp");
      const response = await request(createApp())
        .post("/api/series/s-admin-scope-unpub/actions/UNPUBLISH")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({})
        .expect(403);
      expect(response.body.code).toBe("TANTOU_ASSIGNMENT_REQUIRED");
    });

    it("allows the assigned Tantou to unpublish", async () => {
      await makeSeries("s-admin-scope-unpub-ok", "ONGOING");
      const tantou = await loginAs("editor@mangaflow.local");
      await request(createApp())
        .post("/api/series/s-admin-scope-unpub-ok/actions/UNPUBLISH")
        .set("Authorization", `Bearer ${tantou.accessToken}`)
        .send({})
        .expect(200);
    });

    it("rejects the owning Mangaka from archiving a published series (Tantou-only once public)", async () => {
      await makeSeries("s-admin-scope-archive-public", "ONGOING");
      const mangaka = await loginAs("inoue@beachread.jp");
      const response = await request(createApp())
        .post("/api/series/s-admin-scope-archive-public/actions/ARCHIVE")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({})
        .expect(403);
      expect(response.body.code).toBe("TANTOU_ASSIGNMENT_REQUIRED");
    });

    it("allows the assigned Tantou to archive a published series", async () => {
      await makeSeries("s-admin-scope-archive-public-ok", "ONGOING");
      const tantou = await loginAs("editor@mangaflow.local");
      await request(createApp())
        .post("/api/series/s-admin-scope-archive-public-ok/actions/ARCHIVE")
        .set("Authorization", `Bearer ${tantou.accessToken}`)
        .send({})
        .expect(200);
    });

    it("allows the owning Mangaka to archive a series that was never published", async () => {
      await makeSeries("s-admin-scope-archive-private", "PLANNING");
      const mangaka = await loginAs("inoue@beachread.jp");
      await request(createApp())
        .post("/api/series/s-admin-scope-archive-private/actions/ARCHIVE")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({})
        .expect(200);
    });

    it("allows the assigned Tantou to archive a series that was never published", async () => {
      await makeSeries("s-admin-scope-archive-private-tantou", "PLANNING");
      const tantou = await loginAs("editor@mangaflow.local");
      await request(createApp())
        .post("/api/series/s-admin-scope-archive-private-tantou/actions/ARCHIVE")
        .set("Authorization", `Bearer ${tantou.accessToken}`)
        .send({})
        .expect(200);
    });
  });

  describe("Proposal RELEASE_CLAIM/REASSIGN_CLAIM is EIC-only", () => {
    async function makeClaimedProposal(id: string) {
      await ProposalModel.create({
        id,
        title: `Claimed proposal ${id}`,
        authorId: "u-mangaka",
        authorName: "Inoue Takehiko",
        status: "EDITOR_REVIEWING",
        claimedByEditorId: "u-mobile-editor",
        claimedByEditorName: "Mobile Editor",
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    it("rejects ADMIN releasing a claim (403)", async () => {
      await makeClaimedProposal("prop-admin-scope-release");
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .post("/api/proposals/prop-admin-scope-release/actions/RELEASE_CLAIM")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({})
        .expect(403);
    });

    it("rejects a non-chief Editor releasing a claim (403)", async () => {
      await makeClaimedProposal("prop-admin-scope-release-editor");
      const editor = await loginAs("editor@mangaflow.local");
      await request(createApp())
        .post("/api/proposals/prop-admin-scope-release-editor/actions/RELEASE_CLAIM")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({})
        .expect(403);
    });

    it("allows the Editor-in-Chief to release a claim", async () => {
      await makeClaimedProposal("prop-admin-scope-release-eic");
      const eic = await loginAs("tanaka@beachread.jp");
      await request(createApp())
        .post("/api/proposals/prop-admin-scope-release-eic/actions/RELEASE_CLAIM")
        .set("Authorization", `Bearer ${eic.accessToken}`)
        .send({})
        .expect(200);
    });
  });

  describe("Proposal ARCHIVE is owning Mangaka or EIC, with a required reason", () => {
    async function makeArchivableProposal(id: string, authorId = "u-mangaka") {
      await ProposalModel.create({
        id,
        title: `Archivable proposal ${id}`,
        authorId,
        authorName: "Inoue Takehiko",
        status: "SUBMITTED",
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    it("rejects ADMIN archiving a proposal (403)", async () => {
      await makeArchivableProposal("prop-admin-scope-archive-admin");
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .post("/api/proposals/prop-admin-scope-archive-admin/actions/ARCHIVE")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ reason: "Cleanup" })
        .expect(403);
    });

    it("rejects a non-owning Mangaka archiving another author's proposal (403)", async () => {
      await makeArchivableProposal("prop-admin-scope-archive-other-owner");
      const otherMangaka = await loginAs("inoue@beachread.jp");
      // Reassign author away from the acting user to trip the ownership check.
      await ProposalModel.updateOne(
        { id: "prop-admin-scope-archive-other-owner" },
        { $set: { authorId: "someone-else" } },
      );
      await request(createApp())
        .post("/api/proposals/prop-admin-scope-archive-other-owner/actions/ARCHIVE")
        .set("Authorization", `Bearer ${otherMangaka.accessToken}`)
        .send({ reason: "Cleanup" })
        .expect(403);
    });

    it("rejects an empty reason with 400 REASON_REQUIRED", async () => {
      await makeArchivableProposal("prop-admin-scope-archive-noreason");
      const mangaka = await loginAs("inoue@beachread.jp");
      const response = await request(createApp())
        .post("/api/proposals/prop-admin-scope-archive-noreason/actions/ARCHIVE")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({})
        .expect(400);
      expect(response.body.code).toBe("REASON_REQUIRED");
    });

    it("allows the owning Mangaka to archive with a reason, and records it", async () => {
      await makeArchivableProposal("prop-admin-scope-archive-owner");
      const mangaka = await loginAs("inoue@beachread.jp");
      const response = await request(createApp())
        .post("/api/proposals/prop-admin-scope-archive-owner/actions/ARCHIVE")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ reason: "No longer relevant" })
        .expect(200);
      expect(response.body.data.status).toBe("ARCHIVED");
      expect(response.body.data.archiveReason).toBe("No longer relevant");
    });

    it("allows the Editor-in-Chief to archive with a reason", async () => {
      await makeArchivableProposal("prop-admin-scope-archive-eic");
      const eic = await loginAs("tanaka@beachread.jp");
      await request(createApp())
        .post("/api/proposals/prop-admin-scope-archive-eic/actions/ARCHIVE")
        .set("Authorization", `Bearer ${eic.accessToken}`)
        .send({ reason: "Superseded" })
        .expect(200);
    });
  });

  describe("File presign-download no longer bypassed by ADMIN", () => {
    it("rejects ADMIN presigning a file download (403)", async () => {
      await ProposalModel.updateOne(
        { id: "p-001" },
        { $set: { status: "DRAFT", coverFileKey: "proposals/p-001/cover.png" } },
      );
      const admin = await loginAs("admin@beachread.jp");
      await request(createApp())
        .post("/api/files/presign-download")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ key: "proposals/p-001/cover.png" })
        .expect(403);
    });
  });
});
