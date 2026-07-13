import { ChevronLeft, ChevronRight, Maximize2, Minus, Plus, Users } from "lucide-react";
import type { Chapter, ChapterPage, ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioComment } from "@/entities/series/model/studio-types";
import type { DeadlineRisk } from "@/entities/submission/model/review-types";
import { ReviewStatusPill, DeadlineRiskPill } from "@/entities/submission";
import { ResolvedImage } from "@/shared/ui";
import { Switch } from "@/components/ui/switch";
import { chapterPageLabel } from "@/entities/chapter/model/chapter-pages";
import { commentText, commentTone, TONE_DOT } from "./review-helpers";

export function ChapterReviewViewer({
  chapter,
  series,
  page,
  pageComments,
  pageIndex,
  pageCount,
  risk,
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
}) {
  const pins = pageComments.filter((c) => typeof c.x === "number" && typeof c.y === "number");

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Title block */}
      <div className="space-y-2 px-1 pb-3">
        <p className="text-[11px] text-[var(--admin-faint)]">
          Projects <span className="px-1">›</span> {series.title}
          <span className="px-1">›</span> Chapter {String(chapter.number).padStart(2, "0")}
        </p>
        <h1 className="font-serif text-[28px] leading-tight text-[var(--admin-ink)]">
          {series.title} / Chapter {String(chapter.number).padStart(2, "0")}: {chapter.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <ReviewStatusPill status={chapter.status} />
          {chapter.revisionRound > 0 ? (
            <span className="rounded bg-[var(--admin-hover)] px-2 py-0.5 text-[11px] font-semibold text-[var(--admin-muted)]">
              Revision Round {chapter.revisionRound}
            </span>
          ) : null}
          {risk ? <DeadlineRiskPill risk={risk} /> : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-[var(--admin-muted)]">
          <span>{chapter.pages.length} pages</span>
          <span>Mangaka {series.authorName}</span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" /> Assistant Team {series.assistantIds.length}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-y border-border bg-card/60 px-2 py-1.5">
        <button
          type="button"
          onClick={() => onZoom(1)}
          className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[11px] font-medium hover:bg-muted"
        >
          <Maximize2 className="size-3.5" /> Fit Width
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onZoom(Math.max(0.25, zoom - 0.1))}
            className="grid size-7 place-items-center rounded border border-border bg-background hover:bg-muted"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="w-12 text-center text-[11px] font-medium tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => onZoom(Math.min(4, zoom + 0.1))}
            className="grid size-7 place-items-center rounded border border-border bg-background hover:bg-muted"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            disabled={pageIndex <= 0}
            className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[11px] font-medium hover:bg-muted disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" /> Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={pageIndex >= pageCount - 1}
            className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[11px] font-medium hover:bg-muted disabled:opacity-40"
          >
            Next <ChevronRight className="size-3.5" />
          </button>
        </div>
        <label className="ml-auto inline-flex items-center gap-2 text-[11px] font-medium text-[var(--admin-muted)]">
          Annotations
          <Switch checked={showAnnotations} onCheckedChange={onToggleAnnotations} />
        </label>
      </div>

      {/* Page image + pins */}
      <div className="min-h-0 flex-1 overflow-auto bg-[var(--admin-page)] p-4">
        {page ? (
          <div
            className="mx-auto w-full max-w-[760px] origin-top transition-transform"
            style={{ transform: `scale(${zoom})` }}
          >
            <div className="relative overflow-hidden rounded-[6px] border border-[var(--admin-border)] bg-white shadow-sm">
              <ResolvedImage
                fileKey={page.fileKey}
                fallbackUrl={page.fileUrl ?? page.imageUrl}
                alt={`Page ${chapterPageLabel(page)}`}
                className="block w-full"
                fallback={
                  <div className="flex aspect-[3/4] items-center justify-center text-[13px] text-[var(--admin-faint)]">
                    No image for this page
                  </div>
                }
              />
              {showAnnotations
                ? pins.map((c, i) => (
                    <span
                      key={c.id}
                      style={{ left: `${(c.x ?? 0) * 100}%`, top: `${(c.y ?? 0) * 100}%` }}
                      title={commentText(c)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 grid size-6 place-items-center rounded-full text-[11px] font-bold text-white shadow ring-2 ring-white ${TONE_DOT[commentTone(c)]}`}
                    >
                      {i + 1}
                    </span>
                  ))
                : null}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-[var(--admin-faint)]">
            No pages yet
          </div>
        )}
      </div>
    </div>
  );
}
