const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export type RankingStatus = "NORMAL" | "WARNING" | "AT_RISK";

export type Ranking = {
  id: string;
  seriesId: string;
  period: string;
  voteCount: number;
  readerScore: number;
  normalizedReaderScore: number;
  finalScore: number;
  rank: number;
  previousRank?: number;
  status: RankingStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || fallbackMessage);
  }
  return json.data;
}

export async function fetchRankings(token: string, period: string): Promise<Ranking[]> {
  const response = await fetch(`${apiBaseUrl}/rankings?period=${encodeURIComponent(period)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Ranking[]>(response, "Failed to fetch rankings");
}

export async function importRankings(
  token: string,
  period: string,
  items: Array<{ seriesId: string; voteCount: number; readerScore: number }>
): Promise<Ranking[]> {
  const response = await fetch(`${apiBaseUrl}/rankings/import`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ period, items })
  });
  return parseApiResponse<Ranking[]>(response, "Failed to import rankings");
}

export async function fetchSeriesRankings(token: string, seriesId: string): Promise<Ranking[]> {
  const response = await fetch(`${apiBaseUrl}/series/${seriesId}/rankings`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Ranking[]>(response, "Failed to fetch series rankings");
}

export async function markRankingWarning(token: string, rankingId: string): Promise<Ranking> {
  const response = await fetch(`${apiBaseUrl}/rankings/${rankingId}/mark-warning`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Ranking>(response, "Failed to mark ranking as warning");
}

export async function markRankingAtRisk(token: string, rankingId: string): Promise<Ranking> {
  const response = await fetch(`${apiBaseUrl}/rankings/${rankingId}/mark-at-risk`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Ranking>(response, "Failed to mark ranking as at-risk");
}
