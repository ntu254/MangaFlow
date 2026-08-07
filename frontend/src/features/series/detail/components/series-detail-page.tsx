import { SERIES_STATUS_LABEL } from "@/entities/series/model/series-types";
import { useSeriesProposalQuery } from "@/features/proposals";
import { useAuth } from "@/shared/auth";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Compass,
  FileText,
  Layers,
  PenTool,
  Sparkles,
  Trophy,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useChaptersQuery,
  useMySeriesQuery,
  useSeriesActivityQuery,
} from "../../api/series-queries";
import { getStudioPermissions } from "../model/studio-permissions";
import { ChapterDetailWorkspace } from "./chapter-detail-workspace";
import { ChapterKpiStrip } from "./chapter-kpi-strip";
import { ChapterTable } from "./chapter-table";
import { PublicationCalendar } from "./publication-calendar";
import { EditTitleButton, SeriesHeaderActions, SeriesOverview } from "./series-overview";
import { SeriesProposalTab } from "./series-proposal-tab";
import { SeriesRankingsTab } from "./series-rankings-tab";
import { StudioTab } from "./studio-tab";
import { TeamPanel } from "./team-panel";
import { ResolvedImage } from "@/shared/ui";

const TABS = ["overview", "proposal", "chapters", "rankings", "calendar", "team"] as const;
type NavTab = (typeof TABS)[number];
type Tab = NavTab | "studio";
const TAB_LABEL: Record<NavTab, string> = {
  overview: "Overview",
  proposal: "Proposal",
  chapters: "Chapters",
  rankings: "Rankings",
  calendar: "Calendar",
  team: "Team",
};

const TAB_ICON: Record<NavTab, typeof Compass> = {
  overview: Compass,
  proposal: FileText,
  chapters: Layers,
  rankings: Trophy,
  calendar: Calendar,
  team: Users,
};

export function SeriesDetailPage({ slug, tab }: { slug: string; tab: Tab }) {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();

  const { data: allSeries, isLoading: isSeriesLoading, error: seriesError } = useMySeriesQuery();
  const series = useMemo(() => allSeries?.find((x) => x.slug === slug), [allSeries, slug]);

  const { data: chapters = [] } = useChaptersQuery(series?.id ?? "");
  const { data: proposal } = useSeriesProposalQuery(series);
  const { data: activity = [] } = useSeriesActivityQuery(series?.id ?? "");
  const audit = useMemo(
    () =>
      activity.map((entry) => ({
        id: entry.id,
        actorId: entry.actorId,
        actorName: String(entry.metadata?.actorName ?? entry.actorRole ?? entry.actorId),
        actorRole: String(entry.actorRole).toLowerCase() as never,
        entity: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        detail: typeof entry.metadata?.detail === "string" ? entry.metadata.detail : undefined,
        createdAt: entry.createdAt,
      })),
    [activity],
  );

  const isLocked = !!(series?.proposalId && proposal && proposal.status !== "APPROVED");

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [chapterView, setChapterView] = useState<"list" | "detail">("list");

  const goTab = (t: Tab) => {
    setChapterView("list");
    navigate({
      to: "/app/series/$slug/$tab",
      params: { slug, tab: t },
      from: "/app/series/$slug/$tab",
    });
  };

  const selected = useMemo(
    () => chapters.find((c) => c.id === (selectedChapterId ?? chapters[0]?.id)),
    [chapters, selectedChapterId],
  );

  if (isSeriesLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
        <div className="h-28 bg-muted rounded-md" />
        <div className="h-10 bg-muted rounded-md" />
        <div className="h-64 bg-muted rounded-md" />
      </div>
    );
  }

  if (seriesError || !series || !user) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <h1 className="font-serif text-3xl">
          {seriesError
            ? "Error loading series from server"
            : "Series does not exist or you do not have access"}
        </h1>
        <Link to="/app/series" className="mt-4 inline-block text-xs text-accent underline">
          Back to list
        </Link>
      </div>
    );
  }

  const studioPermissions = getStudioPermissions(user, series);
  const canEnterStudio = studioPermissions.canEnterStudio && !isLocked;

  // /studio is a real tab URL; users without studio access fall back to overview.
  const effectiveTab: Tab = tab === "studio" && !canEnterStudio ? "overview" : tab;

  if (effectiveTab === "studio") {
    return (
      <StudioTab series={series} chapters={chapters} user={user} onBack={() => goTab("overview")} />
    );
  }

  const next = chapters.find((c) => c.status === "READY_FOR_PUBLICATION");
  const canCreate = user.role === "mangaka" && user.id === series.authorId;
  const published = chapters.filter((c) => c.status === "PUBLISHED");

  const visibleTabs = isLocked ? (["proposal", "overview", "rankings"] as const) : TABS;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {isLocked && (
        <div className="rounded-md border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
          <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold text-sm">
              Production is temporarily locked / Workspace Locked
            </p>
            <p className="mt-0.5 opacity-90">
              This series is undergoing proposal review. Chapters, Studio, Team, and other
              production features will be available after the proposal is approved.
            </p>
          </div>
        </div>
      )}

      {/* ── Elevated Series Header Card ── */}
      <header className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-5 shadow-xs backdrop-blur-md md:p-6">
        {/* Subtle background ambient lighting glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Left: Cover & Info */}
          <div className="flex flex-1 flex-col gap-5 sm:flex-row sm:items-start">
            {/* Cover Frame */}
            <div className="relative shrink-0">
              <ResolvedImage
                fileKey={series.coverFileKey}
                fallbackUrl={series.coverUrl}
                alt={series.title}
                className="h-36 w-24 rounded-xl object-cover shadow-md ring-1 ring-border/80 transition-transform duration-300 hover:scale-[1.02] md:h-40 md:w-28"
              />
            </div>

            {/* Title & Metadata */}
            <div className="min-w-0 flex-1 space-y-3">
              {/* Status Pill & Target Indicator */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  {SERIES_STATUS_LABEL[series.status]}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  <BookOpen className="size-3 text-muted-foreground" />
                  {published.length} / {series.targetChapters} chapters
                </span>
              </div>

              {/* Series Title */}
              <h1 className="flex max-w-3xl items-center font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {series.title}
                <EditTitleButton />
              </h1>

              {/* Structured Metadata Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {/* Author */}
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 text-foreground/90">
                  <User className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Author:</span>
                  <span className="font-semibold text-foreground">{series.authorName}</span>
                </div>

                {/* Editor */}
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 text-foreground/90">
                  <UserCheck className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Editor:</span>
                  <span className="font-semibold text-foreground">{series.editorName}</span>
                </div>

                {/* Next Chapter */}
                {next && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="size-3.5" />
                    <span className="font-medium">Next up:</span>
                    <span className="font-bold">Ch.{next.number}</span>
                  </div>
                )}

                {/* Genres */}
                {series.genres.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pl-1">
                    {series.genres.map((g) => (
                      <span
                        key={g}
                        className="inline-flex items-center rounded-md border border-border/50 bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:self-start">
            <button
              onClick={() => canEnterStudio && goTab("studio")}
              disabled={!canEnterStudio}
              title={
                isLocked
                  ? "Production is locked until the proposal is approved"
                  : canEnterStudio
                    ? studioPermissions.title
                    : studioPermissions.summary
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-xs font-bold uppercase tracking-wider text-background shadow-xs transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PenTool className="size-4" />
              Open Studio
            </button>
            {!isLocked && (
              <SeriesHeaderActions series={series} chapters={chapters} setTab={goTab} />
            )}
          </div>
        </div>
      </header>

      {/* ── Refined Main Series Nav Tabs (Linear Style) ── */}
      <nav
        aria-label="Series Tabs"
        className="flex items-center gap-1 overflow-x-auto border-b border-border/80 px-1"
      >
        {visibleTabs.map((t) => {
          const isActive = effectiveTab === t;
          const Icon = TAB_ICON[t];
          return (
            <Link
              key={t}
              to="/app/series/$slug/$tab"
              from="/app/series/$slug/$tab"
              params={{ slug, tab: t }}
              className={`group relative inline-flex items-center gap-2 whitespace-nowrap px-4 py-3 text-xs font-semibold transition-all ${
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                className={`size-3.5 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              <span>{TAB_LABEL[t]}</span>
              {t === "chapters" && chapters.length > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums ${
                    isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {chapters.length}
                </span>
              )}
              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary shadow-xs" />
              )}
            </Link>
          );
        })}
      </nav>

      {effectiveTab === "overview" ? (
        <SeriesOverview series={series} chapters={chapters} setTab={goTab} />
      ) : null}

      {effectiveTab === "proposal" ? <SeriesProposalTab series={series} /> : null}

      {effectiveTab === "chapters" && chapterView === "list" ? (
        <div className="space-y-4">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Manage chapters
            </p>
            <ChapterKpiStrip series={series} chapters={chapters} current={selected} />
          </div>
          <ChapterTable
            series={series}
            onSelect={(id) => {
              setSelectedChapterId(id);
              setChapterView("detail");
            }}
            selectedId={selected?.id}
            canCreate={canCreate}
          />
        </div>
      ) : null}

      {effectiveTab === "chapters" && chapterView === "detail" && selected ? (
        <ChapterDetailWorkspace
          chapter={selected}
          series={series}
          audit={audit.filter((a) => a.entity === "chapter" && a.entityId === selected.id)}
          user={user}
          onBack={() => setChapterView("list")}
          canEnterStudio={canEnterStudio}
          onOpenStudio={() => goTab("studio")}
        />
      ) : null}

      {effectiveTab === "calendar" ? (
        <PublicationCalendar series={allSeries ?? []} chapters={chapters} seriesId={series.id} />
      ) : null}

      {effectiveTab === "rankings" ? <SeriesRankingsTab series={series} /> : null}

      {effectiveTab === "team" ? <TeamPanel series={series} chapters={chapters} /> : null}
    </div>
  );
}
