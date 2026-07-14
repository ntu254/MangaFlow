import "dotenv/config";
import { connectMongo, disconnectMongo } from "./db/connection.js";
import {
  AuditEntryModel,
  EarningModel,
  EarningItemModel,
  NotificationModel,
  ProposalModel,
  ProposalVoteModel,
  RankingModel,
  RankingImportModel,
  SeriesModel,
  StudioCommentModel,
  StudioRegionModel,
  StudioTaskModel,
  SubmissionModel,
  UserModel,
  AiProcessingModel,
  ChapterModel,
  RefreshSessionModel,
  SeriesMemberModel,
} from "./db/models.js";
import {
  seedChapters,
  seedComments,
  seedEarnings,
  seedEarningItems,
  seedProposals,
  seedProposalVotes,
  seedRankings,
  seedRankingImports,
  seedSeries,
  seedStudioRegions,
  seedStudioTasks,
  seedSubmissions,
  usersWithHashes,
  seedSeriesMembers,
} from "./seed/data.js";

const seededModels = [
  AiProcessingModel,
  RefreshSessionModel,
  AuditEntryModel,
  NotificationModel,
  ProposalModel,
  ProposalVoteModel,
  SeriesModel,
  ChapterModel,
  StudioRegionModel,
  StudioTaskModel,
  StudioCommentModel,
  SubmissionModel,
  RankingModel,
  RankingImportModel,
  EarningModel,
  EarningItemModel,
  UserModel,
  SeriesMemberModel,
];

// Models that hold transactional/demo data — everything except the user
// accounts. Used by the demo clear/reseed flow so login users are preserved.
const nonUserSeededModels = seededModels.filter((model) => model !== UserModel);

async function insertUsers() {
  await UserModel.insertMany(await usersWithHashes());
}

async function insertNonUserSeedData() {
  await ProposalModel.insertMany(seedProposals);
  await ProposalVoteModel.insertMany(seedProposalVotes);
  await SeriesModel.insertMany(seedSeries);
  await ChapterModel.insertMany(seedChapters);
  await StudioRegionModel.insertMany(seedStudioRegions);
  await StudioTaskModel.insertMany(seedStudioTasks);
  await StudioCommentModel.insertMany(seedComments);
  await SubmissionModel.insertMany(seedSubmissions);
  await RankingModel.insertMany(seedRankings);
  await RankingImportModel.insertMany(seedRankingImports);
  await EarningModel.insertMany(seedEarnings);
  await EarningItemModel.insertMany(seedEarningItems);
  await SeriesMemberModel.insertMany(seedSeriesMembers);
}

async function insertSeedData() {
  await insertUsers();
  await insertNonUserSeedData();
}

export async function seedDatabase() {
  await Promise.all(seededModels.map((model) => model.deleteMany({})));
  await insertSeedData();
  return { seeded: true, reset: true };
}

/**
 * Demo reset: wipe all transactional data and recreate the seed series/flows,
 * but KEEP existing user accounts so demo logins keep working. Users are only
 * (re)created when none exist.
 */
export async function reseedDemoDatabase() {
  await Promise.all(nonUserSeededModels.map((model) => model.deleteMany({})));
  const existingUsers = await UserModel.estimatedDocumentCount();
  if (existingUsers === 0) await insertUsers();
  await insertNonUserSeedData();
  return { seeded: true, reset: true, keptUsers: existingUsers > 0 };
}

/**
 * Demo clear: wipe all transactional data (proposals, series, chapters, tasks,
 * submissions, comments, notifications, audit, rankings, earnings, sessions…)
 * without re-seeding and without touching user accounts.
 */
export async function clearDemoDatabase() {
  await Promise.all(nonUserSeededModels.map((model) => model.deleteMany({})));
  return { cleared: true, keptUsers: true };
}

export async function ensureSeedDatabase() {
  const existingUsers = await UserModel.estimatedDocumentCount();
  if (existingUsers > 0) {
    return { seeded: false, reset: false, reason: "database_not_empty" };
  }
  await insertSeedData();
  return { seeded: true, reset: false, reason: "database_empty" };
}

if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  const clearDemo = process.argv.includes("--clear-demo");
  const demoReseed = process.argv.includes("--demo");
  const shouldReset = process.argv.includes("--reset");
  await connectMongo();
  let message: string;
  if (clearDemo) {
    await clearDemoDatabase();
    message = "MangaFlow demo data cleared (user accounts preserved).";
  } else if (demoReseed) {
    const result = await reseedDemoDatabase();
    message = `MangaFlow demo data reseeded (users ${result.keptUsers ? "preserved" : "created"}).`;
  } else {
    const result = shouldReset ? await seedDatabase() : await ensureSeedDatabase();
    message = result.seeded
      ? `MangaFlow backend seed complete (schema v2${result.reset ? ", reset" : ""}).`
      : "MangaFlow backend seed skipped; database already has data. Use --reset to recreate seed data, --demo to reset demo data keeping users, or --clear-demo to wipe data keeping users.";
  }
  await disconnectMongo();
  console.log(message);
}
