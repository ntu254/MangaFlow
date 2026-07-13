import { useEffect, useState } from "react";
import { getPresignedDownloadUrl } from "@/shared/lib/r2-upload";

/**
 * Resolve a stable display URL for a stored file (MF-032).
 *
 * Resolution rules:
 *  - If a fileKey exists: resolve a presigned/public download URL on demand.
 *  - Else if a stored public/fallback url exists: use it.
 *  - Else: returns undefined (caller shows placeholder / disabled state).
 *
 * Never exposes a private bucket URL directly; resolution always goes through
 * the backend presign-download endpoint.
 */
export function useResolvedFileUrl(
  fileKey?: string | null,
  fallbackUrl?: string | null,
): { url: string | undefined; loading: boolean; error: string | null } {
  const [url, setUrl] = useState<string | undefined>(fallbackUrl ?? undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!fileKey) {
      setUrl(fallbackUrl ?? undefined);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const resolve = () => {
      setLoading(true);
      getPresignedDownloadUrl(fileKey)
        .then((resolved) => {
          if (!cancelled) {
            setUrl(resolved);
            setError(null);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setUrl(fallbackUrl ?? undefined);
            setError(err instanceof Error ? err.message : "Could not load the file link.");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    resolve();
    const timer = window.setInterval(resolve, 13 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [fileKey, fallbackUrl]);

  return { url, loading, error };
}
