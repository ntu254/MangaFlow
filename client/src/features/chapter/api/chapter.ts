const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

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
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to create chapter");
  return json.data;
}

export async function listChapters(token: string, seriesId: string): Promise<Chapter[]> {
  const res = await fetch(`${apiBaseUrl}/series/${seriesId}/chapters`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to list chapters");
  return json.data;
}

export async function getChapter(token: string, chapterId: string): Promise<Chapter> {
  const res = await fetch(`${apiBaseUrl}/chapters/${chapterId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to fetch chapter");
  return json.data;
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
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to update chapter");
  return json.data;
}

export async function deleteChapter(token: string, chapterId: string): Promise<boolean> {
  const res = await fetch(`${apiBaseUrl}/chapters/${chapterId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to delete chapter");
  return json.data.deleted;
}
