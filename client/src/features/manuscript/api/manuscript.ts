const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export type Manuscript = {
  id: string;
  seriesId: string;
  uploadedBy: string;
  title?: string;
  description?: string;
  fileUrls: string[];
  previewUrls?: string[];
  currentVersion: number;
  status: "DRAFT" | "SUBMITTED" | "EDITOR_REVIEW" | "REVISION_REQUESTED" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
};

export async function createManuscript(
  token: string, 
  seriesId: string, 
  data: { title?: string; description?: string; fileUrls: string[] }
): Promise<Manuscript> {
  const res = await fetch(`${apiBaseUrl}/series/${seriesId}/manuscripts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to create manuscript");
  return json.data;
}

export async function listManuscripts(token: string, seriesId: string): Promise<Manuscript[]> {
  const res = await fetch(`${apiBaseUrl}/series/${seriesId}/manuscripts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to list manuscripts");
  return json.data;
}

export async function getManuscript(token: string, seriesId: string, manuscriptId: string): Promise<Manuscript> {
  const res = await fetch(`${apiBaseUrl}/series/${seriesId}/manuscripts/${manuscriptId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to fetch manuscript");
  return json.data;
}

export async function submitManuscript(token: string, seriesId: string, manuscriptId: string): Promise<Manuscript> {
  const res = await fetch(`${apiBaseUrl}/series/${seriesId}/manuscripts/${manuscriptId}/submit`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to submit manuscript");
  return json.data;
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
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to review manuscript");
  return json.data;
}
