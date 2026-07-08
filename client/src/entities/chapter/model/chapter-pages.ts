import type { ChapterPage } from "@/entities/series/model/series-types";

export function chapterPageNumber(page?: Partial<ChapterPage> | null) {
  return page?.pageNumber ?? page?.index;
}

export function chapterPageLabel(page?: Partial<ChapterPage> | null) {
  const n = chapterPageNumber(page);
  return n == null ? "—" : String(n).padStart(2, "0");
}

export function isRenderableFileUrl(url?: string | null) {
  return Boolean(url && !url.startsWith("metadata://"));
}
