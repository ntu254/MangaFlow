import { createFileRoute } from "@tanstack/react-router";
import { Database, FileSearch, RotateCcw } from "lucide-react";
import { PageHeader, StatCard } from "@/layouts/AppShell";
import { fileAssets } from "@/entities/file-asset/model";
import { useReconcileFiles } from "@/shared/queries/useAdmin";

export const Route = createFileRoute("/app/admin/storage")({
  component: StoragePage,
});

function StoragePage() {
  const reconcile = useReconcileFiles();
  const totalBytes = fileAssets.reduce((sum, file) => sum + file.bytes, 0);
  const unusedFiles = fileAssets.filter((file) => file.kind === "working").slice(0, 6);
  const statusCounts = {
    original: fileAssets.filter((file) => file.kind === "original").length,
    working: fileAssets.filter((file) => file.kind === "working").length,
    thumbnail: fileAssets.filter((file) => file.kind === "thumbnail").length,
  };

  return (
    <div className="admin-console admin-page space-y-5">
      <PageHeader
        title="Storage"
        jp="Files"
        description="View storage usage, uploaded files, file status, and unused file candidates."
        actions={
          <button
            onClick={() => reconcile.mutate()}
            disabled={reconcile.isPending}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Check file status
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Storage usage" value={formatBytes(totalBytes)} hint="Mock file assets" />
        <StatCard label="Original files" value={String(statusCounts.original)} />
        <StatCard label="Working files" value={String(statusCounts.working)} />
        <StatCard label="Thumbnails" value={String(statusCounts.thumbnail)} />
      </div>

      {reconcile.data && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          Reconcile result: <code>{JSON.stringify(reconcile.data)}</code>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="overflow-hidden rounded-md border border-foreground/10 bg-card">
          <div className="flex items-center gap-2 border-b border-foreground/10 px-4 py-3">
            <Database className="h-4 w-4 text-foreground/50" />
            <div>
              <div className="text-sm font-semibold">Uploaded files</div>
              <div className="text-xs text-foreground/55">
                Latest file records by generated asset.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-foreground/10 bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground/55">
            <span>File</span>
            <span>Kind</span>
            <span>Size</span>
            <span>Status</span>
          </div>
          {fileAssets.slice(0, 12).map((file) => (
            <div
              key={file.id}
              className="grid grid-cols-[1fr_0.8fr_0.8fr_0.8fr] items-center gap-3 border-b border-foreground/5 px-4 py-3 text-[13px] last:border-b-0"
            >
              <span className="font-mono text-xs">{file.id}</span>
              <span className="capitalize text-foreground/70">{file.kind}</span>
              <span>{formatBytes(file.bytes)}</span>
              <span className="text-emerald-500">Linked</span>
            </div>
          ))}
        </section>

        <section className="rounded-md border border-foreground/10 bg-card">
          <div className="flex items-center gap-2 border-b border-foreground/10 px-4 py-3">
            <FileSearch className="h-4 w-4 text-foreground/50" />
            <div>
              <div className="text-sm font-semibold">Manage unused files</div>
              <div className="text-xs text-foreground/55">
                Review working derivatives before cleanup.
              </div>
            </div>
          </div>
          <div className="divide-y divide-foreground/5">
            {unusedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-mono text-xs">{file.id}</div>
                  <div className="text-xs text-foreground/50">
                    {file.width} x {file.height} px
                  </div>
                </div>
                <button className="h-7 rounded-md border border-foreground/10 px-2 text-xs text-foreground/60">
                  Review
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
