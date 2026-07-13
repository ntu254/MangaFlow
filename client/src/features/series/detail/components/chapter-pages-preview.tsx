import { useRef } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import type { Chapter } from "@/entities/series/model/series-types";
import { useUploadPageMutation, mapApiError } from "../../api/series-queries";
import { uploadFileToR2 } from "@/shared/lib/r2-upload";
import { ResolvedImage } from "@/shared/ui";

const PREVIEW_COUNT = 10;
const EXPANDED_COUNT = 24;

export function ChapterPagesPreview({
  chapter,
  canUpload,
  expanded = false,
  compact = false,
}: {
  chapter: Chapter;
  canUpload: boolean;
  expanded?: boolean;
  compact?: boolean;
}) {
  const uploadPageMutation = useUploadPageMutation(chapter.id, chapter.seriesId);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = async (files: FileList | null) => {
    if (!files || !canUpload) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) {
      toast.error("Choose an image file.");
      return;
    }

    try {
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        const uploaded = await uploadFileToR2(file, {
          folder: `chapters/${chapter.id}/pages`,
        });
        await uploadPageMutation.mutateAsync({
          pageNumber: chapter.pages.length + i + 1,
          imageUrl: uploaded.url,
          fileUrl: uploaded.fileUrl,
          fileKey: uploaded.fileKey,
          fileName: uploaded.filename,
          sizeKB: uploaded.sizeKB,
          mimeType: uploaded.mimeType,
        });
      }
      toast.success(`Upload ${valid.length} page(s) completed.`);
    } catch (e) {
      toast.error(mapApiError(e));
    }
  };

  const limit = expanded ? EXPANDED_COUNT : PREVIEW_COUNT;
  const pages = chapter.pages.slice(0, limit);
  const placeholders = Math.max(0, limit - pages.length);
  const target = Math.max(chapter.pages.length, limit);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Pages has upload ({chapter.pages.length} / {target})
        </p>
        <div className="flex items-center gap-2">
          {canUpload ? (
            <>
              <button
                disabled={uploadPageMutation.isPending}
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[10px] font-semibold hover:bg-muted disabled:opacity-50"
              >
                <Upload className="size-3" />{" "}
                {uploadPageMutation.isPending ? "Uploading..." : "Upload"}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => handle(e.target.files)}
              />
            </>
          ) : null}
          <button className="text-[11px] font-semibold text-accent hover:underline">
            View all
          </button>
        </div>
      </div>
      {chapter.pages.length === 0 && !canUpload ? (
        <p className="text-xs text-muted-foreground">No pages yet.</p>
      ) : (
        <div
          className={compact ? "grid grid-cols-6 gap-1.5 lg:grid-cols-8" : "grid grid-cols-5 gap-2"}
        >
          {pages.map((p) => (
            <PageThumbnail key={p.id} page={p} compact={compact} />
          ))}
          {Array.from({ length: placeholders }).map((_, i) => (
            <div
              key={`ph-${i}`}
              className={
                compact
                  ? "flex aspect-[3/4] items-center justify-center rounded border border-dashed border-border text-[10px] text-muted-foreground/60"
                  : "flex aspect-[2/3] items-center justify-center rounded border border-dashed border-border text-[10px] text-muted-foreground/60"
              }
            >
              {chapter.pages.length + i + 1}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PageThumbnail({
  page,
  compact,
}: {
  page: {
    id: string;
    index?: number;
    pageNumber?: number;
    fileKey?: string;
    fileUrl?: string;
    imageUrl?: string;
  };
  compact: boolean;
}) {
  const imageSrc = page.fileUrl ?? page.imageUrl;
  const pageIndex = page.index ?? page.pageNumber ?? 0;

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded border border-border bg-muted/40 ${
        compact ? "aspect-[3/4]" : "aspect-[2/3]"
      }`}
    >
      {imageSrc || page.fileKey ? (
        <ResolvedImage
          fileKey={page.fileKey}
          fallbackUrl={imageSrc}
          alt={`page ${pageIndex}`}
          className="size-full object-cover"
          fallback={
            <span className="text-sm font-bold text-muted-foreground/60">
              {String(pageIndex).padStart(2, "0")}
            </span>
          }
        />
      ) : (
        <span
          className={
            compact
              ? "text-sm font-bold text-muted-foreground/60"
              : "text-lg font-bold text-muted-foreground/60"
          }
        >
          {String(pageIndex).padStart(2, "0")}
        </span>
      )}
      <span className="absolute bottom-0 left-0 right-0 bg-background/80 py-0.5 text-center text-[9px] tabular-nums text-muted-foreground">
        {String(pageIndex).padStart(2, "0")}
      </span>
    </div>
  );
}
