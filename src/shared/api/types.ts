export interface ApiConfig {
  baseUrl: string;
  useMockApi: boolean;
  mockDelayMs: number;
}

export interface ApiRequestOptions extends RequestInit {
  json?: unknown;
  path?: string;
}

export type MockHandler = (
  options: ApiRequestOptions,
) => unknown | Promise<unknown>;
