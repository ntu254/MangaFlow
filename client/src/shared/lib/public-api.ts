// Mock of /api/public/* — synchronous reads from src/data so we can swap to fetch later.
import { series, chapters, findSeries, chaptersBySeries } from "@/entities";

export const publicListSeries = () =>
  series.filter((s) => s.status === "ongoing" || s.status === "completed");

export const publicGetSeries = (slug: string) => series.find((s) => s.slug === slug);

export const publicListChapters = (slug: string) => {
  const s = series.find((x) => x.slug === slug);
  if (!s) return [];
  return chaptersBySeries(s.id).filter((c) => c.status === "published");
};

export const publicGetChapter = (slug: string, chapterId: string) => {
  const s = publicGetSeries(slug);
  if (!s) return undefined;
  const ch = chapters.find((c) => c.id === chapterId && c.seriesId === s.id);
  if (!ch) return undefined;
  // mock pages = use the series cover repeated; in phase 1 we don't have real page files
  return {
    chapter: ch,
    series: s,
    pages: Array.from({ length: ch.pages }, (_, i) => ({ index: i + 1, src: s.cover })),
  };
};

export { findSeries };
