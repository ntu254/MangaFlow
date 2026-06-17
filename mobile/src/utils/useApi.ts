import { useState, useEffect, useCallback } from 'react';
import { requestMangaFlow } from '../api/mobileApi';

type UseApiResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useApi<T>(path: string, token?: string, method: "GET" | "POST" = "GET", body?: any): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await requestMangaFlow<T>(path, { token, method, body });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [path, token, method, body]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
