import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { seriesApi } from "@/shared/api/series";
import { useUpdateSeries } from "@/shared/queries/useSeries";

interface Props {
  seriesId: string;
  currentCover?: string;
  onSuccess?: (r2Key: string) => void;
}

export function CoverUpload({ seriesId, currentCover, onSuccess }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const updateMut = useUpdateSeries();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      setProgress(0);

      try {
        const { uploadUrl, r2Key } = await seriesApi.getCoverUploadUrl(seriesId, {
          originalName: file.name,
          contentType: file.type,
        });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl, true);
          xhr.setRequestHeader("Content-Type", file.type);
          
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(file);
        });

        await updateMut.mutateAsync({
          id: seriesId,
          input: { cover: r2Key },
        });

        toast.success("Cover updated successfully!");
        onSuccess?.(r2Key);
      } catch (err: any) {
        toast.error(err.message || "Failed to upload cover");
      } finally {
        setIsUploading(false);
      }
    },
    [seriesId, updateMut, onSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={[
        "relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-foreground/[0.02] transition-colors",
        isDragActive ? "border-foreground/30 bg-foreground/[0.05]" : "border-foreground/15 hover:border-foreground/30",
        currentCover ? "aspect-[2/3] w-full max-w-[240px]" : "h-48 w-full",
      ].join(" ")}
    >
      <input {...getInputProps()} />
      
      {currentCover && !isUploading && (
        <img
          src={`/api/public/images/${currentCover}`}
          alt="Cover"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      
      <div className={`relative z-10 flex flex-col items-center justify-center p-4 text-center ${currentCover ? "bg-background/80 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity absolute inset-0" : ""}`}>
        {isUploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-foreground/50 mb-2" />
            <div className="text-[13px] font-medium text-foreground/70">Uploading {progress}%</div>
          </>
        ) : (
          <>
            <ImageIcon className="mb-2 h-6 w-6 text-foreground/40" />
            <div className="text-[13px] font-medium text-foreground/80">
              {currentCover ? "Change Cover" : "Upload Cover Image"}
            </div>
            <div className="mt-1 text-[11px] text-foreground/50">
              JPEG, PNG or WebP up to 5MB
            </div>
          </>
        )}
      </div>
    </div>
  );
}
