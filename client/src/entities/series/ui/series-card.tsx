import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarClock,
  Eye,
  MoreHorizontal,
  Pencil,
  Layers,
  Users,
  Newspaper,
  Flag,
} from "lucide-react";
import { SERIES_STATUS_LABEL, type ProductionSeries } from "@/entities/series/model/series-types";
import { ChapterStatusPill } from "@/entities/chapter";
import {
  type SeriesProductionSummary,
  PRIMARY_ACTION_LABEL,
  formatDeadline,
} from "@/entities/series/model/series-production";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResolvedImage } from "@/shared/ui";

function getInitials(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function SeriesLink({
  slug,
  tab,
  children,
  className,
  title,
}: {
  slug: string;
  tab: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <Link to="/app/series/$slug/$tab" params={{ slug, tab }} className={className} title={title}>
      {children}
    </Link>
  );
}

export function SeriesCard({
  series,
  publishedCount,
  totalCount,
  summary,
  proposalStatus,
}: {
  series: ProductionSeries;
  publishedCount: number;
  totalCount: number;
  summary: SeriesProductionSummary;
  proposalStatus?: string;
}) {
  const pct = series.targetChapters
    ? Math.min(100, Math.round((publishedCount / series.targetChapters) * 100))
    : 0;

  const actionLabel = PRIMARY_ACTION_LABEL[summary.primaryAction];

  return (
    <div className="group rounded-md border border-border bg-card transition hover:border-foreground/40">
      <SeriesLink slug={series.slug} tab="overview" className="flex gap-4 p-4">
        <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded ring-1 ring-border">
          {series.coverUrl || series.coverFileKey ? (
            <ResolvedImage
              fileKey={series.coverFileKey}
              fallbackUrl={series.coverUrl}
              alt={series.title}
              className="size-full object-cover"
              fallback={
                <div className="grid size-full place-items-center bg-muted font-serif text-lg font-bold text-muted-foreground">
                  {getInitials(series.title)}
                </div>
              }
            />
          ) : (
            <div className="grid size-full place-items-center bg-muted font-serif text-lg font-bold text-muted-foreground">
              {getInitials(series.title)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-serif text-lg group-hover:underline">{series.title}</h3>
            <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {SERIES_STATUS_LABEL[series.status]}
            </span>
          </div>

          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{series.synopsis}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span>Editor: {series.editorName}</span>
            {proposalStatus ? (
              <>
                <span>·</span>
                <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                  Proposal: {proposalStatus}
                </span>
              </>
            ) : null}
          </div>

          <div className="mt-2 space-y-1.5">
            {summary.currentChapter ? (
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-muted-foreground">Current:</span>
                <span className="font-medium">
                  Ch. {String(summary.currentChapter.number).padStart(3, "0")} —{" "}
                  {summary.currentChapter.title}
                </span>
                <ChapterStatusPill status={summary.currentChapter.status} />
              </div>
            ) : null}

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>
                Progress: {publishedCount}/{series.targetChapters} chapter
              </span>
              {summary.openTaskCount > 0 ? (
                <span>
                  · {summary.openTaskCount} open task
                  {summary.openTaskCount !== 1 ? "s" : ""}
                </span>
              ) : null}
              {summary.overdueTaskCount > 0 ? (
                <span className="font-medium text-rose-600">
                  · {summary.overdueTaskCount} overdue
                </span>
              ) : null}
              {summary.pendingReviewCount > 0 ? (
                <span className="font-medium text-amber-600">
                  · {summary.pendingReviewCount} review
                </span>
              ) : null}
            </div>

            {summary.nextDeadline ? (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarClock className="size-3" />
                <span>Next deadline: {formatDeadline(summary.nextDeadline)}</span>
              </div>
            ) : null}

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </SeriesLink>

      <div className="flex items-center gap-2 border-t border-border px-4 py-2">
        <SeriesLink
          slug={series.slug}
          tab="overview"
          className="rounded-md bg-foreground px-3 py-1 text-[11px] font-semibold text-background hover:opacity-90"
          title={actionLabel}
        >
          {actionLabel}
        </SeriesLink>

        <SeriesLink
          slug={series.slug}
          tab="chapters"
          className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          <BookOpen className="mr-1 inline size-3" />
          Chapters
        </SeriesLink>

        <SeriesLink
          slug={series.slug}
          tab="chapters"
          className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          <Eye className="mr-1 inline size-3" />
          Review
        </SeriesLink>

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <SeriesLink slug={series.slug} tab="overview">
                  <Layers className="mr-2 size-3.5" />
                  Open Studio
                </SeriesLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <SeriesLink slug={series.slug} tab="chapters">
                  <BookOpen className="mr-2 size-3.5" />
                  Chapters
                </SeriesLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <SeriesLink slug={series.slug} tab="chapters">
                  <Eye className="mr-2 size-3.5" />
                  Review
                </SeriesLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/app/tasks">
                  <Flag className="mr-2 size-3.5" />
                  Tasks
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <SeriesLink slug={series.slug} tab="team">
                  <Users className="mr-2 size-3.5" />
                  Team
                </SeriesLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <SeriesLink slug={series.slug} tab="calendar">
                  <Newspaper className="mr-2 size-3.5" />
                  Publication
                </SeriesLink>
              </DropdownMenuItem>
              {series.proposalId ? (
                <DropdownMenuItem asChild>
                  <SeriesLink slug={series.slug} tab="proposal">
                    <Pencil className="mr-2 size-3.5" />
                    Proposal
                  </SeriesLink>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
