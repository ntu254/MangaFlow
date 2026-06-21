import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import { currentUserByRole } from "@/entities";
import { useRole } from "@/shared/lib/role";
import { canUploadPage } from "@/shared/lib/permissions";
import { logAudit } from "@/shared/lib/audit";
import { notify } from "@/shared/lib/notifications";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { Upload, X, CheckCircle2, RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { chaptersApi, type ChapterPage } from "@/shared/api/chapters";
import { extractErrorMessage } from "@/shared/api";
import { filesApi, type UploadAssetPayload } from "@/shared/api/files";
import { useChapterPages } from "@/shared/queries/useChapterPages";
import { seriesApi } from "@/shared/api/series";

export const Route = createFileRoute("/app/chapters/$id/pages/upload")({
  loader: async ({ params }) => {
    try {
      const chapter = await chaptersApi.getChapter(params.id);
      const series = await seriesApi.get(chapter.seriesId);
      return { chapter, series };
    } catch {
      throw notFound();
    }
  },
  component: PageUploadPage,
});

type PendingItem = {
  id: string; // client-side id
  file: File;
  name: string;
  size: number;
  status: "pending" | "processing" | "uploaded" | "failed";
  progress: number;
  pageId?: string; // set once page is created in backend
  pageNumber?: number; // set once determined
  error?: string;
};

function PageUploadPage() {
  const { chapter, series } = Route.useLoaderData();
  const { role } = useRole();
  const me = currentUserByRole[role];
  const perm = canUploadPage(role, series);
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PendingItem[]>([]);

  const queryClient = useQueryClient();
  const { data: existingPages = [] } = useChapterPages(chapter.id);
  const chapterLabel = `Chapter ${chapter.chapterNumber}`;

  const updateItem = (id: string, updates: Partial<PendingItem>) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  async function uploadItem(item: PendingItem, startPageNumber: number, offsetIndex: number) {
    try {
      updateItem(item.id, { status: "processing", progress: 0, error: undefined });

      // 1. Create Page Record if not already created (for retries)
      let pageId = item.pageId;
      let pageNumber = item.pageNumber;

      if (!pageId) {
        pageNumber = startPageNumber + offsetIndex;
        const page = await chaptersApi.createPage(chapter.id, { pageNumber });
        pageId = page.id;
        updateItem(item.id, { pageId, pageNumber });
      }

      // 2. Get Presigned URL
      const { uploadUrl, fileAssetId, r2Key } = await filesApi.getPresignedUploadUrl(
        item.file.name,
        item.file.type,
        { chapterId: chapter.id },
      );

      // 3. PUT file using XMLHttpRequest to track progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", item.file.type);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            updateItem(item.id, { progress: percent });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(item.file);
      });

      // 4. Confirm upload (Temporary asset shortcut per plan)
      // TODO: Replace placeholder derived assets with real backend-generated workingImage + thumbnail assets. Do not ship this as production processing.
      const assetPayload: UploadAssetPayload = {
        fileAssetId,
        r2Key,
        originalName: item.file.name,
        mimeType: item.file.type as UploadAssetPayload["mimeType"],
        size: item.file.size,
      };

      await filesApi.confirmPageUpload(pageId!, {
        original: assetPayload,
        working: assetPayload,
        thumbnail: assetPayload,
      });

      updateItem(item.id, { status: "uploaded", progress: 100 });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["chapter-pages", chapter.id] });
      queryClient.invalidateQueries({ queryKey: ["chapter", chapter.id] });
      queryClient.invalidateQueries({ queryKey: ["series-summary", series.id] });

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
    if (!perm.allowed) return toast.error(perm.reason);

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 100 * 1024 * 1024; // 100MB

    const newItems: PendingItem[] = [];
    let rejectedCount = 0;

    Array.from(files)
      .slice(0, 50)
      .forEach((f, i) => {
        if (!validTypes.includes(f.type) || f.size > maxSize) {
          rejectedCount++;
          return;
        }
        newItems.push({
          id: `p_${Date.now()}_${i}`,
          file: f,
          name: f.name,
          size: f.size,
          status: "pending",
          progress: 0,
        });
      });

    if (rejectedCount > 0) {
      toast.error(`${rejectedCount} file(s) rejected. Only JPEG, PNG, WEBP under 100MB allowed.`);
    }

    if (files.length > 50) {
      toast.warning("Batch limited to 50 files (Flow 02 §17).");
    }

    if (newItems.length === 0) return;

    setItems((prev) => [...prev, ...newItems]);

    // Determine start page number safely
    const startPageNumber =
      Math.max(0, ...existingPages.map((p: ChapterPage) => p.pageNumber ?? 0)) + 1;
    // For offset, we use the current number of items already in the queue + any new ones
    const currentOffset = items.length;

    newItems.forEach((item, idx) => {
      uploadItem(item, startPageNumber, currentOffset + idx);
    });

    notify(me.id, {
      type: "PAGES_UPLOADED",
      title: `${newItems.length} page(s) processing`,
      body: `${chapterLabel} — ${series.title}`,
      link: `/app/series/${series.id}`,
    });
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  function retry(id: string) {
    const item = items.find((p) => p.id === id);
    if (item) {
      // Just reuse its existing pageNumber if it has one, otherwise we don't increment anything
      // Passing 0 for startPageNumber/offset is fine since uploadItem will reuse item.pageNumber if item.pageId exists.
      // If it failed before getting a pageId, it will create one. But wait, if it failed before page creation,
      // it won't have a pageNumber. Let's just pass the max existing page number at retry time.
      const startPageNumber =
        Math.max(0, ...existingPages.map((p: ChapterPage) => p.pageNumber ?? 0)) + 1;
      uploadItem(item, startPageNumber, 0);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={`Upload pages — ${chapterLabel}`}
        jp="ページアップロード"
        description={
          <Link
            to="/app/series/$id"
            params={{ id: series.id }}
            className="underline-offset-2 hover:underline"
          >
            ← Back to chapter
          </Link>
        }
      />

      {!perm.allowed && (
        <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          {perm.reason}
        </div>
      )}

      <div
        onClick={() => perm.allowed && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onPick(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-md border-2 border-dashed border-foreground/20 bg-card p-12 text-center transition-colors ${
          perm.allowed
            ? "cursor-pointer hover:border-foreground/40 hover:bg-foreground/5"
            : "opacity-50"
        }`}
      >
        <Upload className="mb-3 h-8 w-8 text-foreground/40" />
        <div className="text-sm font-semibold">Drop pages here or click to browse</div>
        <div className="mt-1 text-xs text-foreground/55">
          PNG/JPG/WEBP under 100MB, up to 50 files. Each Page generates 3 FileAssets (Original /
          Working / Thumbnail).
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
          onChange={(e) => {
            onPick(e.target.files);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-5 rounded-md border border-foreground/10 bg-card">
          <div className="border-b border-foreground/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/60 flex justify-between">
            <span>Pages ({items.length})</span>
          </div>
          <div className="divide-y divide-foreground/10">
            {items.map((p) => (
              <div key={p.id} className="flex flex-col gap-2 px-4 py-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-foreground/60">{p.name}</div>
                  <div className="text-foreground/45">{(p.size / 1024).toFixed(0)} KB</div>
                  <div className="ml-auto flex items-center gap-2">
                    {p.status === "pending" && <span className="text-foreground/55">Queued</span>}
                    {p.status === "processing" && (
                      <span className="text-sky-600">Uploading ({p.progress}%)…</span>
                    )}
                    {p.status === "uploaded" && (
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Uploaded
                      </span>
                    )}
                    {p.status === "failed" && (
                      <div className="flex items-center gap-2">
                        <span className="text-destructive font-medium" title={p.error}>
                          Upload Failed
                        </span>
                        <button
                          onClick={() => retry(p.id)}
                          className="text-foreground/60 hover:text-foreground p-1"
                          title="Retry"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => remove(p.id)}
                      className="text-foreground/40 hover:text-foreground p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {p.status !== "pending" && (
                  <div className="h-1 w-full bg-foreground/5 rounded overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${p.status === "failed" ? "bg-destructive" : p.status === "uploaded" ? "bg-emerald-500" : "bg-sky-500"}`}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                )}

                {p.status === "failed" && p.error && (
                  <div className="text-[10px] text-destructive/80 mt-0.5">
                    {p.error}. Retry upload or replace the page.
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
