import type { MobileRole, VoteChoice } from "../types";

const defaultApiBaseUrl = "http://localhost:5000/api";

export const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultApiBaseUrl;

export const configuredAuthToken = process.env.EXPO_PUBLIC_DEV_AUTH_TOKEN;

type RequestOptions = {
  token?: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

export class MangaFlowApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
  }
}

export type CurrentUser = {
  id: string;
  clerkId?: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  systemRole: MobileRole | "ADMIN" | "MANGAKA" | "ASSISTANT" | null;
  status: "ACTIVE" | "SUSPENDED";
};

export type ApiSeries = {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  genre?: string[];
  coverUrl?: string | null;
  ownerId?: string;
  status: string;
  publicationType?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiNotification = {
  id: string;
  userId?: string;
  type?: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiRanking = {
  id: string;
  seriesId?: string | { id?: string; title?: string };
  seriesTitle?: string;
  period?: string;
  voteCount: number;
  readerScore: number;
  normalizedReaderScore?: number;
  finalScore?: number;
  rank: number;
  previousRank?: number;
  status: "NORMAL" | "WARNING" | "AT_RISK";
};

type ApiEnvelope<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message?: string; code?: string };

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

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload || !payload.success) {
    throw new MangaFlowApiError(
      payload?.message ?? "MangaFlow API request failed",
      response.status,
      payload?.success === false ? payload.code : undefined
    );
  }

  return payload.data;
}

export const mobileEndpoints = {
  currentUser: "/auth/me",
  notifications: "/notifications",
  unreadCount: "/notifications/unread-count",
  userSeries: "/series",
  boardMembers: "/board/members",
  rankings(period: string) {
    return `/rankings?period=${encodeURIComponent(period)}`;
  },
  seriesRankings(seriesId: string) {
    return `/series/${seriesId}/rankings`;
  },
  votes(seriesId: string) {
    return `/board/${seriesId}/votes`;
  },
  voteSummary(seriesId: string) {
    return `/board/${seriesId}/votes/summary`;
  },
  finalizeDecision(seriesId: string) {
    return `/board/${seriesId}/decisions/finalize`;
  },
  tieBreak(seriesId: string) {
    return `/board/${seriesId}/decisions/tie-break`;
  }
} as const;

export type VotePayload = {
  vote: VoteChoice;
  reason?: string;
};

export function fetchCurrentUser(token: string) {
  return requestMangaFlow<CurrentUser>(mobileEndpoints.currentUser, { token });
}

export function fetchNotifications(token: string) {
  return requestMangaFlow<ApiNotification[]>(mobileEndpoints.notifications, { token });
}

export function fetchUnreadCount(token: string) {
  return requestMangaFlow<number>(mobileEndpoints.unreadCount, { token });
}

export function fetchUserSeries(token: string) {
  return requestMangaFlow<ApiSeries[]>(mobileEndpoints.userSeries, { token });
}

export function fetchRankings(token: string, period: string) {
  return requestMangaFlow<ApiRanking[]>(mobileEndpoints.rankings(period), { token });
}

export function submitBoardVote(token: string, seriesId: string, payload: VotePayload) {
  return requestMangaFlow(mobileEndpoints.votes(seriesId), {
    token,
    method: "POST",
    body: payload
  });
}

export function submitTieBreak(
  token: string,
  seriesId: string,
  payload: { decision: VoteChoice; reason?: string }
) {
  return requestMangaFlow(mobileEndpoints.tieBreak(seriesId), {
    token,
    method: "POST",
    body: payload
  });
}

