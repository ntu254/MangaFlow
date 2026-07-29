import { toast } from "sonner";
import { useResolvedFileUrl } from "@/shared/lib/use-resolved-file-url";

export function ResolvedFileLink({
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
  children: React.ReactNode;
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
      onClick={(event) => {
        if (!disabled) return;
        event.preventDefault();
        toast.info(
          loading
            ? "Refreshing the secure file link..."
            : "This file is unavailable. Ask the owner to upload it again.",
        );
      }}
      style={disabled ? { opacity: 0.4, pointerEvents: "none" } : undefined}
    >
      {children}
    </a>
  );
}
