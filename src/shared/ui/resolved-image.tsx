import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react";
import { getPresignedDownloadUrl } from "@/shared/lib/r2-upload";

const REFRESH_INTERVAL_MS = 13 * 60 * 1000;

type ResolvedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  fileKey?: string | null;
  fallbackUrl?: string | null;
  fallback?: ReactNode;
};

export function ResolvedImage({
  fileKey,
  fallbackUrl,
  fallback = null,
  onError,
  ...imageProps
}: ResolvedImageProps) {
  const [url, setUrl] = useState<string | undefined>(fallbackUrl ?? undefined);
  const [failed, setFailed] = useState(false);
  const retryCount = useRef(0);
  const requestId = useRef(0);

  const resolve = useCallback(async () => {
    if (!fileKey) {
      setUrl(fallbackUrl ?? undefined);
      return false;
    }

    const currentRequest = ++requestId.current;
    try {
      const resolved = await getPresignedDownloadUrl(fileKey);
      if (currentRequest === requestId.current) {
        setUrl(resolved);
        setFailed(false);
      }
      return true;
    } catch {
      if (currentRequest === requestId.current) setUrl(fallbackUrl ?? undefined);
      return false;
    }
  }, [fallbackUrl, fileKey]);

  useEffect(() => {
    retryCount.current = 0;
    setFailed(false);
    void resolve();

    if (!fileKey) return;
    const timer = window.setInterval(() => {
      retryCount.current = 0;
      void resolve();
    }, REFRESH_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      requestId.current += 1;
    };
  }, [fileKey, resolve]);

  if (!url || failed) return <>{fallback}</>;

  return (
    <img
      {...imageProps}
      src={url}
      onError={(event) => {
        onError?.(event);
        if (fileKey && retryCount.current < 1) {
          retryCount.current += 1;
          void resolve().then((recovered) => {
            if (!recovered) setFailed(true);
          });
          return;
        }
        setFailed(true);
      }}
    />
  );
}
