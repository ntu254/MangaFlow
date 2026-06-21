import { useRef, useState } from "react";
import { CheckCircle2, RotateCcw, Upload, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { currentUserByRole } from "@/entities";
import { chaptersApi, type ChapterPage } from "@/shared/api/chapters";
import { extractErrorMessage } from "@/shared/api";
import { filesApi, type UploadAssetPayload } from "@/shared/api/files";
import { seriesApi } from "@/shared/api/series";
import { logAudit } from "@/shared/lib/audit";
import { notify } from "@/shared/lib/notifications";
import { canUploadPage } from "@/shared/lib/permissions";
import { useRole } from "@/shared/lib/role";
import { useChapterPages } from "@/shared/queries/useChapterPages";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";

type UploadChapter = {
  id: string;
  chapterNumber?: number | string;
};

type UploadSeries = {
  id: string;
  title?: string;
  status?: string;
};

type PendingItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  status: "pending" | "processing" | "uploaded" | "failed";
  progress: number;
  pageId?: string;
  pageNumber?: number;
  error?: string;
};

type PageUploadPanelProps = {
  chapter: UploadChapter;
  series: UploadSeries;
  compact?: boolean;
  onUploaded?: () => void;
};

export function PageUploadPanel({
  chapter,
  series,
  compact = false,
  onUploaded,
}: PageUploadPanelProps) {
  const { role } = useRole();
  const me = currentUserByRole[role];
  const perm = canUploadPage(role, series);
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PendingItem[]>([]);
  const queryClient = useQueryClient();
  const { data: existingPages = [] } = useChapterPages(chapter.id);
  const chapterLabel = `Chapter ${chapter.chapterNumber ?? ""}`.trim();

  const updateItem = (id: string, updates: Partial<PendingItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  async function uploadItem(item: PendingItem, startPageNumber: number, offsetIndex: number) {
    try {
      updateItem(item.id, { status: "processing", progress: 0, error: undefined });

      let pageId = item.pageId;
      let pageNumber = item.pageNumber;

      if (!pageId) {
        pageNumber = startPageNumber + offsetIndex;
        const page = await chaptersApi.createPage(chapter.id, { pageNumber });
        pageId = page.id;
        updateItem(item.id, { pageId, pageNumber });
      }

      const { uploadUrl, fileAssetId, r2Key } = await filesApi.getPresignedUploadUrl(
        item.file.name,
        item.file.type,
        { chapterId: chapter.id },
      );

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", item.file.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            updateItem(item.id, { progress: Math.round((event.loaded / event.total) * 100) });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(item.file);
      });

      const assetPayload: UploadAssetPayload = {
        fileAssetId,
        r2Key,
        originalName: item.file.name,
        mimeType: item.file.type as UploadAssetPayload["mimeType"],
        size: item.file.size,
      };

      await filesApi.confirmPageUpload(pageId, {
        original: assetPayload,
        working: assetPayload,
        thumbnail: assetPayload,
      });

      updateItem(item.id, { status: "uploaded", progress: 100 });
      queryClient.invalidateQueries({ queryKey: ["chapter-pages", chapter.id] });
      queryClient.invalidateQueries({ queryKey: ["chapter", chapter.id] });
      queryClient.invalidateQueries({ queryKey: ["series", series.id, "summary"] });
      queryClient.invalidateQueries({ queryKey: ["series-summary", series.id] });
      onUploaded?.();

      logAudit({
        type: "PAGE_UPLOADED",
        actorId: me.id,
        entity: "chapter",
        entityId: chapter.id,
        payload: { file: item.name },
      });
    } catch (err) {
      updateItem(item.id, {
        status: "failed",
        error: extractErrorMessage(err) || "Upload failed",
      });
    }
  }

  function onPick(files: FileList | null) {
    if (!files) return;
    if (!perm.allowed) {
      toast.error(perm.reason);
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 100 * 1024 * 1024;
    const newItems: PendingItem[] = [];
    let rejectedCount = 0;

    Array.from(files)
      .slice(0, 50)
      .forEach((file, index) => {
        if (!validTypes.includes(file.type) || file.size > maxSize) {
          rejectedCount += 1;
          return;
        }
        newItems.push({
          id: `p_${Date.now()}_${index}`,
          file,
          name: file.name,
          size: file.size,
          status: "pending",
          progress: 0,
        });
      });

    if (rejectedCount > 0) {
      toast.error(`${rejectedCount} file(s) rejected. Only JPEG, PNG, WEBP under 100MB allowed.`);
    }
    if (files.length > 50) {
      toast.warning("Batch limited to 50 files.");
    }
    if (newItems.length === 0) return;

    setItems((prev) => [...prev, ...newItems]);
    const startPageNumber =
      Math.max(0, ...existingPages.map((page: ChapterPage) => page.pageNumber ?? 0)) + 1;
    const currentOffset = items.length;

    newItems.forEach((item, index) => {
      uploadItem(item, startPageNumber, currentOffset + index);
    });

    notify(me.id, {
      type: "PAGES_UPLOADED",
      title: `${newItems.length} page(s) processing`,
      body: `${chapterLabel} - ${series.title ?? "Series"}`,
      link: `/app/series/${series.id}/chapters`,
    });
  }

  function retry(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    const startPageNumber =
      Math.max(0, ...existingPages.map((page: ChapterPage) => page.pageNumber ?? 0)) + 1;
    uploadItem(item, startPageNumber, 0);
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      {!perm.allowed && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          {perm.reason}
        </div>
      )}

      <div
        onClick={() => perm.allowed && inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onPick(event.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-md border-2 border-dashed border-foreground/20 bg-card text-center transition-colors ${
          compact ? "p-8" : "p-12"
        } ${perm.allowed ? "cursor-pointer hover:border-foreground/40 hover:bg-foreground/5" : "opacity-50"}`}
      >
        <Upload className="mb-3 h-8 w-8 text-foreground/40" />
        <div className="text-sm font-semibold">Drop pages here or click to browse</div>
        <div className="mt-1 text-xs text-foreground/55">
          PNG/JPG/WEBP under 100MB, up to 50 files.
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
          onChange={(event) => {
            onPick(event.target.files);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="rounded-md border border-foreground/10 bg-card">
          <div className="flex justify-between border-b border-foreground/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
            <span>Pages ({items.length})</span>
          </div>
          <div className="divide-y divide-foreground/10">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 px-4 py-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-foreground/60">{item.name}</div>
                  <div className="text-foreground/45">{(item.size / 1024).toFixed(0)} KB</div>
                  <div className="ml-auto flex items-center gap-2">
                    {item.status === "pending" && (
                      <span className="text-foreground/55">Queued</span>
                    )}
                    {item.status === "processing" && (
                      <span className="text-sky-600">Uploading ({item.progress}%)...</span>
                    )}
                    {item.status === "uploaded" && (
                      <span className="flex items-center gap-1 font-medium text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> Uploaded
                      </span>
                    )}
                    {item.status === "failed" && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-destructive" title={item.error}>
                          Upload Failed
                        </span>
                        <button
                          type="button"
                          onClick={() => retry(item.id)}
                          className="p-1 text-foreground/60 hover:text-foreground"
                          title="Retry"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setItems((prev) => prev.filter((entry) => entry.id !== item.id))
                      }
                      className="p-1 text-foreground/40 hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {item.status !== "pending" && (
                  <div className="h-1 w-full overflow-hidden rounded bg-foreground/5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        item.status === "failed"
                          ? "bg-destructive"
                          : item.status === "uploaded"
                            ? "bg-emerald-500"
                            : "bg-sky-500"
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {item.status === "failed" && item.error && (
                  <div className="mt-0.5 text-[10px] text-destructive/80">
                    {item.error}. Retry upload or replace the page.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type PageUploadDialogProps = PageUploadPanelProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PageUploadDialog({
  open,
  onOpenChange,
  chapter,
  series,
  onUploaded,
}: PageUploadDialogProps) {
  const chapterQuery = useQuery({
    queryKey: ["chapter", chapter.id],
    queryFn: () => chaptersApi.getChapter(chapter.id),
    enabled: open,
  });
  const resolvedChapter = chapterQuery.data ?? chapter;
  const resolvedSeriesId = chapterQuery.data?.seriesId ?? series.id;
  const seriesQuery = useQuery({
    queryKey: ["series", resolvedSeriesId],
    queryFn: () => seriesApi.get(resolvedSeriesId),
    enabled: open && Boolean(resolvedSeriesId),
  });
  const resolvedSeries = seriesQuery.data ?? series;
  const chapterLabel = `Chapter ${resolvedChapter.chapterNumber ?? ""}`.trim();
  const isLoadingContext = chapterQuery.isLoading || seriesQuery.isLoading;
  const contextError = chapterQuery.error || seriesQuery.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload pages - {chapterLabel || "Chapter"}</DialogTitle>
          <DialogDescription>
            Upload page images without leaving the chapter preview.
          </DialogDescription>
        </DialogHeader>
        {isLoadingContext ? (
          <div className="rounded-md border border-foreground/10 bg-foreground/[0.025] px-4 py-8 text-center text-xs font-semibold text-foreground/50">
            Loading chapter upload context...
          </div>
        ) : contextError ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-semibold text-destructive">
            Unable to load chapter upload context. Please retry or use the upload page route.
          </div>
        ) : (
          <PageUploadPanel
            chapter={resolvedChapter}
            series={resolvedSeries}
            compact
            onUploaded={onUploaded}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
