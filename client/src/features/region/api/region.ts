const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export const regionTypes = [
  "BACKGROUND",
  "INKING",
  "SCREENTONE",
  "CLEANUP",
  "EFFECT",
  "BUBBLE",
  "OTHER"
] as const;

export type RegionType = (typeof regionTypes)[number];
export type RegionSource = "MANUAL" | "AI";
export type RegionShape = "RECTANGLE";

export type Region = {
  id: string;
  pageId: string;
  taskId?: string;
  type: RegionType;
  source: RegionSource;
  shape: RegionShape;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateRegionPayload = {
  type: RegionType;
  x: number;
  y: number;
  width: number;
  height: number;
  source?: RegionSource;
  shape?: RegionShape;
  confidence?: number;
};

async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || fallbackMessage);
  }
  return json.data;
}

export async function listRegions(token: string, pageId: string): Promise<Region[]> {
  const response = await fetch(`${apiBaseUrl}/pages/${pageId}/regions`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Region[]>(response, "Failed to list regions");
}

export async function createRegion(
  token: string,
  pageId: string,
  payload: CreateRegionPayload
): Promise<Region> {
  const response = await fetch(`${apiBaseUrl}/pages/${pageId}/regions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...payload,
      source: payload.source ?? "MANUAL",
      shape: payload.shape ?? "RECTANGLE"
    })
  });
  return parseApiResponse<Region>(response, "Failed to create region");
}

export async function deleteRegion(token: string, regionId: string): Promise<boolean> {
  const response = await fetch(`${apiBaseUrl}/regions/${regionId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await parseApiResponse<{ deleted: boolean }>(response, "Failed to delete region");
  return data.deleted;
}
