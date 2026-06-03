import type { MobileRole, VoteChoice } from "../types";

const defaultApiBaseUrl = "http://localhost:5000/api";

export const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultApiBaseUrl;

type RequestOptions = {
  token?: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

export async function requestMangaFlow<T>(
  path: string,
  options: RequestOptions = {}
) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = (await response.json()) as { success: boolean; data: T; message?: string };
  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? "MangaFlow API request failed");
  }

  return payload.data;
}

export const mobileEndpoints = {
  dashboard(role: MobileRole) {
    return role === "EDITOR" ? "/dashboard/editor" : "/dashboard/board";
  },
  editorSeries: "/series?scope=assigned-editor",
  editorComments: "/comments?role=editor",
  boardApprovals: "/series?status=BOARD_REVIEW",
  rankingsByPeriod(period: string) {
    return `/rankings/periods/${period}`;
  },
  vote(seriesId: string) {
    return `/series/${seriesId}/votes`;
  },
  tieBreak(seriesId: string) {
    return `/series/${seriesId}/decisions/tie-break`;
  }
} as const;

export type VotePayload = {
  vote: VoteChoice;
  reason?: string;
};

