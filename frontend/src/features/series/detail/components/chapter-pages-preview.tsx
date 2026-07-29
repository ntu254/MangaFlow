import { useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Replace, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/shared/auth";
import type { Chapter, ChapterPage } from "@/entities/series/model/series-types";
import {
  useDeletePageMutation,
  useReorderPagesMutation,
  useUpdatePageMutation,
  useUploadPageMutation,
  mapApiError,
} from "../../api/series-queries";
import { uploadFileToR2 } from "@/shared/lib/r2-upload";
import { ResolvedImage } from "@/shared/ui";

const PREVIEW_COUNT = 10;
const EXPANDED_COUNT = 24;

export function ChapterPagesPreview({
  chapter,
  expanded = false,
  compact = false,
}: {
  chapter: Chapter;
  expanded?: boolean;
  compact?: boolean;
}) {
  const user = useAuth((s) => s.user);
  const uploadPageMutation = useUploadPageMutation(chapter.id, chapter.seriesId);
  const reorderPagesMutation = useReorderPagesMutation(chapter.id, chapter.seriesId);
  const deletePageMutation = useDeletePageMutation(chapter.id, chapter.seriesId);
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<ChapterPage | null>(null);
  const updatePageMutation = useUpdatePageMutation(
    replaceTarget?.id ?? "",
    chapter.id,
    chapter.seriesId,
  );

  const handle = async (files: FileList | null) => {
    if (!files || !user) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) {
      toast.error("Select image files.");
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
      toast.success(`Successfully uploaded ${valid.length} page(s).`);
    } catch (e) {
      toast.error(mapApiError(e));
    }
  };

  const replacePage = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !replaceTarget || !file.type.startsWith("image/")) {
      toast.error("Select an image file.");
      return;
    }
    try {
      const uploaded = await uploadFileToR2(file, {
        folder: `chapters/${chapter.id}/pages`,
      });
      await updatePageMutation.mutateAsync({
        imageUrl: uploaded.url,
        fileUrl: uploaded.fileUrl,
        fileKey: uploaded.fileKey,
        fileName: uploaded.filename,
        sizeKB: uploaded.sizeKB,
        mimeType: uploaded.mimeType,
      });
      toast.success(`Page ${replaceTarget.pageNumber ?? replaceTarget.index} revision uploaded.`);
      setReplaceTarget(null);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    } catch (e) {
      toast.error(mapApiError(e));
    }
  };

  const canUpload =
    user?.role === "mangaka" &&
    (chapter.status === "IN_PRODUCTION" ||
      chapter.status === "REVISION_REQUIRED" ||
      chapter.status === "PLANNED");

  const movePage = async (pageId: string, offset: -1 | 1) => {
    const orderedPageIds = chapter.pages.map((page) => page.id);
    const currentIndex = orderedPageIds.indexOf(pageId);
    const nextIndex = currentIndex + offset;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= orderedPageIds.length) return;
    [orderedPageIds[currentIndex], orderedPageIds[nextIndex]] = [
      orderedPageIds[nextIndex],
      orderedPageIds[currentIndex],
    ];
    try {
      await reorderPagesMutation.mutateAsync(orderedPageIds);
      toast.success("Page order saved.");
    } catch (error) {
      toast.error(mapApiError(error));
    }
  };

  const deletePage = async (page: ChapterPage) => {
    const pageNumber = page.index ?? page.pageNumber ?? 0;
    if (!window.confirm(`Delete page ${pageNumber}? This action cannot be undone.`)) return;
    try {
      await deletePageMutation.mutateAsync(page.id);
      toast.success(`Page ${pageNumber} deleted.`);
    } catch (error) {
      toast.error(mapApiError(error));
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
          Pages uploaded ({chapter.pages.length} / {target})
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
              <input
                ref={replaceInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => replacePage(e.target.files)}
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
          {pages.map((p, index) => (
            <PageThumbnail
              key={p.id}
              page={p}
              compact={compact}
              canReplace={canUpload && p.status === "REVISION_REQUIRED"}
              canManage={canUpload}
              canMoveLeft={index > 0}
              canMoveRight={index < chapter.pages.length - 1}
              replacing={updatePageMutation.isPending && replaceTarget?.id === p.id}
              managing={
                reorderPagesMutation.isPending ||
                (deletePageMutation.isPending && deletePageMutation.variables === p.id)
              }
              onReplace={() => {
                setReplaceTarget(p);
                window.setTimeout(() => replaceInputRef.current?.click(), 0);
              }}
              onMoveLeft={() => movePage(p.id, -1)}
              onMoveRight={() => movePage(p.id, 1)}
              onDelete={() => deletePage(p)}
            />
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
  canReplace,
  canManage,
  canMoveLeft,
  canMoveRight,
  replacing,
  managing,
  onReplace,
  onMoveLeft,
  onMoveRight,
  onDelete,
}: {
  page: ChapterPage;
  compact: boolean;
  canReplace: boolean;
  canManage: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  replacing: boolean;
  managing: boolean;
  onReplace: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onDelete: () => void;
}) {
  const imageSrc = page.fileUrl ?? page.imageUrl;
  const pageIndex = page.index ?? page.pageNumber ?? 0;

  return (
    <div
      data-page-id={page.id}
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
      {canReplace ? (
        <button
          type="button"
          disabled={replacing}
          onClick={onReplace}
          className="absolute inset-x-1 top-1 inline-flex items-center justify-center gap-1 rounded bg-background/95 px-1.5 py-1 text-[9px] font-semibold text-foreground shadow-sm hover:bg-background disabled:opacity-50"
        >
          <Replace className="size-2.5" />
          {replacing ? "Replacing..." : "Replace revision"}
        </button>
      ) : null}
      {canManage ? (
        <div className="absolute inset-x-1 bottom-4 flex items-center justify-center gap-0.5 rounded bg-background/95 p-0.5 shadow-sm">
          <button
            type="button"
            aria-label={`Move page ${pageIndex} left`}
            title="Move left"
            disabled={!canMoveLeft || managing}
            onClick={onMoveLeft}
            className="rounded p-1 text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="size-3" />
          </button>
          <button
            type="button"
            aria-label={`Move page ${pageIndex} right`}
            title="Move right"
            disabled={!canMoveRight || managing}
            onClick={onMoveRight}
            className="rounded p-1 text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="size-3" />
          </button>
          <button
            type="button"
            aria-label={`Delete page ${pageIndex}`}
            title="Delete page"
            disabled={managing}
            onClick={onDelete}
            className="rounded p-1 text-destructive hover:bg-destructive/10 disabled:opacity-30"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
