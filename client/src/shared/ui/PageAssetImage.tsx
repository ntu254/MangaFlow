import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useFileObjectUrl } from "@/shared/queries/useFileObjectUrl";
import { selectPageAssetId, type PageImageAssetInput, type PageImageMode } from "@/shared/lib/page-image";

type PageAssetImageProps = PageImageAssetInput & {
  mode?: PageImageMode;
  alt: string;
  className?: string;
  imageClassName?: string;
  fit?: "cover" | "contain";
};

export function PageAssetImage({
  mode = "thumbnail",
  alt,
  className = "",
  imageClassName = "",
  fit = "cover",
  ...assets
}: PageAssetImageProps) {
  const fileAssetId = selectPageAssetId(assets, mode);
  const { data: src, isLoading, error } = useFileObjectUrl(fileAssetId);

  return (
    <div className={`relative overflow-hidden bg-foreground/[0.04] ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"} ${imageClassName}`}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-foreground/30">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          <span className="max-w-full px-2 text-center text-[9px] font-bold uppercase tracking-wide">
            {error ? "Image failed" : fileAssetId ? "Loading" : "No image"}
          </span>
        </div>
      )}
    </div>
  );
}
