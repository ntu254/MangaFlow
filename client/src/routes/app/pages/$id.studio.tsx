import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useRole } from "@/shared/lib/role";
import { useState } from "react";
import { ChevronLeft, FileImage, Keyboard, Info, Loader2 } from "lucide-react";
import { PageStudioCanvas } from "@/features/page-studio/PageStudioCanvas";
import { HeaderToolBar } from "@/features/page-studio/HeaderToolBar";
import { InspectorDrawer } from "@/features/page-studio/InspectorDrawer";
import { useStudioStore } from "@/features/page-studio/useStudioStore";
import { usePageStudio } from "@/shared/queries/usePageStudio";
import { useFileDownloadUrl } from "@/shared/queries/useFileDownloadUrl";
import { IMG_W, IMG_H } from "@/features/page-studio/PageStudioCanvas";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/_client";

export const Route = createFileRoute("/app/pages/$id/studio")({
  validateSearch: (search: Record<string, unknown>) => {
    return { seriesId: search.seriesId as string | undefined };
  },
  loader: ({ params }) => {
    return { pageId: params.id };
  },
  component: PageStudio,
});

function getFileAssetId(asset: unknown): string | undefined {
  if (!asset) return undefined;
  if (typeof asset === "string") return asset;
  if (typeof asset === "object") {
    const record = asset as { _id?: string; id?: string };
    return record._id ?? record.id;
  }
  return undefined;
}

type ApiErrorLike = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
};

function PageStudio() {
  const { pageId } = Route.useLoaderData();
  const { seriesId } = Route.useSearch();
  const [showShortcuts, setShowShortcuts] = useState(false);

  const { viewport, showRegions, setShowRegions, compareOriginal, setCompareOriginal } =
    useStudioStore();

  const {
    data: studioData,
    isLoading: isLoadingStudio,
    error: studioError,
  } = usePageStudio(pageId);

  // We only fetch the download URLs if the assets exist.
  const workingFileAssetId = getFileAssetId(studioData?.workingFileAsset);
  const originalFileAssetId = getFileAssetId(studioData?.originalFileAsset);

  const { data: workingImageUrl } = useFileDownloadUrl(workingFileAssetId);
  const { data: originalImageUrl } = useFileDownloadUrl(originalFileAssetId);

  // ── Render States ────────────────────────────────────────────────
  if (isLoadingStudio) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground/50">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm font-semibold tracking-wide uppercase">
          Loading Page Studio...
        </span>
      </div>
    );
  }

  // 403 Forbidden or other API errors
  if (studioError) {
    const apiError = studioError as ApiErrorLike;
    const status = apiError.response?.status;
    if (status === 403 || status === 401) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-400">
            You do not have access to this Page Studio.
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-400">
          {apiError.response?.data?.message || apiError.message || "Failed to load Page Studio."}
        </div>
      </div>
    );
  }

  if (!studioData) {
    return null;
  }

  const { page, regions, aiResults } = studioData;

  // ── Studio Gate Blocks ───────────────────────────────────────────
  if (page.status === "PENDING" || page.status === "UPLOADING" || page.status === "PROCESSING") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-8 flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-sky-400 animate-spin mb-4" />
          <span className="text-sky-400 font-semibold tracking-wide">Processing assets...</span>
        </div>
      </div>
    );
  }

  if (page.status === "PROCESSING_FAILED") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-8 text-center max-w-sm">
          <span className="text-rose-400 font-bold block mb-2">Page processing failed.</span>
          <span className="text-rose-400/80 text-sm">Retry upload or replace page.</span>
        </div>
      </div>
    );
  }

  if (page.status === "UPLOADED" && !workingFileAssetId) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-8 text-center max-w-sm">
          <span className="text-amber-400 font-bold block mb-2">Missing working image.</span>
          <span className="text-amber-400/80 text-sm">Retry processing or contact admin.</span>
        </div>
      </div>
    );
  }

  const zoomPct = Math.round(viewport.scale * 100);

  // ── Full-screen studio layout ─────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="relative flex h-12 shrink-0 items-center border-b border-border bg-background px-4">
        {/* Left Section: Back link and page details */}
        <div className="flex items-center gap-3">
          <Link
            to="/app/series/$id"
            params={{ id: seriesId ?? page.chapterId }}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to Chapter
          </Link>

          <span className="h-3.5 w-px bg-border" />

          {/* Page info */}
          <div className="flex items-center gap-1.5">
            <FileImage className="h-3.5 w-3.5 text-foreground/60" />
            <span className="text-[12px] font-bold text-foreground">
              Page {page.pageNumber || page.order}
            </span>
            <span
              className={`ml-1 inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                page.status === "approved"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : page.status === "under-review"
                    ? "border-sky-500/30 bg-sky-500/10 text-sky-400"
                    : "border-border bg-foreground/5 text-foreground/60"
              }`}
            >
              {page.status}
            </span>
          </div>
        </div>

        {/* Middle Section: Absolutely centered tools bar */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <HeaderToolBar />
        </div>

        {/* Right Section: Shortcuts (pushed to right edge) */}
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setShowShortcuts((s) => !s)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <Keyboard className="h-3.5 w-3.5" />
            Shortcuts
          </button>
        </div>
      </div>

      {/* ── Shortcuts flyout ────────────────────────────────────────── */}
      {showShortcuts && (
        <div className="absolute top-24 right-6 z-50 w-64 rounded-xl border border-border bg-card p-4 shadow-2xl text-[11px] text-foreground/60">
          <div className="mb-2 flex items-center gap-1.5 font-semibold text-foreground/80">
            <Info className="h-3.5 w-3.5" /> Keyboard Shortcuts
          </div>
          {[
            ["V", "Select tool"],
            ["H", "Pan tool"],
            ["R", "Add region"],
            ["A", "Annotate"],
            ["Space + Drag", "Pan"],
            ["Middle drag", "Pan"],
            ["Ctrl + 0", "Fit to screen"],
            ["Ctrl + +/-", "Zoom in/out"],
            ["Wheel", "Zoom at pointer"],
          ].map(([key, desc]) => (
            <div key={key} className="flex justify-between py-0.5">
              <kbd className="rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-[10px] text-foreground/60">
                {key}
              </kbd>
              <span className="text-foreground/40">{desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Main studio layout ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Area (Canvas + Header Toolbar) */}
        <div className="flex flex-1 flex-col overflow-hidden border-r border-border">
          <div className="relative flex-1 flex flex-col overflow-hidden">
            <PageStudioCanvas
              regions={regions}
              pageId={pageId}
              onSelectRegion={(id) => useStudioStore.getState().setSelectedRegionId(id)}
              workingImageUrl={workingImageUrl}
              originalImageUrl={originalImageUrl}
            />
          </div>

          {/* Bottom status bar */}
          <div className="flex h-7 shrink-0 items-center gap-4 border-t border-border bg-background px-4 text-[10px] text-foreground/35 font-mono">
            <span>
              Zoom: <span className="text-foreground/60">{zoomPct}%</span>
            </span>
            <span className="h-3 w-px bg-border" />
            <span>
              Pos:{" "}
              <span className="text-foreground/60">
                ({Math.round(viewport.x)}, {Math.round(viewport.y)})
              </span>
            </span>
            <span className="h-3 w-px bg-border" />
            <span>
              Regions:{" "}
              <span className="text-foreground/60">
                {regions.filter((r: { status?: string }) => r.status !== "rejected").length}
              </span>
            </span>
            <span className="h-3 w-px bg-border" />
            <span>
              Canvas:{" "}
              <span className="text-foreground/60">
                {IMG_W} × {IMG_H}px
              </span>
            </span>
            <span className="h-3 w-px bg-border" />

            {/* Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRegions(!showRegions)}
                className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold transition-all border ${
                  showRegions
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border-border bg-foreground/5 text-foreground/45 hover:text-foreground/70"
                }`}
              >
                Regions: {showRegions ? "On" : "Off"}
              </button>
              <button
                onClick={() => setCompareOriginal(!compareOriginal)}
                className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold transition-all border ${
                  compareOriginal
                    ? "border-sky-500/20 bg-sky-500/10 text-sky-400"
                    : "border-border bg-foreground/5 text-foreground/45 hover:text-foreground/70"
                }`}
              >
                Compare Sketch: {compareOriginal ? "On" : "Off"}
              </button>
            </div>

            {/* Autosave status */}
            <div className="ml-auto flex items-center gap-3">
              <span className="capitalize text-foreground/30">{page.status}</span>
            </div>
          </div>
        </div>

        {/* Right Tabbed Drawer */}
        <InspectorDrawer regions={regions} results={aiResults} pageId={pageId} />
      </div>
    </div>
  );
}
