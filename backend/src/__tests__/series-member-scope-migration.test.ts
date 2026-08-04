import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { SeriesMemberModel } from "../db/models.js";
import { runSeriesMemberScopeMigration } from "../scripts/migrations/migrate-series-member-scope.js";

let mongo: MongoMemoryReplSet;

describe("MEM-002 — SeriesMember scope migration", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await SeriesMemberModel.deleteMany({});
  });

  it("maps the legacy full-chapter string to CHAPTER_ONLY", async () => {
    await SeriesMemberModel.create({
      id: "sm-legacy-full",
      seriesId: "s-test",
      userId: "u-test",
      role: "assistant",
      scope: "Full chapter",
      status: "active",
    });

    const result = await runSeriesMemberScopeMigration({ writeReport: false });

    expect(result.scanned).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.unmappable).toHaveLength(0);

    const updated = await SeriesMemberModel.findOne({ id: "sm-legacy-full" }).lean();
    expect((updated as any).accessScope).toBe("CHAPTER_ONLY");
  });

  it("maps 'Task only' to TASK_ONLY", async () => {
    await SeriesMemberModel.create({
      id: "sm-legacy-task",
      seriesId: "s-test",
      userId: "u-test",
      role: "assistant",
      scope: "Task only",
      status: "active",
    });

    const result = await runSeriesMemberScopeMigration({ writeReport: false });

    expect(result.updated).toBe(1);
    const updated = await SeriesMemberModel.findOne({ id: "sm-legacy-task" }).lean();
    expect((updated as any).accessScope).toBe("TASK_ONLY");
  });

  it("maps specialization strings without overwriting accessScope", async () => {
    await SeriesMemberModel.create({
      id: "sm-spec-bg",
      seriesId: "s-test",
      userId: "u-bg",
      role: "assistant",
      scope: "Backgrounds only",
      status: "active",
    });
    await SeriesMemberModel.create({
      id: "sm-spec-lineart",
      seriesId: "s-test",
      userId: "u-line",
      role: "assistant",
      scope: "Lineart & Inking",
      status: "active",
    });

    const result = await runSeriesMemberScopeMigration({ writeReport: false });

    expect(result.scanned).toBe(2);
    expect(result.updated).toBe(2);
    expect(result.unmappable).toHaveLength(0);

    const bg = await SeriesMemberModel.findOne({ id: "sm-spec-bg" }).lean();
    expect((bg as any).specialization).toBe("BACKGROUND");
    const line = await SeriesMemberModel.findOne({ id: "sm-spec-lineart" }).lean();
    expect((line as any).specialization).toBe("LINE_ART");
  });

  it("reports unmappable values instead of silently dropping them", async () => {
    await SeriesMemberModel.create({
      id: "sm-unknown",
      seriesId: "s-test",
      userId: "u-unknown",
      role: "assistant",
      scope: "Cybernetic Lemon Squeezer",
      status: "active",
    });

    const result = await runSeriesMemberScopeMigration({ writeReport: false });

    expect(result.updated).toBe(0);
    expect(result.unmappable).toHaveLength(1);
    expect(result.unmappable[0]).toMatchObject({
      id: "sm-unknown",
      scope: "Cybernetic Lemon Squeezer",
    });

    const unchanged = await SeriesMemberModel.findOne({ id: "sm-unknown" }).lean();
    expect((unchanged as any).accessScope).toBeFalsy();
    expect((unchanged as any).specialization).toBeFalsy();
    expect((unchanged as any).scope).toBe("Cybernetic Lemon Squeezer");
  });

  it("skips rows that already carry the canonical fields", async () => {
    await SeriesMemberModel.create({
      id: "sm-canonical",
      seriesId: "s-test",
      userId: "u-canon",
      role: "assistant",
      scope: "Full chapter",
      accessScope: "CHAPTER_ONLY",
      specialization: "BACKGROUND",
      status: "active",
    });

    const result = await runSeriesMemberScopeMigration({ writeReport: false });

    expect(result.updated).toBe(0);
    expect(result.alreadyCanonical).toBe(1);
  });

  it("is idempotent — running twice does not double-write", async () => {
    await SeriesMemberModel.create({
      id: "sm-idem",
      seriesId: "s-test",
      userId: "u-idem",
      role: "assistant",
      scope: "Task only",
      status: "active",
    });

    await runSeriesMemberScopeMigration({ writeReport: false });
    const second = await runSeriesMemberScopeMigration({ writeReport: false });

    expect(second.updated).toBe(0);
    expect(second.alreadyCanonical).toBe(1);
  });
});
