import { Download } from "lucide-react";
import { toast } from "sonner";
import { useResolvedFileUrl } from "../hooks/use-resolved-file-url";

/**
 * Image preview that resolves a presigned/public URL from a stored fileKey
 * (MF-032). Falls back to a stored url, otherwise renders nothing so the
 * caller's placeholder shows.
 */
export function MaterialPreviewImage({
  fileKey,
  fallbackUrl,
  alt,
  className,
  onMissing,
}: {
  fileKey?: string | null;
  fallbackUrl?: string | null;
  alt: string;
  className?: string;
  onMissing?: React.ReactNode;
}) {
  const { url } = useResolvedFileUrl(fileKey, fallbackUrl);
  if (!url) return <>{onMissing ?? null}</>;
  return <img src={url} alt={alt} className={className} />;
}

/**
 * Download anchor that resolves a presigned/public URL on demand. When no
 * fileKey or stored url exists, renders a disabled control.
 */
export function MaterialDownloadLink({
  fileKey,
  fallbackUrl,
  fileName,
  className,
  ariaLabel,
  children,
}: {
  fileKey?: string | null;
  fallbackUrl?: string | null;
  fileName?: string;
  className?: string;
  ariaLabel?: string;
  children?: React.ReactNode;
}) {
  const { url, loading } = useResolvedFileUrl(fileKey, fallbackUrl);
  const disabled = !url || loading;
  return (
    <a
      href={url || "#"}
      download={fileName}
      target="_blank"
      rel="noreferrer"
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={className}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          toast.info("File chưa có dữ liệu thực để tải.");
        }
      }}
      style={disabled ? { opacity: 0.4, pointerEvents: "none" } : undefined}
    >
      {children ?? <Download className="size-3" />}
    </a>
  );
}
