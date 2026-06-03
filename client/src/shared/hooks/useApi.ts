import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/shared/hooks/useAuth";

type UseApiOptions = {
  retries?: number;
  retryDelay?: number;
};

type UseApiResult<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
};

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number,
  retryDelay: number
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || attempt === retries) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Network error");
      if (attempt === retries) break;
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, retryDelay * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

export function useApi<T>(
  fetcher: (token: string, ...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { retries = 2, retryDelay = 1000 } = options;
  const { getToken } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      try {
        const token = await getToken({ template: "mangaflow" });
        if (!token) throw new Error("Not authenticated");
        const result = await fetcher(token, ...args);
        if (!abortRef.current?.signal.aborted) {
          setData(result);
        }
        return result;
      } catch (err: any) {
        if (err.name === "AbortError") return null;
        const message = err.message || "An error occurred";
        if (!abortRef.current?.signal.aborted) {
          setError(message);
        }
        return null;
      } finally {
        if (!abortRef.current?.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [getToken, fetcher]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, isLoading, error, execute, reset };
}
