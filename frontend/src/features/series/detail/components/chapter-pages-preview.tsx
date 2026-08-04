import { useRef, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, MoreVertical, Pencil, Replace, Trash2, Upload, X } from "lucide-react";
import { useAuth } from "@/shared/auth";
import type { Chapter, ChapterPage } from "@/entities/series/model/series-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDeletePageMutation,
  useReorderPagesMutation,
  useUpdatePageMutation,
  useUploadPageMutation,
  usePatchChapterMutation,
  mapApiError,
} from "../../api/series-queries";
import { uploadFileToR2 } from "@/shared/lib/r2-upload";
import { isRenderableFileUrl } from "@/shared/lib/file-url";
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
  const patchChapterMutation = usePatchChapterMutation(chapter.id, chapter.seriesId);
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<ChapterPage | null>(null);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInputValue, setTargetInputValue] = useState(chapter.targetPages ?? 20);

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

  const targetPages = chapter.targetPages ?? (chapter.pages.length > 20 ? chapter.pages.length : 20);
  const pages = expanded ? chapter.pages : chapter.pages.slice(0, PREVIEW_COUNT);
  const percent = Math.min(100, Math.round((chapter.pages.length / targetPages) * 100));

  const saveTargetPages = () => {
    if (targetInputValue < 1 || targetInputValue > 200) {
      toast.error("Target pages must be between 1 and 200");
      return;
    }
    patchChapterMutation.mutate(
      { targetPages: targetInputValue },
      {
        onSuccess: () => {
          toast.success(`Chapter target updated to ${targetInputValue} pages.`);
          setIsEditingTarget(false);
        },
        onError: (err) => toast.error(mapApiError(err)),
      },
    );
  };

  const isExceeded = chapter.pages.length > targetPages;
  const extraPages = chapter.pages.length - targetPages;

  const quickSyncTarget = () => {
    patchChapterMutation.mutate(
      { targetPages: chapter.pages.length },
      {
        onSuccess: () => {
          toast.success(`Target updated to match current ${chapter.pages.length} pages.`);
        },
        onError: (err) => toast.error(mapApiError(err)),
      },
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-col gap-2 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
              Pages uploaded ({chapter.pages.length} / {targetPages} planned)
            </p>
            {isExceeded && (
              <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                +{extraPages} over target
              </span>
            )}
            {canUpload && !isEditingTarget && (
              <button
                type="button"
                onClick={() => {
                  setTargetInputValue(targetPages);
                  setIsEditingTarget(true);
                }}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                title="Edit target page count for this chapter"
              >
                <Pencil className="size-3" /> Edit target
              </button>
            )}
            {canUpload && isExceeded && !isEditingTarget && (
              <button
                type="button"
                onClick={quickSyncTarget}
                disabled={patchChapterMutation.isPending}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline disabled:opacity-50"
                title="Sync target count to match current uploaded page count"
              >
                Sync target to {chapter.pages.length}
              </button>
            )}
          </div>

          {isEditingTarget ? (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Target pages:</span>
              <input
                type="number"
                min={1}
                max={200}
                value={targetInputValue}
                onChange={(e) => setTargetInputValue(parseInt(e.target.value, 10) || 1)}
                className="w-16 rounded border border-border bg-background px-2 py-0.5 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={saveTargetPages}
                disabled={patchChapterMutation.isPending}
                className="inline-flex items-center rounded bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Check className="mr-1 size-3" /> Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTarget(false)}
                className="inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 w-36 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all duration-300 ${
                    isExceeded ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {isExceeded ? "100% (Target reached)" : `${percent}% complete`}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {canUpload ? (
            <>
              <button
                disabled={uploadPageMutation.isPending}
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted disabled:opacity-50"
              >
                <Upload className="size-3.5" />
                {uploadPageMutation.isPending ? "Uploading..." : "Upload Pages"}
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
        </div>
      </div>

      {chapter.pages.length === 0 && !canUpload ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/40 py-12 text-center">
          <p className="text-xs font-semibold text-foreground">No pages uploaded yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Draft pages will appear here once uploaded.</p>
        </div>
      ) : (
        <div
          className={
            compact
              ? "grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
              : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          }
        >
          {pages.map((p, index) => (
            <PageThumbnail
              key={p.id}
              page={p}
              compact={compact}
              canReplace={canUpload && p.status !== "FINALIZED"}
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

          {canUpload && (
            <div
              onClick={() => inputRef.current?.click()}
              className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/40 p-3 text-center transition-all hover:border-primary/50 hover:bg-muted/30 ${
                compact ? "aspect-[3/4]" : "aspect-[2/3]"
              }`}
            >
              <div className="grid size-8 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground transition-transform group-hover:scale-105 group-hover:text-primary">
                <Upload className="size-4" />
              </div>
              <p className="mt-2 text-xs font-semibold text-foreground">
                + Add Page {chapter.pages.length + 1}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Upload image</p>
            </div>
          )}
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
  const imageSrc = isRenderableFileUrl(page.fileUrl)
    ? page.fileUrl
    : isRenderableFileUrl(page.imageUrl)
      ? page.imageUrl
      : (page.fileUrl ?? page.imageUrl);
  const pageIndex = page.index ?? page.pageNumber ?? 0;

  return (
    <div
      data-page-id={page.id}
      className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-muted/30 transition-all hover:shadow-xs ${
        compact ? "aspect-[3/4]" : "aspect-[2/3]"
      }`}
    >
      {imageSrc || page.fileKey ? (
        <ResolvedImage
          fileKey={page.fileKey}
          fallbackUrl={imageSrc}
          alt={`page ${pageIndex}`}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
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

      {/* Top Left Action Menu */}
      {(canReplace || canManage) && (
        <div className="absolute left-1.5 top-1.5 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-lg border border-border/60 bg-background/90 text-foreground shadow-2xs backdrop-blur-md transition-all hover:bg-background hover:scale-105 active:scale-95"
                title="Page actions"
              >
                <MoreVertical className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {canReplace && (
                <DropdownMenuItem
                  disabled={replacing}
                  onClick={onReplace}
                  className="cursor-pointer text-xs"
                >
                  <Replace className="mr-2 size-3.5" />
                  {replacing ? "Replacing..." : "Replace page"}
                </DropdownMenuItem>
              )}
              {canManage && (
                <>
                  <DropdownMenuItem
                    disabled={!canMoveLeft || managing}
                    onClick={onMoveLeft}
                    className="cursor-pointer text-xs"
                  >
                    <ChevronLeft className="mr-2 size-3.5" />
                    Move left
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!canMoveRight || managing}
                    onClick={onMoveRight}
                    className="cursor-pointer text-xs"
                  >
                    <ChevronRight className="mr-2 size-3.5" />
                    Move right
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={managing}
                    onClick={onDelete}
                    className="cursor-pointer text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <Trash2 className="mr-2 size-3.5" />
                    Delete page
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Bottom Page Number Badge */}
      <span className="absolute bottom-1.5 right-1.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-foreground shadow-2xs backdrop-blur-xs">
        P.{String(pageIndex).padStart(2, "0")}
      </span>
    </div>
  );
}
