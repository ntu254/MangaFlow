import { SERIES_STATUS_LABEL } from "@/entities/series/model/series-types";
import { useSeriesProposalQuery } from "@/features/proposals";
import { useAuth } from "@/shared/auth";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, PenTool } from "lucide-react";
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
import { SeriesMaterialsLibrary } from "./series-materials-library";
import { EditTitleButton, SeriesHeaderActions, SeriesOverview } from "./series-overview";
import { SeriesProposalTab } from "./series-proposal-tab";
import { SeriesRankingsTab } from "./series-rankings-tab";
import { StudioTab } from "./studio-tab";
import { TeamPanel } from "./team-panel";
import { ResolvedImage } from "@/shared/ui";

const TABS = [
  "overview",
  "proposal",
  "chapters",
  "materials",
  "rankings",
  "calendar",
  "team",
] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  overview: "Tổng quan",
  proposal: "Proposal",
  chapters: "Chapters",
  materials: "Tư liệu",
  rankings: "Xếp hạng",
  calendar: "Lịch",
  team: "Đội ngũ",
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
  const [studioOpen, setStudioOpen] = useState(false);

  const goTab = (t: Tab) => {
    setChapterView("list");
    navigate({ to: "/app/series/$slug/$tab", params: { slug, tab: t } });
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
            ? "Lỗi tải series từ máy chủ"
            : "Series không tồn tại hoặc bạn không có quyền xem"}
        </h1>
        <Link to="/app/series" className="mt-4 inline-block text-xs text-accent underline">
          Quay về danh sách
        </Link>
      </div>
    );
  }

  if (studioOpen) {
    return (
      <StudioTab
        series={series}
        chapters={chapters}
        user={user}
        onBack={() => setStudioOpen(false)}
      />
    );
  }

  const next = chapters.find(
    (c) => c.status === "SCHEDULED" || c.status === "READY_FOR_PUBLICATION",
  );
  const canCreate =
    user.role === "admin" ||
    user.role === "editor" ||
    (user.role === "mangaka" && user.id === series.authorId);
  const published = chapters.filter((c) => c.status === "PUBLISHED");
  const studioPermissions = getStudioPermissions(user, series);
  const canEnterStudio = studioPermissions.canEnterStudio && !isLocked;

  const visibleTabs = isLocked ? (["proposal", "overview", "rankings"] as const) : TABS;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {isLocked && (
        <div className="rounded-md border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
          <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold text-sm">Sản xuất đang tạm khoá / Workspace Locked</p>
            <p className="mt-0.5 opacity-90">
              Series này đang trong quá trình xét duyệt proposal. Chapters, Studio, Đội ngũ và các
              tính năng sản xuất khác sẽ mở sau khi proposal được phê duyệt.
            </p>
          </div>
        </div>
      )}

      <header className="flex flex-wrap items-start gap-6">
        <ResolvedImage
          fileKey={series.coverFileKey}
          fallbackUrl={series.coverUrl}
          alt={series.title}
          className="h-28 w-20 flex-shrink-0 rounded object-cover ring-1 ring-border"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {SERIES_STATUS_LABEL[series.status]}
          </p>
          <h1 className="mt-1 flex items-center font-serif text-4xl">
            {series.title}
            <EditTitleButton />
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">Mangaka:</span> {series.authorName}
            </span>
            <span>
              <span className="font-semibold text-foreground">Editor:</span> {series.editorName}
            </span>
            <span>
              <span className="font-semibold text-foreground">Thể loại:</span>{" "}
              {series.genres.join(", ")}
            </span>
            <span>
              <span className="font-semibold text-foreground">Trạng thái:</span>{" "}
              <span className="ml-1 inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                {SERIES_STATUS_LABEL[series.status]}
              </span>
            </span>
            <span>
              <span className="font-semibold text-foreground">Kế tiếp:</span>{" "}
              {next ? `Ch.${next.number}` : "—"}
            </span>
            <span>
              <span className="font-semibold text-foreground">Tiến độ:</span> {published.length}/
              {series.targetChapters}
            </span>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={() => canEnterStudio && setStudioOpen(true)}
            disabled={!canEnterStudio}
            title={
              isLocked
                ? "Sản xuất đang khóa cho đến khi proposal được duyệt"
                : canEnterStudio
                  ? studioPermissions.title
                  : studioPermissions.summary
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-bold uppercase tracking-widest text-background shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PenTool className="h-4 w-4" />
            Open Studio
          </button>
          {!isLocked && <SeriesHeaderActions series={series} chapters={chapters} setTab={goTab} />}
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-border">
        {visibleTabs.map((t) => (
          <Link
            key={t}
            to="/app/series/$slug/$tab"
            params={{ slug, tab: t }}
            className={`-mb-px border-b-2 px-3 py-2 text-xs font-semibold uppercase tracking-widest ${
              tab === t
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {TAB_LABEL[t]}
          </Link>
        ))}
      </nav>

      {tab === "overview" ? (
        <SeriesOverview series={series} chapters={chapters} setTab={goTab} />
      ) : null}

      {tab === "proposal" ? <SeriesProposalTab series={series} /> : null}

      {tab === "chapters" && chapterView === "list" ? (
        <div className="space-y-4">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Quản lý chapters
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

      {tab === "chapters" && chapterView === "detail" && selected ? (
        <ChapterDetailWorkspace
          chapter={selected}
          series={series}
          audit={audit.filter((a) => a.entity === "chapter" && a.entityId === selected.id)}
          user={user}
          onBack={() => setChapterView("list")}
          canEnterStudio={canEnterStudio}
          onOpenStudio={() => setStudioOpen(true)}
        />
      ) : null}

      {tab === "calendar" ? (
        <PublicationCalendar series={allSeries ?? []} chapters={chapters} seriesId={series.id} />
      ) : null}

      {tab === "materials" ? <SeriesMaterialsLibrary series={series} chapters={chapters} /> : null}

      {tab === "rankings" ? <SeriesRankingsTab series={series} /> : null}

      {tab === "team" ? <TeamPanel series={series} chapters={chapters} /> : null}
    </div>
  );
}
