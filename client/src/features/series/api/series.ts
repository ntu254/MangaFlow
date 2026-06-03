import { apiBaseUrl, parseApiResponse } from "@/shared/api";

export type Series = {
  id: string;
  title: string;
  slug: string;
  description: string;
  genre: string[];
  coverUrl: string | null;
  ownerId: string;
  status: string;
  publicationType: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSeriesInput = {
  title: string;
  description: string;
  genre: string[];
  publicationType: string | null;
};

export async function fetchSeriesList(token: string): Promise<Series[]> {
  const response = await fetch(`${apiBaseUrl}/series`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Series[]>(response, "Failed to fetch series list");
}

export async function createSeries(token: string, input: CreateSeriesInput): Promise<Series> {
  const response = await fetch(`${apiBaseUrl}/series`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });
  return parseApiResponse<Series>(response, "Failed to create series");
}

export async function fetchSeriesById(token: string, seriesId: string): Promise<Series> {
  const response = await fetch(`${apiBaseUrl}/series/${seriesId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Series>(response, "Failed to fetch series details");
}
