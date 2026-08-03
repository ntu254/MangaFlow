import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import { AuditEntryModel, NotificationModel, RankingModel } from "../db/models.js";

let mongo: MongoMemoryReplSet;
const AT_RISK_RANKING = "rank-002"; // seeded AT_RISK ranking for s-vinland-prod
const SERIES = "s-vinland-prod";

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string };
}

describe("at-risk decision service", () => {
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

  it.each(["CONTINUE", "WARNING", "REQUEST_IMPROVEMENT_PLAN", "CANCEL"] as const)(
    "records supported Chair decision %s with an audit trail and notification",
    async (decision) => {
      const chair = await loginAs("board@beachread.jp");
      const note = decision === "CANCEL" ? "The Board has manually decided to cancel this title." : "Board review completed.";
      const response = await request(createApp())
        .post(`/api/board/series/${SERIES}/at-risk-decisions`)
        .set("Authorization", `Bearer ${chair.accessToken}`)
        .send({ rankingId: AT_RISK_RANKING, decision, note })
        .expect(200);

      expect(response.body.data).toMatchObject({ seriesId: SERIES, rankingId: AT_RISK_RANKING, decision });
      const ranking = (await RankingModel.findOne({ id: AT_RISK_RANKING }).lean()) as any;
      expect(ranking.metadata.atRiskDecision).toMatchObject({
        decision,
        note,
        decidedById: "u-board",
        decidedByName: "Yamamoto Director",
      });
      expect(ranking.metadata.atRiskDecision.decidedAt).toBeTruthy();
      await expect(
        AuditEntryModel.findOne({ action: "ranking.at_risk_decision", entityId: SERIES }).lean(),
      ).resolves.toMatchObject({
        metadata: expect.objectContaining({ decision, note, decidedBy: "u-board", timestamp: expect.anything() }),
      });
      await expect(NotificationModel.exists({ kind: "ranking.at_risk_decision" })).resolves.toBeTruthy();
    },
  );

  it("rejects COMPLETE and arbitrary decision values with a validation error", async () => {
    const chair = await loginAs("board@beachread.jp");
    for (const decision of ["COMPLETE", "MAYBE"]) {
      const response = await request(createApp())
        .post(`/api/board/series/${SERIES}/at-risk-decisions`)
        .set("Authorization", `Bearer ${chair.accessToken}`)
        .send({ rankingId: AT_RISK_RANKING, decision })
        .expect(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
    }
  });

  it("requires a non-empty reason for a manual cancellation", async () => {
    const chair = await loginAs("board@beachread.jp");
    for (const note of [undefined, "   "]) {
      const response = await request(createApp())
        .post(`/api/board/series/${SERIES}/at-risk-decisions`)
        .set("Authorization", `Bearer ${chair.accessToken}`)
        .send({ rankingId: AT_RISK_RANKING, decision: "CANCEL", note })
        .expect(400);
      expect(response.body.code).toBe("REASON_REQUIRED");
    }
  });

  it("rejects a ranking that is not at risk", async () => {
    const chair = await loginAs("board@beachread.jp");
    await request(createApp())
      .post(`/api/board/series/s-berserk-prod/at-risk-decisions`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ rankingId: "rank-001", decision: "CONTINUE" })
      .expect(409);
  });

  it("denies a non-chair board member", async () => {
    const member = await loginAs("sato@beachread.jp");
    await request(createApp())
      .post(`/api/board/series/${SERIES}/at-risk-decisions`)
      .set("Authorization", `Bearer ${member.accessToken}`)
      .send({ rankingId: AT_RISK_RANKING, decision: "CONTINUE" })
      .expect(403);
  });
});
