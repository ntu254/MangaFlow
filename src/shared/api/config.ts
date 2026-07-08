import type { ApiConfig } from "./types";

const parseBoolean = (value: string | undefined, fallback = false) => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
};

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const apiConfig: ApiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL?.trim() ?? "",
  useMockApi: parseBoolean(import.meta.env.VITE_USE_MOCK_API, false),
  mockDelayMs: parseNumber(import.meta.env.VITE_MOCK_API_DELAY_MS, 350),
};
