import { fileAssets } from "@/entities/file-asset/model";

export type PageStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "uploaded"
  | "processing-failed"
  | "in-task"
  | "approved"
  | "locked"
  | "PENDING"
  | "UPLOADING"
  | "PROCESSING"
  | "PROCESSING_FAILED"
  | "UPLOADED"
  | "IN_TASK"
  | "APPROVED"
  | "LOCKED";

export type Page = {
  id: string;
  chapterId: string;
  order: number;
  pageNumber?: number;
  status: PageStatus;
  originalFileAssetId: string;
  workingFileAssetId: string;
  thumbnailFileAssetId: string;
};

// Group fileAssets by triples (original, working, thumbnail) per page
function mkPages(chapterId: string, count: number, startOrder = 1, startTriple = 0): Page[] {
  return Array.from({ length: count }).map((_, i) => {
    const tripleIdx = startTriple + i;
    const base = tripleIdx * 3;
    const status: PageStatus = i === 0 ? "approved" : i < 4 ? "in-task" : "uploaded";
    return {
      id: `pg_${chapterId}_${i + startOrder}`,
      chapterId,
      order: i + startOrder,
      status,
      originalFileAssetId: fileAssets[base]?.id ?? "fa_1",
      workingFileAssetId: fileAssets[base + 1]?.id ?? "fa_2",
      thumbnailFileAssetId: fileAssets[base + 2]?.id ?? "fa_3",
    };
  });
}

export const pages: Page[] = [
  ...mkPages("ch_g2", 8, 1, 0),
  ...mkPages("ch_ga2", 6, 1, 8),
  ...mkPages("ch_gk2", 6, 1, 14),
  ...mkPages("ch_v1", 5, 1, 20),
  ...mkPages("ch_sd1", 5, 1, 25),
];

export const pagesByChapter = (chapterId: string) =>
  pages.filter((p) => p.chapterId === chapterId).sort((a, b) => a.order - b.order);

export const findPage = (id: string) => pages.find((p) => p.id === id);
