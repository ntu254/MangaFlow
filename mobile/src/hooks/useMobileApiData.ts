import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MangaFlowApiError,
  configuredAuthToken,
  fetchCurrentUser,
  fetchNotifications,
  fetchRankings,
  fetchUnreadCount,
  fetchUserSeries,
  type ApiNotification,
  type ApiRanking,
  type ApiSeries,
  type CurrentUser
} from "../api/mobileApi";
import type {
  MobileRole,
  NotificationItem,
  RankingItem,
  SeriesStatus,
  SeriesSummary
} from "../types";

const boardStatuses = new Set(["BOARD_REVIEW", "APPROVED", "AT_RISK"]);
const mobileSeriesStatuses = new Set<SeriesStatus>([
  "EDITOR_REVIEW",
  "BOARD_REVIEW",
  "READY_FOR_PUBLICATION",
  "AT_RISK",
  "APPROVED"
]);

function toMobileStatus(status: string): SeriesStatus {
  if (status === "PUBLISHING" || status === "ONGOING") return "READY_FOR_PUBLICATION";
  if (mobileSeriesStatuses.has(status as SeriesStatus)) return status as SeriesStatus;
  return "EDITOR_REVIEW";
}

function mapSeries(series: ApiSeries, index: number): SeriesSummary {
  const status = toMobileStatus(series.status);
  return {
    id: series.id,
    title: series.title,
    mangaka: "Mangaka",
    genre: series.genre?.length ? series.genre : ["Uncategorized"],
    status,
    currentChapter: series.publicationType ?? "Current workflow",
    progress: status === "APPROVED" ? 100 : status === "BOARD_REVIEW" ? 68 : 42,
    ranking: index + 1,
    risk: status === "AT_RISK" ? "AT_RISK" : "NORMAL",
    editorRecommendation: series.description || "Synced from MangaFlow server.",
    submittedAt: series.updatedAt?.slice(0, 10) ?? series.createdAt?.slice(0, 10) ?? "No date",
    voteProgress: status === "BOARD_REVIEW" ? "Board review" : "Not voting"
  };
}

function mapNotification(notification: ApiNotification): NotificationItem {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    priority:
      notification.type === "BOARD_DECISION" || notification.type === "RANKING_WARNING"
        ? "high"
        : "normal",
    unread: !notification.isRead
  };
}

function mapRanking(ranking: ApiRanking): RankingItem {
  const seriesTitle =
    ranking.seriesTitle ??
    (typeof ranking.seriesId === "object" ? ranking.seriesId.title : undefined) ??
    "Untitled series";

  return {
    id: ranking.id,
    rank: ranking.rank,
    previousRank: ranking.previousRank ?? ranking.rank,
    seriesTitle,
    voteCount: ranking.voteCount,
    readerScore: ranking.readerScore,
    status: ranking.status
  };
}

type MobileApiState = {
  user: CurrentUser | null;
  editorSeries: SeriesSummary[];
  boardSeries: SeriesSummary[];
  notifications: NotificationItem[];
  rankings: RankingItem[];
  unreadCount: number | null;
};

const emptyData: MobileApiState = {
  user: null,
  editorSeries: [],
  boardSeries: [],
  notifications: [],
  rankings: [],
  unreadCount: null
};

export function useMobileApiData(period = "2026-W23") {
  const [data, setData] = useState<MobileApiState>(emptyData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const token = configuredAuthToken;

  const refresh = useCallback(async () => {
    if (!token) {
      setData(emptyData);
      setError("Thieu EXPO_PUBLIC_DEV_AUTH_TOKEN. Dang hien thi du lieu demo.");
      setIsUnauthorized(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsUnauthorized(false);

    try {
      const [user, notificationsData, unreadCount, seriesData, rankingData] =
        await Promise.all([
          fetchCurrentUser(token),
          fetchNotifications(token),
          fetchUnreadCount(token),
          fetchUserSeries(token).catch((requestError: unknown) => {
            if (requestError instanceof MangaFlowApiError && requestError.status === 403) {
              return [] as ApiSeries[];
            }
            throw requestError;
          }),
          fetchRankings(token, period).catch((requestError: unknown) => {
            if (requestError instanceof MangaFlowApiError && requestError.status === 403) {
              return [] as ApiRanking[];
            }
            throw requestError;
          })
        ]);

      const mappedSeries = seriesData.map(mapSeries);
      setData({
        user,
        editorSeries: mappedSeries.filter((series) => !boardStatuses.has(series.status)),
        boardSeries: mappedSeries.filter((series) => boardStatuses.has(series.status)),
        notifications: notificationsData.map(mapNotification),
        rankings: rankingData.map(mapRanking),
        unreadCount
      });
    } catch (requestError) {
      if (requestError instanceof MangaFlowApiError) {
        const unauthorized = requestError.status === 401 || requestError.status === 403;
        setIsUnauthorized(unauthorized);
        setError(
          unauthorized
            ? "JWT khong hop le hoac role hien tai chua co quyen goi API nay."
            : requestError.message
        );
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Khong the ket noi MangaFlow API."
        );
      }
      setData(emptyData);
    } finally {
      setIsLoading(false);
    }
  }, [period, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(
    () => ({
      ...data,
      isConfigured: Boolean(token),
      isLoading,
      isUnauthorized,
      error,
      source: error || !token ? ("seed" as const) : ("api" as const),
      refresh
    }),
    [data, error, isLoading, isUnauthorized, refresh, token]
  );
}

export function roleFromUser(user: CurrentUser | null, fallback: MobileRole): MobileRole {
  if (user?.systemRole === "BOARD" || user?.systemRole === "EDITOR") return user.systemRole;
  return fallback;
}
