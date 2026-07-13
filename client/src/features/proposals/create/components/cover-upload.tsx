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
      return `Maximum file size is ${MAX_SIZE_MB}MB.`;
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
        <div className="relative overflow-hidden rounded border border-border">
          <ResolvedImage
            fileKey={preview ? undefined : fileKey}
            fallbackUrl={displayUrl}
            alt="Cover preview"
            className="aspect-[2/3] w-full object-cover"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="size-4 animate-spin" />
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
          className="flex w-full flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-border p-8 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
        >
          <Image className="size-8" />
          <span className="text-sm font-medium">Upload cover image</span>
          <span className="text-xs">JPG, PNG, or WebP. Max {MAX_SIZE_MB}MB.</span>
        </button>
      )}

      {!hasCover && <p className="text-xs text-rose-700">Cover image is required.</p>}
    </div>
  );
}
