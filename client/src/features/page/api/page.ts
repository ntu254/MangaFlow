import { apiBaseUrl, parseApiResponse } from "@/shared/api";

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
  return parseApiResponse<Page | Page[]>(res, "Failed to create page");
}

export async function listPages(token: string, chapterId: string): Promise<Page[]> {
  const res = await fetch(`${apiBaseUrl}/chapters/${chapterId}/pages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseApiResponse<Page[]>(res, "Failed to list pages");
}

export async function getPage(token: string, pageId: string): Promise<Page> {
  const res = await fetch(`${apiBaseUrl}/pages/${pageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseApiResponse<Page>(res, "Failed to fetch page");
}

export async function deletePage(token: string, pageId: string): Promise<boolean> {
  const res = await fetch(`${apiBaseUrl}/pages/${pageId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await parseApiResponse<{ deleted: boolean }>(res, "Failed to delete page");
  return data.deleted;
}

export async function editorApprovePage(token: string, pageId: string): Promise<Page> {
  const res = await fetch(`${apiBaseUrl}/pages/${pageId}/editor-approve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseApiResponse<Page>(res, "Failed to approve page");
}

export async function requestPageRevision(token: string, pageId: string): Promise<Page> {
  const res = await fetch(`${apiBaseUrl}/pages/${pageId}/request-revision`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseApiResponse<Page>(res, "Failed to request page revision");
}
