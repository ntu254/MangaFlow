import { useEffect, useState } from "react";
import { getPresignedDownloadUrl } from "@/shared/lib/r2-upload";
import { isRenderableFileUrl } from "@/shared/lib/file-url";

export function useResolvedFileUrl(
  fileKey?: string | null,
  fallbackUrl?: string | null,
): { url: string | undefined; loading: boolean; error: string | null } {
  const safeFallback = isRenderableFileUrl(fallbackUrl) ? (fallbackUrl ?? undefined) : undefined;
  const [url, setUrl] = useState<string | undefined>(safeFallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!fileKey) {
      setUrl(safeFallback);
      setError(null);
      setLoading(false);
      return;
    }

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
            setUrl(safeFallback);
            setError(err instanceof Error ? err.message : "Failed to load file link.");
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
  }, [fileKey, safeFallback]);

  return { url, loading, error };
}
