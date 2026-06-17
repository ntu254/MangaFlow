import type { MobileRole, VoteChoice } from "../types";

const defaultApiBaseUrl = "http://localhost:5000/api";

export const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultApiBaseUrl;

type RequestOptions = {
  token?: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

// Hardcoded tokens for testing MVP
export const TEST_TOKENS = {
  EDITOR: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTMyMjBiZWI1ZDc0NjZlZGM4YzNlOTQiLCJyb2xlIjoiRURJVE9SIiwiaWF0IjoxNzgxNjcwMDc4LCJleHAiOjE3ODE2NzA5Nzh9.52jAeFIHc3LxRN_4NjzP7vNP7DNuX5zOg76iSbQ7zTg",
  BOARD: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTMyMjBiZWI1ZDc0NjZlZGM4YzNlYWMiLCJyb2xlIjoiQk9BUkQiLCJpYXQiOjE3ODE2NzAwNzgsImV4cCI6MTc4MTY3MDk3OH0.IkZsnN8wfle4Up084k50VST9StABD4D1xzl0a04hlNk"
}

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
    return role === "EDITOR" ? "/dashboard/editor/summary" : "/dashboard/board/summary";
  },
  editorSeries: "/series?roles=EDITOR",
  reviewQueue: "/submissions/review-queue",
  editorComments: "/comments?role=editor", // mock path, adjust if needed
  boardApprovals: "/series?status=BOARD_REVIEW",
  notifications: "/notifications",
  rankingsByPeriod(period: string) {
    return `/rankings/periods/${period}`;
  },
  vote(seriesId: string) {
    return `/series/${seriesId}/votes`;
  },
  tieBreak(seriesId: string) {
    return `/series/${seriesId}/decisions/tie-break`;
  },
  approveSubmission(submissionId: string) {
    return `/submissions/${submissionId}/approve`;
  },
  rejectSubmission(submissionId: string) {
    return `/submissions/${submissionId}/reject`;
  }
} as const;

export type VotePayload = {
  vote: VoteChoice;
  reason?: string;
};

