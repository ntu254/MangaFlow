// Mock-backed public helpers with API readers for server-backed page images.
import { series, chapters, findSeries, chaptersBySeries } from "@/entities";
import { api, unwrap } from "@/shared/api";

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
  return {
    chapter: ch,
    series: s,
    pages: [],
  };
};

export interface PublicReaderPage {
  id?: string;
  index: number;
  src: string;
  width?: number;
  height?: number;
}

interface PublicChapterPageResponse {
  id: string;
  order?: number;
  pageNumber?: number;
  width?: number;
  height?: number;
  imageUrl: string;
}

export async function publicGetChapterWithPages(slug: string, chapterId: string) {
  const fallback = publicGetChapter(slug, chapterId);
  if (!fallback) return undefined;

  try {
    const apiPages = await api
      .get(`/public/chapters/${chapterId}/pages`)
      .then(unwrap<PublicChapterPageResponse[]>);
    return {
      ...fallback,
      pages: apiPages.map((page, index) => ({
        id: page.id,
        index: page.pageNumber ?? page.order ?? index + 1,
        src: page.imageUrl,
        width: page.width,
        height: page.height,
      })),
    };
  } catch {
    return fallback;
  }
}

export { findSeries };
