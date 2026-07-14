import type { AxiosRequestConfig } from "axios";

import { ApiError, isApiError } from "./api-error";
import { httpClient } from "./http-client";

export type ApiRole = "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD";
export type WebRole = "admin" | "mangaka" | "assistant" | "editor" | "board";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: ApiRole;
  isChair?: boolean;
};

export type WebUser = Omit<ApiUser, "role"> & { role: WebRole };

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
  requestId?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export type ApiListPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
};

export type ApiListEnvelope<T, TMeta = Record<string, unknown>> = {
  data: T[];
  pagination: ApiListPagination;
  meta: TMeta;
};

export type ApiTokens = {
  accessToken: string;
  refreshToken: string;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  headers?: HeadersInit;
};

const TOKEN_KEY = "mangaflow-api-tokens";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;

  constructor({
    status,
    message,
    code,
    requestId,
  }: {
    status: number;
    message: string;
    code?: string;
    requestId?: string;
  }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export const API_ROLE_TO_WEB: Record<ApiRole, WebRole> = {
  ADMIN: "admin",
  MANGAKA: "mangaka",
  ASSISTANT: "assistant",
  EDITOR: "editor",
  BOARD: "board",
};

export const WEB_ROLE_TO_API: Record<WebRole, ApiRole> = {
  admin: "ADMIN",
  mangaka: "MANGAKA",
  assistant: "ASSISTANT",
  editor: "EDITOR",
  board: "BOARD",
};

export function apiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";
}

export function mapApiUser(user: ApiUser): WebUser {
  return {
    ...user,
    role: API_ROLE_TO_WEB[user.role],
  };
}

export function getApiTokens(): ApiTokens | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ApiTokens>;
    if (parsed.accessToken && parsed.refreshToken) return parsed as ApiTokens;
  } catch {
    clearApiTokens();
  }
  return null;
}

export function hasApiTokens() {
  return getApiTokens() !== null;
}

export function isUnauthorizedApiError(error: unknown) {
  return error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
}

export function setApiTokens(tokens: ApiTokens) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function clearApiTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

let _onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> | undefined {
  if (!headers) return undefined;
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers as Record<string, string>;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    const response = await httpClient.request<ApiEnvelope<T>>({
      url: path,
      method: options.method ?? "GET",
      data: options.body,
      headers: normalizeHeaders(options.headers),
      skipAuth: options.auth === false,
      skipAuthRefresh: path === "/auth/refresh",
    } satisfies AxiosRequestConfig);

    const envelope = response.data;
    if (!envelope?.success) {
      throw new ApiRequestError({
        status: response.status,
        message: envelope?.message ?? `API request failed with ${response.status}`,
        code: envelope?.code,
        requestId: envelope?.requestId,
      });
    }

    return envelope.data;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    if (isApiError(error)) {
      if (error.status === 401 && options.auth !== false) {
        _onUnauthorized?.();
      }
      throw new ApiRequestError({
        status: error.status,
        message: error.message,
        code: error.code,
        requestId: error.requestId,
      });
    }
    if (error instanceof Error) {
      throw new ApiRequestError({
        status: error instanceof ApiError ? error.status : 0,
        message: error.message,
        code: "CLIENT_ERROR",
      });
    }
    throw new ApiRequestError({
      status: 0,
      message: "Unknown API error",
      code: "CLIENT_ERROR",
    });
  }
}

export async function apiListRequest<T, TMeta = Record<string, unknown>>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiListEnvelope<T, TMeta>> {
  try {
    const response = await httpClient.request<
      ApiEnvelope<T[]> & { pagination: ApiListPagination; meta: TMeta }
    >({
      url: path,
      method: options.method ?? "GET",
      data: options.body,
      headers: normalizeHeaders(options.headers),
      skipAuth: options.auth === false,
      skipAuthRefresh: path === "/auth/refresh",
    } satisfies AxiosRequestConfig);

    const envelope = response.data;
    if (!envelope?.success) {
      throw new ApiRequestError({
        status: response.status,
        message: envelope?.message ?? `API request failed with ${response.status}`,
        code: envelope?.code,
        requestId: envelope?.requestId,
      });
    }

    return {
      data: envelope.data,
      pagination: envelope.pagination,
      meta: envelope.meta,
    };
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    if (isApiError(error)) {
      if (error.status === 401 && options.auth !== false) {
        _onUnauthorized?.();
      }
      throw new ApiRequestError({
        status: error.status,
        message: error.message,
        code: error.code,
        requestId: error.requestId,
      });
    }
    if (error instanceof Error) {
      throw new ApiRequestError({
        status: error instanceof ApiError ? error.status : 0,
        message: error.message,
        code: "CLIENT_ERROR",
      });
    }
    throw new ApiRequestError({
      status: 0,
      message: "Unknown API error",
      code: "CLIENT_ERROR",
    });
  }
}
