import { ApiRequestError, apiBaseUrl, apiRequest } from "@/shared/api/client";

export type PublicChapterSummary = {
  id: string;
  number: number;
  title: string;
  summary: string;
  publishedAt?: string;
  pageCount: number;
};

export type PublicSeries = {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  genres: string[];
  authorName: string;
  coverUrl: string;
  status: string;
  publicationType?: "WEEKLY" | "MONTHLY";
  publishedAt?: string;
  chapters: PublicChapterSummary[];
};

export type PublicChapterPage = {
  id: string;
  pageNumber: number;
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
};

export type PublicChapter = PublicChapterSummary & {
  pages: PublicChapterPage[];
};

export type PublicChapterResponse = {
  series: PublicSeries;
  chapter: PublicChapter;
};

export function fetchPublicSeriesList() {
  return apiRequest<PublicSeries[]>("/public/series", { auth: false });
}

export function fetchPublicSeries(slug: string) {
  return apiRequest<PublicSeries>(`/public/series/${encodeURIComponent(slug)}`, {
    auth: false,
  });
}

export function fetchPublicChapter(slug: string, chapterNumber: string) {
  return apiRequest<PublicChapterResponse>(
    `/public/series/${encodeURIComponent(slug)}/chapters/${encodeURIComponent(chapterNumber)}`,
    { auth: false },
  );
}

export function publicAssetUrl(url: string) {
  if (!url || !url.startsWith("/")) return url;
  const apiOrigin = apiBaseUrl().replace(/\/api\/?$/, "");
  return `${apiOrigin}${url}`;
}

export function isPublicNotFound(error: unknown) {
  return error instanceof ApiRequestError && error.status === 404;
}
