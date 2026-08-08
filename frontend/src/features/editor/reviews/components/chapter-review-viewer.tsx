import { ChevronLeft, ChevronRight, Maximize2, Minus, Plus, Eye, EyeOff } from "lucide-react";
import type { Chapter, ChapterPage, ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioComment } from "@/entities/series/model/studio-types";
import type { DeadlineRisk } from "@/entities/submission/model/review-types";
import { ResolvedImage } from "@/shared/ui";
import { Switch } from "@/components/ui/switch";
import { chapterPageLabel } from "@/entities/chapter/model/chapter-pages";
import { commentText, commentTone, TONE_DOT } from "./review-helpers";

export function ChapterReviewViewer({
  chapter,
  page,
  pageComments,
  pageIndex,
  pageCount,
  showAnnotations,
  onToggleAnnotations,
  zoom,
  onZoom,
  onPrev,
  onNext,
}: {
  chapter: Chapter;
  series: ProductionSeries;
  page: ChapterPage | undefined;
  pageComments: StudioComment[];
  pageIndex: number;
  pageCount: number;
  risk: DeadlineRisk | null;
  showAnnotations: boolean;
  onToggleAnnotations: (next: boolean) => void;
  zoom: number;
  onZoom: (next: number) => void;
  onPrev: () => void;
  onNext: () => void;
  pages?: ChapterPage[];
  onSelectPage?: (pageId: string) => void;
}) {
  const pins = pageComments.filter((c) => typeof c.x === "number" && typeof c.y === "number");

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-zinc-900/90 dark:bg-zinc-950/95 shadow-inner">
      {/* Canva/Figma Glassmorphic Floating Top Island Toolbar */}
      <div className="absolute top-3 left-1/2 z-20 -translate-x-1/2 flex items-center gap-3 rounded-full border border-white/10 bg-black/70 backdrop-blur-md px-4 py-1.5 text-xs text-white shadow-xl">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 border-r border-white/15 pr-3">
          <button
            type="button"
            onClick={() => onZoom(Math.max(0.25, zoom - 0.1))}
            className="grid size-6 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white"
            title="Zoom Out"
          >
            <Minus className="size-3" />
          </button>
          <span className="w-11 text-center font-mono text-xs font-bold tabular-nums text-white/90">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => onZoom(Math.min(4, zoom + 0.1))}
            className="grid size-6 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white"
            title="Zoom In"
          >
            <Plus className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => onZoom(1)}
            className="ml-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold hover:bg-white/20 transition-colors cursor-pointer text-white/90"
            title="Reset Zoom"
          >
            Fit Width
          </button>
        </div>

        {/* Annotation Pins Toggle */}
        <label className="flex items-center gap-2 text-xs font-medium text-white/90 cursor-pointer select-none">
          {showAnnotations ? <Eye className="size-3.5 text-emerald-400" /> : <EyeOff className="size-3.5 text-white/50" />}
          <span>Annotations ({pins.length})</span>
          <Switch
            checked={showAnnotations}
            onCheckedChange={onToggleAnnotations}
            className="data-[state=checked]:bg-emerald-500 scale-75"
          />
        </label>
      </div>

      {/* Main Studio Canvas Viewport (Infinite Artboard Surface) */}
      <div className="flex-1 overflow-auto p-8 pt-16 flex justify-center items-start bg-[radial-gradient(#ffffff15_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:16px_16px]">
        {page ? (
          <div
            className="origin-top transition-transform duration-150 ease-out py-4"
            style={{ transform: `scale(${zoom})`, width: "100%", maxWidth: "720px" }}
          >
            {/* Manga Artboard Frame */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl ring-1 ring-black/40">
              <ResolvedImage
                fileKey={page.fileKey}
                fallbackUrl={page.fileUrl ?? page.imageUrl}
                alt={`Page ${chapterPageLabel(page)}`}
                className="block w-full"
                fallback={
                  <div className="flex aspect-[3/4] items-center justify-center text-xs font-medium text-zinc-400">
                    No image available for this page
                  </div>
                }
              />

              {/* Annotation Pin Layers */}
              {showAnnotations
                ? pins.map((c, i) => (
                  <span
                    key={c.id}
                    style={{ left: `${(c.x ?? 0) * 100}%`, top: `${(c.y ?? 0) * 100}%` }}
                    title={commentText(c)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 grid size-6 place-items-center rounded-full text-xs font-bold text-white shadow-xl ring-2 ring-black/50 ${TONE_DOT[commentTone(c)]} animate-in fade-in zoom-in-75 duration-200`}
                  >
                    {i + 1}
                  </span>
                ))
                : null}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-medium text-zinc-400">
            No pages available in this chapter
          </div>
        )}
      </div>

      {/* Canva Studio Floating Bottom Page Stepper Pill (Clean & Non-Modal) */}
      <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 flex items-center gap-3 rounded-full border border-white/15 bg-black/75 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-white shadow-xl">
        <button
          type="button"
          onClick={onPrev}
          disabled={pageIndex <= 0}
          className="grid size-6 place-items-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors cursor-pointer text-white"
          title="Previous Page"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        <span className="font-mono text-xs font-bold text-white/90">
          Page {pageIndex + 1} of {pageCount}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={pageIndex >= pageCount - 1}
          className="grid size-6 place-items-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors cursor-pointer text-white"
          title="Next Page"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
