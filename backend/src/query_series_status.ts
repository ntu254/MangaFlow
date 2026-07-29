import "dotenv/config";
import { connectMongo, disconnectMongo } from "./db/connection.js";
import { SeriesModel, ChapterModel, StudioTaskModel } from "./db/models.js";

async function queryStatus() {
  await connectMongo();

  const authorId = "u-mangaka";

  const seriesList = await SeriesModel.find({ authorId }).lean() as any[];
  console.log(`\n===========================================================`);
  console.log(`=== MANGAKA SERIES PRODUCTION STATUS (Total: ${seriesList.length}) ===`);
  console.log(`===========================================================\n`);

  if (seriesList.length === 0) {
    console.log("No series found for Mangaka 'u-mangaka'.");
  }

  for (const series of seriesList) {
    console.log(`Series: ${series.title} (ID: ${series.id})`);
    console.log(`Status: ${series.status}`);
    console.log(`Genres: ${series.genres?.join(", ") || "None"}`);
    console.log(`Editor: ${series.editorName} (ID: ${series.editorId})`);
    console.log(`Assistants: ${series.assistantIds?.join(", ") || "None"}`);

    const chapters = await ChapterModel.find({ seriesId: series.id }).sort({ number: 1 }).lean() as any[];
    console.log(`Chapters: ${chapters.length}`);

    let totalTasksCount = 0;
    let completedTasksCount = 0;
    let inProgressTasksCount = 0;
    let openTasksCount = 0;

    for (const chapter of chapters) {
      const tasks = await StudioTaskModel.find({ chapterId: chapter.id }).lean() as any[];
      totalTasksCount += tasks.length;
      completedTasksCount += tasks.filter(t => ["EDITOR_APPROVED", "MANGAKA_APPROVED"].includes(t.status)).length;
      inProgressTasksCount += tasks.filter(t => ["IN_PROGRESS", "SUBMITTED"].includes(t.status)).length;
      openTasksCount += tasks.filter(t => ["TODO"].includes(t.status)).length;

      console.log(`  - Ch.${chapter.number}: ${chapter.title} [Status: ${chapter.status}]`);
      if (tasks.length > 0) {
        console.log(`    Tasks (${tasks.length}):`);
        for (const t of tasks) {
          console.log(`      * [${t.status}] ${t.title} (Assignee: ${t.assigneeName})`);
        }
      }
    }

    console.log(`\nSummary: Tasks Total: ${totalTasksCount} | Completed: ${completedTasksCount} | In Progress: ${inProgressTasksCount} | Open: ${openTasksCount}`);
    console.log("=".repeat(59) + "\n");
  }

  await disconnectMongo();
}

queryStatus().catch(err => {
  console.error("Error running script:", err);
  process.exit(1);
});
