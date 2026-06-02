const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export type PageStatus = 
  | "UPLOADED"
  | "AI_PROCESSED"
  | "REGION_MARKED"
  | "TASK_ASSIGNED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "MANGAKA_APPROVED"
  | "EDITOR_APPROVED"
  | "NEEDS_REVISION"
  | "READY_TO_PUBLISH";

export type Page = {
  id: string;
  chapterId: string;
  pageNumber: number;
  originalFileUrl: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  processedFileUrl?: string;
  width: number;
  height: number;
  currentVersion: number;
  status: PageStatus;
  createdAt: string;
  updatedAt: string;
};

export async function createPage(
  token: string, 
  chapterId: string, 
  formData: FormData
): Promise<Page | Page[]> {
  const res = await fetch(`${apiBaseUrl}/chapters/${chapterId}/pages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to create page");
  return json.data;
}

export async function listPages(token: string, chapterId: string): Promise<Page[]> {
  const res = await fetch(`${apiBaseUrl}/chapters/${chapterId}/pages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to list pages");
  return json.data;
}

export async function getPage(token: string, pageId: string): Promise<Page> {
  const res = await fetch(`${apiBaseUrl}/pages/${pageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to fetch page");
  return json.data;
}

export async function deletePage(token: string, pageId: string): Promise<boolean> {
  const res = await fetch(`${apiBaseUrl}/pages/${pageId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to delete page");
  return json.data.deleted;
}
