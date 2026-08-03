import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import { NotificationModel, ProposalModel, SeriesModel, ChapterModel } from "../db/models.js";

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
      .expect(404);
  });

  it("deletes an admin broadcast batch instead of archiving its notifications", async () => {
    await NotificationModel.create([
      {
        id: "notification-delete-batch-1",
        userId: "u-mangaka",
        kind: "admin.broadcast",
        title: "Batch cleanup",
        message: "First recipient",
        batchId: "batch-delete-notification",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "notification-delete-batch-2",
        userId: "u-editor",
        kind: "admin.broadcast",
        title: "Batch cleanup",
        message: "Second recipient",
        batchId: "batch-delete-notification",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const admin = await loginAs("admin@beachread.jp");

    const response = await request(createApp())
      .delete("/api/admin/notifications/notification-delete-batch-1")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: "notification-delete-batch-1",
      batchId: "batch-delete-notification",
      deletedCount: 2,
    });
    expect(await NotificationModel.countDocuments({ batchId: "batch-delete-notification" })).toBe(0);
  });

  describe("Tantou assign/remove is owning-Mangaka-only", () => {
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
      const response = await request(createApp())
        .post("/api/series/s-admin-scope-archive-public-ok/actions/ARCHIVE")
        .set("Authorization", `Bearer ${tantou.accessToken}`)
        .send({})
        .expect(200);

      expect(response.body.data.status).toBe("ARCHIVED");
      expect(response.body.data.visibility).toBe("UNLISTED");
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

  describe("Archived series is immutable", () => {
    async function makeArchivedSeries(id: string) {
      await SeriesModel.create({
        id,
        slug: id,
        title: `Archived series ${id}`,
        authorId: "u-mangaka",
        authorName: "Inoue Takehiko",
        editorId: "u-mobile-editor",
        editorName: "Mobile Editor",
        status: "ARCHIVED",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    it("rejects PATCH on an archived series (409 SERIES_ARCHIVED)", async () => {
      await makeArchivedSeries("s-admin-scope-archived-patch");
      const mangaka = await loginAs("inoue@beachread.jp");
      const response = await request(createApp())
        .patch("/api/series/s-admin-scope-archived-patch")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ title: "Renamed after archive" })
        .expect(409);
      expect(response.body.code).toBe("SERIES_ARCHIVED");
    });

    it("rejects PATCH on a chapter of an archived series (409 SERIES_ARCHIVED)", async () => {
      await makeArchivedSeries("s-admin-scope-archived-chapter");
      await ChapterModel.create({
        id: "ch-admin-scope-archived",
        seriesId: "s-admin-scope-archived-chapter",
        number: 1,
        title: "Archived chapter",
        status: "PLANNED",
        pages: [],
        history: [],
      });
      const mangaka = await loginAs("inoue@beachread.jp");
      const response = await request(createApp())
        .patch("/api/chapters/ch-admin-scope-archived")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ title: "Edited after archive" })
        .expect(409);
      expect(response.body.code).toBe("SERIES_ARCHIVED");
    });
  });

  describe("Proposal claim release is restricted to the claiming Editor", () => {
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

    it("allows the claiming Editor to release a claim", async () => {
      await makeClaimedProposal("prop-admin-scope-release-editor");
      const editor = await loginAs("editor@mangaflow.local");
      await request(createApp())
        .post("/api/proposals/prop-admin-scope-release-editor/actions/RELEASE_CLAIM")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({})
        .expect(200);
    });

  });

  describe("Proposal ARCHIVE is owning Mangaka-only, with a required reason", () => {
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
