import { apiBaseUrl, parseApiResponse } from "@/shared/api";

export type ChapterStatus = "DRAFT" | "IN_PROGRESS" | "READY_FOR_EDITOR" | "EDITOR_REVIEW" | "READY_FOR_PUBLICATION" | "PUBLISHED";

export type Chapter = {
  id: string;
  seriesId: string;
  title: string;
  chapterNumber: number;
  status: ChapterStatus;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
};

export async function createChapter(
  token: string, 
  seriesId: string, 
  data: { title: string; chapterNumber: number; deadline?: string }
): Promise<Chapter> {
  const res = await fetch(`${apiBaseUrl}/series/${seriesId}/chapters`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return parseApiResponse<Chapter>(res, "Failed to create chapter");
}

export async function listChapters(token: string, seriesId: string): Promise<Chapter[]> {
  const res = await fetch(`${apiBaseUrl}/series/${seriesId}/chapters`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseApiResponse<Chapter[]>(res, "Failed to list chapters");
}

export async function getChapter(token: string, chapterId: string): Promise<Chapter> {
  const res = await fetch(`${apiBaseUrl}/chapters/${chapterId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseApiResponse<Chapter>(res, "Failed to fetch chapter");
}

export async function updateChapter(
  token: string, 
  chapterId: string, 
  data: { title?: string; chapterNumber?: number; status?: ChapterStatus; deadline?: string | null }
): Promise<Chapter> {
  const res = await fetch(`${apiBaseUrl}/chapters/${chapterId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return parseApiResponse<Chapter>(res, "Failed to update chapter");
}

export async function deleteChapter(token: string, chapterId: string): Promise<boolean> {
  const res = await fetch(`${apiBaseUrl}/chapters/${chapterId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete chapter");
  return json.data.deleted;
}

export async function approveChapter(token: string, chapterId: string): Promise<Chapter> {
  const res = await fetch(`${apiBaseUrl}/chapters/${chapterId}/approve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseApiResponse<Chapter>(res, "Failed to approve chapter");
}

export async function requestChapterRevision(token: string, chapterId: string): Promise<Chapter> {
  const res = await fetch(`${apiBaseUrl}/chapters/${chapterId}/request-revision`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseApiResponse<Chapter>(res, "Failed to request chapter revision");
}
