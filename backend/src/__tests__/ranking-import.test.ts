import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { RankingModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string; role: string } };
}

describe("Ranking import cadence and period handling", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => {
    await seedDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("imports a monthly period with canonical cadence and computes ranks", async () => {
    const board = await loginAs("board@beachread.jp");
    const res = await request(createApp())
      .post("/api/rankings/import")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({
        period: "2026-08",
        cadence: "MONTHLY",
        source: "SURVEY",
        rows: [
          { seriesId: "s-berserk-prod", score: 9.7, votes: 1200 },
          { seriesId: "s-vinland-prod", score: 8.2, votes: 800 },
        ],
      })
      .expect(200);

    expect(res.body.data).toMatchObject({ period: "2026-08", successRows: 2, totalRows: 2 });
    const berserk = (await RankingModel.findOne({ seriesId: "s-berserk-prod", period: "2026-08", active: true }).lean()) as any;
    expect(berserk).toMatchObject({ cadence: "MONTHLY", finalScore: 9.7, rank: 1 });
    const vinland = (await RankingModel.findOne({ seriesId: "s-vinland-prod", period: "2026-08", active: true }).lean()) as any;
    expect(vinland).toMatchObject({ cadence: "MONTHLY", finalScore: 8.2, rank: 2 });
  });

  it("infers weekly cadence from the period format without an explicit cadence", async () => {
    const board = await loginAs("board@beachread.jp");
    await request(createApp())
      .post("/api/rankings/import")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({
        period: "2026-W28",
        source: "SURVEY",
        rows: [{ seriesId: "s-berserk-prod", score: 9.1, votes: 900 }],
      })
      .expect(200);

    const ranking = (await RankingModel.findOne({ seriesId: "s-berserk-prod", period: "2026-W28", active: true }).lean()) as any;
    expect(ranking.cadence).toBe("WEEKLY");
  });

  it("re-importing a historical period recomputes ranks immediately", async () => {
    const board = await loginAs("board@beachread.jp");
    const app = createApp();
    const payload = {
      period: "2025-11",
      cadence: "MONTHLY",
      source: "SURVEY",
      rows: [
        { seriesId: "s-berserk-prod", score: 9.0, votes: 1000 },
        { seriesId: "s-vinland-prod", score: 8.5, votes: 700 },
      ],
    };

    await request(app)
      .post("/api/rankings/import")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send(payload)
      .expect(200);

    const reimport = await request(app)
      .post("/api/rankings/import")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({
        ...payload,
        rows: [
          { seriesId: "s-berserk-prod", score: 7.0, votes: 1000 },
          { seriesId: "s-vinland-prod", score: 8.5, votes: 700 },
        ],
      })
      .expect(200);

    expect(reimport.body.data).toMatchObject({ successRows: 2, failedRows: 0 });
    // Sprint 3.1 / RANK-001 — only the active batch is exposed to readers.
    // Each (period, seriesId) keeps a single active row from the latest
    // import; older rows remain on disk but are filtered out.
    const activeRows = await RankingModel.countDocuments({ period: "2025-11", active: true });
    expect(activeRows).toBe(2);
    const berserk = (await RankingModel.findOne({ seriesId: "s-berserk-prod", period: "2025-11", active: true }).lean()) as any;
    const vinland = (await RankingModel.findOne({ seriesId: "s-vinland-prod", period: "2025-11", active: true }).lean()) as any;
    expect(berserk.finalScore).toBe(7.0);
    expect(vinland.rank).toBe(1);
    expect(berserk.rank).toBe(2);
  });

  it("deactivates previous active batch when a new import lands", async () => {
    const board = await loginAs("board@beachread.jp");
    const app = createApp();
    const period = "2026-09";

    await request(app)
      .post("/api/rankings/import")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({
        period,
        cadence: "MONTHLY",
        source: "SURVEY",
        rows: [{ seriesId: "s-berserk-prod", score: 8.0, votes: 1000 }],
      })
      .expect(200);

    const firstBatchId = (await RankingModel.findOne({ period, active: true }).lean()) as any;
    expect(firstBatchId.importBatchId).toBeDefined();

    await request(app)
      .post("/api/rankings/import")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({
        period,
        cadence: "MONTHLY",
        source: "SURVEY",
        rows: [{ seriesId: "s-berserk-prod", score: 9.5, votes: 1100 }],
      })
      .expect(200);

    // The new batch is the only active row for the period.
    const active = await RankingModel.find({ period, active: true }).lean();
    expect(active.length).toBe(1);
    expect(active[0].finalScore).toBe(9.5);

    // The previous batch row is still present but inactive.
    const inactiveRows = await RankingModel.find({ period, active: false }).lean();
    expect(inactiveRows.length).toBeGreaterThanOrEqual(1);
    expect(inactiveRows.some((r: any) => r.importBatchId === firstBatchId.importBatchId)).toBe(true);
  });

  it("rejects malformed periods with INVALID_PERIOD", async () => {
    const board = await loginAs("board@beachread.jp");
    const app = createApp();
    const base = {
      source: "SURVEY",
      rows: [{ seriesId: "s-berserk-prod", score: 9.7, votes: 1200 }],
    };

    const malformedWeekly = await request(app)
      .post("/api/rankings/import")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ ...base, period: "2026-W8", cadence: "WEEKLY" })
      .expect(400);
    expect(malformedWeekly.body.code).toBe("INVALID_PERIOD");

    const malformedMonthly = await request(app)
      .post("/api/rankings/import")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ ...base, period: "2026-08-01", cadence: "MONTHLY" })
      .expect(400);
    expect(malformedMonthly.body.code).toBe("INVALID_PERIOD");

    const unparseable = await request(app)
      .post("/api/rankings/import")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ ...base, period: "2026-8" })
      .expect(400);
    expect(unparseable.body.code).toBe("INVALID_PERIOD");
  });

  it("still reads legacy rankings that have no cadence field", async () => {
    await RankingModel.create({
      id: "rank-legacy-1",
      seriesId: "s-berserk-prod",
      seriesTitle: "Berserk",
      period: "2025-06",
      finalScore: 9.2,
      readerScore: 9.2,
      voteCount: 1500,
      rank: 1,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const board = await loginAs("board@beachread.jp");
    const res = await request(createApp())
      .get("/api/rankings")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);
    const periods = res.body.data;
    expect(Array.isArray(periods)).toBe(true);
    expect(periods.some((item: any) => item.period === "2025-06" && item.rank === 1)).toBe(true);
  });
});
