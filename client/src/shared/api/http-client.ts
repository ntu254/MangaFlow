import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { ApiError, type ApiErrorPayload } from "./api-error";
import { apiBaseUrl, clearApiTokens, getApiTokens, setApiTokens } from "./client";

export type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
};

type RetryableAxiosRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let onUnauthorized: (() => void) | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function registerHttpUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const response = error.response as AxiosResponse<ApiErrorPayload | unknown> | undefined;
    const payload = response?.data as Partial<ApiErrorPayload> | undefined;

    return new ApiError({
      status: response?.status ?? 0,
      message:
        typeof payload?.message === "string"
          ? payload.message
          : error.message || "API request failed",
      code: typeof payload?.code === "string" ? payload.code : undefined,
      requestId: typeof payload?.requestId === "string" ? payload.requestId : undefined,
      details: response?.data,
    });
  }

  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    return new ApiError({ status: 0, message: error.message, code: "CLIENT_ERROR" });
  }

  return new ApiError({ status: 0, message: "Unknown API error", code: "CLIENT_ERROR" });
}

async function refreshTokens(instance: AxiosInstance) {
  const tokens = getApiTokens();
  if (!tokens?.refreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = instance
      .post<ApiSuccessEnvelope<{ accessToken: string; refreshToken: string }>>(
        "/auth/refresh",
        { refreshToken: tokens.refreshToken },
        { skipAuthRefresh: true } as AxiosRequestConfig,
      )
      .then((response) => {
        setApiTokens(response.data.data);
        return true;
      })
      .catch(() => {
        clearApiTokens();
        onUnauthorized?.();
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
    skipAuthRefresh?: boolean;
  }
}

export const httpClient = axios.create({
  baseURL: apiBaseUrl(),
  timeout: 30_000,
  headers: {
    Accept: "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  if (!config.skipAuth) {
    const tokens = getApiTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableAxiosRequestConfig | undefined;

    if (error.response?.status === 401 && config && !config._retry && !config.skipAuthRefresh) {
      config._retry = true;
      const refreshed = await refreshTokens(httpClient);
      if (refreshed) {
        const tokens = getApiTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return httpClient(config);
      }
    }

    throw normalizeApiError(error);
  },
);

export async function apiGet<T>(url: string, config?: AxiosRequestConfig) {
  const response = await httpClient.get<ApiSuccessEnvelope<T>>(url, config);
  return response.data.data;
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  const response = await httpClient.post<ApiSuccessEnvelope<T>>(url, body, config);
  return response.data.data;
}

export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  const response = await httpClient.patch<ApiSuccessEnvelope<T>>(url, body, config);
  return response.data.data;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig) {
  const response = await httpClient.delete<ApiSuccessEnvelope<T>>(url, config);
  return response.data.data;
}

export async function apiUpload<T>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig<FormData>,
) {
  const response = await httpClient.post<ApiSuccessEnvelope<T>>(url, formData, {
    ...config,
    headers: {
      ...config?.headers,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data.data;
}
