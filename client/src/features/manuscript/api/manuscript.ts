import { apiBaseUrl, parseApiResponse } from "@/shared/api";

export type Manuscript = {
  id: string;
  seriesId: string;
  uploadedBy: string;
  title?: string;
  description?: string;
  fileUrls: string[];
  previewUrls?: string[];
  currentVersion: number;
  status: "DRAFT" | "SUBMITTED" | "EDITOR_REVIEW" | "REVISION_REQUESTED" | "BOARD_REVIEW" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
};

export async function createManuscript(
  token: string, 
  seriesId: string, 
  formData: FormData
): Promise<Manuscript> {
  const res = await fetch(`${apiBaseUrl}/series/${seriesId}/manuscripts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });
  return parseApiResponse<Manuscript>(res, "Failed to create manuscript");
}

export async function listManuscripts(token: string, seriesId: string): Promise<Manuscript[]> {
  const res = await fetch(`${apiBaseUrl}/series/${seriesId}/manuscripts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseApiResponse<Manuscript[]>(res, "Failed to list manuscripts");
}

export async function getManuscript(token: string, seriesId: string, manuscriptId: string): Promise<Manuscript> {
  const res = await fetch(`${apiBaseUrl}/series/${seriesId}/manuscripts/${manuscriptId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseApiResponse<Manuscript>(res, "Failed to fetch manuscript");
}

export async function submitManuscript(token: string, seriesId: string, manuscriptId: string): Promise<Manuscript> {
  const res = await fetch(`${apiBaseUrl}/series/${seriesId}/manuscripts/${manuscriptId}/submit`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseApiResponse<Manuscript>(res, "Failed to submit manuscript");
}

export async function reviewManuscript(
  token: string, 
  seriesId: string, 
  manuscriptId: string, 
  action: "start" | "approve" | "request_revision"
): Promise<Manuscript> {
  const res = await fetch(`${apiBaseUrl}/series/${seriesId}/manuscripts/${manuscriptId}/review`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });
  return parseApiResponse<Manuscript>(res, "Failed to review manuscript");
}
