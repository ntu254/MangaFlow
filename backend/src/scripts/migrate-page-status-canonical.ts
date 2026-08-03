/**
 * Normalize embedded Page statuses to the Chapter-level review contract.
 *
 * Dry-run by default; pass --apply to persist changes.
 * Pages in approved/published Chapters become FINALIZED. Every other Page is
 * UPLOADED when it has a usable asset, otherwise PENDING_UPLOAD.
 */
import "dotenv/config";
import mongoose from "mongoose";

const apply = process.argv.includes("--apply");
const mongoUri =
  process.env.MONGO_URI ??
  process.env.MONGODB_URI ??
  "mongodb://127.0.0.1:27017/mangaflow";

const finalizedChapterStatuses = new Set(["READY_FOR_PUBLICATION", "PUBLISHED"]);

function hasUsableAsset(page: any) {
  const fileKey = typeof page?.fileKey === "string" ? page.fileKey.trim() : "";
  const fallback = String(page?.fileUrl ?? page?.imageUrl ?? "");
  return Boolean(
    fileKey ||
      (fallback &&
        !fallback.startsWith("metadata://signed-url-not-issued") &&
        !fallback.includes("placeholder-page")),
  );
}

function canonicalPageStatus(chapter: any, page: any) {
  if (
    finalizedChapterStatuses.has(String(chapter.status)) ||
    // Legacy compatibility only: preserve approval evidence until the Chapter
    // archive-removal migration converts the parent to a canonical status.
    (chapter.status === "ARCHIVED" && page.status === "FINALIZED")
  ) {
    return "FINALIZED";
  }
  return hasUsableAsset(page) ? "UPLOADED" : "PENDING_UPLOAD";
}

async function main() {
  await mongoose.connect(mongoUri);
  const chapters = mongoose.connection.db!.collection("chapters");
  const cursor = chapters.find(
    { "pages.0": { $exists: true } },
    { projection: { id: 1, status: 1, pages: 1 } },
  );

  let scannedChapters = 0;
  let changedChapters = 0;
  let changedPages = 0;
  for await (const chapter of cursor) {
    scannedChapters += 1;
    let chapterChanged = false;
    const pages = (chapter.pages ?? []).map((page: any) => {
      const status = canonicalPageStatus(chapter, page);
      if (status === page.status) return page;
      chapterChanged = true;
      changedPages += 1;
      return { ...page, status };
    });
    if (!chapterChanged) continue;
    changedChapters += 1;
    if (apply) {
      await chapters.updateOne(
        { _id: chapter._id },
        { $set: { pages, updatedAt: new Date() } },
      );
    }
  }

  console.log(
    `${apply ? "Applied" : "Dry run"}: scanned ${scannedChapters} chapter(s), normalized ${changedPages} page(s) in ${changedChapters} chapter(s).`,
  );
}

try {
  await main();
} finally {
  await mongoose.disconnect();
}
