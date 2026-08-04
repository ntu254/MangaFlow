import { useCallback, useRef, useState } from "react";
import { Upload, X, Image } from "lucide-react";
import { uploadFileToR2, type UploadedFileMetadata } from "@/shared/lib/r2-upload";
import { toast } from "sonner";
import { ResolvedImage } from "@/shared/ui";

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp";

type CoverUploadProps = {
  value: string;
  fileKey?: string;
  onChange: (value: { url: string; fileKey?: string }) => void;
  disabled?: boolean;
};

export function CoverUpload({ value, fileKey, onChange, disabled }: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Only JPG, PNG, or WebP files are accepted.";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File size must not exceed ${MAX_SIZE_MB}MB.`;
    }
    return null;
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }

      // Create local preview
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      try {
        setIsUploading(true);
        const metadata: UploadedFileMetadata = await uploadFileToR2(file, {
          target: "generic",
          folder: "covers",
        });
        onChange({ url: metadata.url, fileKey: metadata.fileKey });
        toast.success("Cover uploaded successfully.");
      } catch (err) {
        toast.error("Upload failed. Please try again.");
        setPreview(null);
      } finally {
        setIsUploading(false);
        // Clean up local preview URL
        if (localPreview) URL.revokeObjectURL(localPreview);
      }
    },
    [validateFile, onChange],
  );

  const handleRemove = useCallback(() => {
    onChange({ url: "", fileKey: undefined });
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange]);

  const displayUrl = preview || value;
  const hasCover = !!displayUrl;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {hasCover ? (
        <div className="group relative mx-auto max-w-[190px] sm:max-w-[210px] overflow-hidden rounded-xl border border-border/80 shadow-md transition-all">
          <ResolvedImage
            fileKey={preview ? undefined : fileKey}
            fallbackUrl={displayUrl}
            alt="Cover preview"
            className="aspect-[2/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Action Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-between p-2.5 bg-gradient-to-t from-black/75 via-transparent to-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                title="Remove cover"
                className="ml-auto grid size-7 place-items-center rounded-full bg-background/90 text-foreground backdrop-blur-xs shadow-xs transition-transform hover:scale-110 active:scale-95"
              >
                <X className="size-3.5" />
              </button>
            )}

            {!disabled && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full rounded-lg bg-background/95 py-1.5 text-[11px] font-bold text-foreground shadow-xs backdrop-blur-xs transition-transform hover:scale-[1.02] active:scale-98"
              >
                Change cover
              </button>
            )}
          </div>

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Upload className="size-4 animate-spin text-primary" />
                Uploading...
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
          className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 p-5 text-muted-foreground transition-all hover:border-primary/50 hover:bg-muted/40 hover:text-foreground"
        >
          <div className="grid size-10 place-items-center rounded-xl bg-background shadow-2xs border border-border/60">
            <Image className="size-5 text-primary" />
          </div>
          <div className="text-center space-y-0.5">
            <span className="block text-xs font-bold text-foreground">Upload cover image</span>
            <span className="block text-[10px] text-muted-foreground">JPG, PNG, WebP (Max {MAX_SIZE_MB}MB)</span>
          </div>
        </button>
      )}

      {!hasCover && <p className="text-center text-[11px] font-medium text-rose-500">Cover image is required</p>}
    </div>
  );
}
