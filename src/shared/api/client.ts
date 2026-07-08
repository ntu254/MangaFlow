import { apiConfig } from "./config";
import { mockHandlers } from "./handlers";
import type { ApiRequestOptions } from "./types";

export class ApiError extends Error {
  status?: number;
  path?: string;

  constructor(message: string, options?: { status?: number; path?: string }) {
    super(message);
    this.name = "ApiError";
    this.status = options?.status;
    this.path = options?.path;
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizePath = (path: string) =>
  path.startsWith("/") ? path : `/${path}`;

const resolveBaseUrl = () => {
  if (apiConfig.baseUrl) return apiConfig.baseUrl.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "http://localhost:5173";
};

const serializeBody = (options: ApiRequestOptions) => {
  if (options.json === undefined) return options.body;
  return JSON.stringify(options.json);
};

const handleMockRequest = async <T>(
  path: string,
  options: ApiRequestOptions,
) => {
  if (apiConfig.mockDelayMs > 0) {
    await delay(apiConfig.mockDelayMs);
  }

  let handler = mockHandlers[path];

  if (!handler) {
    const prefix = Object.keys(mockHandlers).find(
      (k) => path.startsWith(k) && k.endsWith("/"),
    );
    if (prefix) {
      handler = mockHandlers[prefix];
      options = { ...options, path };
    }
  }

  if (!handler) {
    throw new ApiError(`No mock handler registered for ${path}`, {
      path,
      status: 501,
    });
  }

  return (await handler(options)) as T;
};

const request = async <T>(path: string, options: ApiRequestOptions = {}) => {
  const normalizedPath = normalizePath(path);

  if (apiConfig.useMockApi) {
    return handleMockRequest<T>(normalizedPath, options);
  }

  const url = new URL(normalizedPath, resolveBaseUrl()).toString();
  const headers = new Headers(options.headers);

  if (options.json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: serializeBody(options),
  });

  if (!response.ok) {
    throw new ApiError(`Request failed for ${normalizedPath}`, {
      path: normalizedPath,
      status: response.status,
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
};

export const apiClient = {
  request,
  get: <T>(path: string, options: ApiRequestOptions = {}) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, options: ApiRequestOptions = {}) =>
    request<T>(path, { ...options, method: "POST" }),
  put: <T>(path: string, options: ApiRequestOptions = {}) =>
    request<T>(path, { ...options, method: "PUT" }),
  patch: <T>(path: string, options: ApiRequestOptions = {}) =>
    request<T>(path, { ...options, method: "PATCH" }),
  delete: <T>(path: string, options: ApiRequestOptions = {}) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
