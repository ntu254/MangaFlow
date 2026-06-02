const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

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
  const response = await fetch(`${API_URL}/series`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch series list");
  }

  const json = await response.json();
  return json.data;
}

export async function createSeries(token: string, input: CreateSeriesInput): Promise<Series> {
  const response = await fetch(`${API_URL}/series`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create series");
  }

  const json = await response.json();
  return json.data;
}

export async function fetchSeriesById(token: string, seriesId: string): Promise<Series> {
  const response = await fetch(`${API_URL}/series/${seriesId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch series details");
  }

  const json = await response.json();
  return json.data;
}
