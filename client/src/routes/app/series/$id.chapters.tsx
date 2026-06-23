import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Filter,
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  Upload,
  Lock,
  Clock,
  CheckCircle2,
  ListChecks,
  Send,
} from "lucide-react";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useSeriesSummary } from "@/shared/queries/useSeries";
import { ChapterRow } from "@/features/chapters/components/ChapterRow";
import { PageUploadDialog } from "@/features/chapters/components/PageUploadPanel";
import { useChapterPages, useChapterReadiness } from "@/shared/queries/useChapterPages";
import {
  useCreateChapter,
  useDeletePage,
  useReplacePage,
  useSendChapterToEditor,
} from "@/shared/queries/useChapterPages";
import { Trash2, RefreshCw } from "lucide-react";
import { useFileObjectUrl } from "@/shared/queries/useFileObjectUrl";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";

const PAGE_FILTERS = ["All", "Approved", "Under review", "With tasks", "Pending"] as const;
type PageFilter = (typeof PAGE_FILTERS)[number];

type ChaptersSearch = {
  chapterId?: string;
  q?: string;
  filter?: PageFilter;
  visible?: number;
};

function isPageFilter(value: unknown): value is PageFilter {
  return typeof value === "string" && PAGE_FILTERS.includes(value as PageFilter);
}

type ChapterHandoffAction =
  | "manuscript"
  | "upload-pages"
  | "failed-pages"
  | "wait"
  | "review-submissions";

type ChapterHandoffBlocker = {
  id: string;
  label: string;
  actionHint: string;
  action?: ChapterHandoffAction;
};

type ChapterHandoffChapter = {
  id: string;
  title: string;
} | null;

type ChapterHandoffPage = {
  status: string;
  activeTask?: {
    status?: string;
  };
};

function getChapterHandoffBlockers({
  seriesStatus,
  currentManuscript,
  selectedChapter,
  pages,
}: {
  seriesStatus?: string;
  currentManuscript: unknown;
  selectedChapter: ChapterHandoffChapter;
  pages: ChapterHandoffPage[];
}): ChapterHandoffBlocker[] {
  const blockers: ChapterHandoffBlocker[] = [];
  const canSendChapter = ["ONGOING", "AT_RISK"].includes(seriesStatus ?? "");
  const pageStatuses = pages.map((page) => page.status.toUpperCase());
  const taskStatuses = pages
    .map((page) => page.activeTask?.status?.toUpperCase())
    .filter((status): status is string => Boolean(status));
  const unfinishedPages = pageStatuses.filter((status) =>
    ["PENDING", "UPLOADING", "PROCESSING"].includes(status),
  ).length;
  const failedPages = pageStatuses.filter((status) =>
    ["PROCESSING_FAILED", "UPLOAD_FAILED"].includes(status),
  ).length;

  const waitingForAssistant = taskStatuses.filter((status) =>
    ["TODO", "IN_PROGRESS"].includes(status),
  ).length;
  const waitingForMangakaReview = taskStatuses.filter((status) => status === "SUBMITTED").length;
  const revisionRequested = taskStatuses.filter((status) => status === "REVISION_REQUESTED").length;

  if (!canSendChapter) {
    blockers.push({
      id: "series-status",
      label: `This series cannot be sent from here because its current status is ${seriesStatus ?? "not ready"}.`,
      actionHint:
        "Chapter handoff is available after the series is in Ongoing or At Risk production.",
    });
  }

  if (!currentManuscript) {
    blockers.push({
      id: "missing-manuscript",
      label: "Upload the manuscript or final draft for this series.",
      actionHint: "Open the Manuscript tab and attach the latest proposal package.",
      action: "manuscript",
    });
  }

  if (!selectedChapter) {
    blockers.push({
      id: "missing-chapter",
      label: "Select a chapter to send to Editor.",
      actionHint: "Choose one chapter from the chapter list.",
    });
  }

  if (selectedChapter && pages.length === 0) {
    blockers.push({
      id: "missing-pages",
      label: "Upload at least one page in the selected chapter.",
      actionHint: "Use Upload pages to add the chapter package.",
      action: "upload-pages",
    });
  }

  if (unfinishedPages > 0) {
    blockers.push({
      id: "processing-pages",
      label: "Wait for page processing to finish.",
      actionHint: `${unfinishedPages} page(s) are still uploading or generating assets.`,
      action: "wait",
    });
  }

  if (failedPages > 0) {
    blockers.push({
      id: "failed-pages",
      label: "Replace failed page uploads.",
      actionHint: `${failedPages} page upload(s) failed and need replacement before handoff.`,
      action: "failed-pages",
    });
  }

  if (waitingForAssistant > 0) {
    blockers.push({
      id: "assistant-work-open",
      label: "Wait for Assistant work to be submitted.",
      actionHint: `${waitingForAssistant} task(s) are still assigned or in progress.`,
      action: "wait",
    });
  }

  if (waitingForMangakaReview > 0) {
    blockers.push({
      id: "mangaka-review-open",
      label: "Review submitted Assistant work before Editor handoff.",
      actionHint: `${waitingForMangakaReview} submission(s) need Mangaka approval first.`,
      action: "review-submissions",
    });
  }

  if (revisionRequested > 0) {
    blockers.push({
      id: "revision-requested",
      label: "Resolve requested Assistant revisions before handoff.",
      actionHint: `${revisionRequested} task(s) are waiting for revised Assistant work.`,
      action: "wait",
    });
  }

  return blockers;
}

export const Route = createFileRoute("/app/series/$id/chapters")({
  validateSearch: (search: Record<string, unknown>): ChaptersSearch => ({
    chapterId: typeof search.chapterId === "string" ? search.chapterId : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
    filter: isPageFilter(search.filter) ? search.filter : "All",
    visible:
      typeof search.visible === "number" && Number.isFinite(search.visible) && search.visible > 0
        ? Math.floor(search.visible)
        : 9,
  }),
  component: SeriesChapters,
});

const chapterBadgeClass: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
  "in-production": "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  in_production: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  "ready-for-publication": "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  ready_for_publication: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  published: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300",
  archived: "bg-slate-500/12 text-slate-600 dark:text-slate-300",
};

const chapterBadgeLabel: Record<string, string> = {
  draft: "DRAFT",
  "in-production": "IN PRODUCTION",
  in_production: "IN PRODUCTION",
  "ready-for-publication": "READY FOR PUBLICATION",
  ready_for_publication: "READY FOR PUBLICATION",
  published: "PUBLISHED",
  archived: "ARCHIVED",
};

function PageThumbnail({ page }: { page: { thumbnailFileAssetId?: string; pageNumber?: number } }) {
  const { data: url, isLoading } = useFileObjectUrl(page.thumbnailFileAssetId);
  if (isLoading) return <div className="absolute inset-0 bg-foreground/5 animate-pulse" />;
  if (!url)
    return (
      <div className="absolute inset-0 bg-foreground/5 flex items-center justify-center text-[10px] text-foreground/40 font-semibold uppercase">
        No Image
      </div>
    );
  return (
    <img
      src={url}
      alt={`Page ${page.pageNumber}`}
      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  );
}

function SeriesChapters() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data: summary, isLoading } = useSeriesSummary(id);
  const gridRef = useRef<HTMLDivElement>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateChapterOpen, setIsCreateChapterOpen] = useState(false);
  const [isUploadPagesOpen, setIsUploadPagesOpen] = useState(false);
  const [isPageViewerOpen, setIsPageViewerOpen] = useState(false);
  const [viewerPageIndex, setViewerPageIndex] = useState(0);
  const [newChapterNumber, setNewChapterNumber] = useState(1);
  const [newChapterTitle, setNewChapterTitle] = useState("");

  const deletePage = useDeletePage();
  const replacePage = useReplacePage();
  const createChapter = useCreateChapter(id);
  const sendChapterToEditor = useSendChapterToEditor(id);

  const pageSearchQuery = search.q ?? "";
  const selectedFilter = search.filter ?? "All";
  const visiblePagesCount = search.visible ?? 9;

  const updateSearch = useCallback(
    (patch: Partial<ChaptersSearch>) => {
      navigate({
        search: (prev) => ({ ...prev, ...patch }),
        replace: false,
      });
    },
    [navigate],
  );

  const [dialogConfig, setDialogConfig] = useState<{
    open: boolean;
    pageId: string | null;
  }>({
    open: false,
    pageId: null,
  });

  const mappedChapters = useMemo(() => {
    if (!summary?.chapters) return [];
    return summary.chapters
      .map(
        (ch: {
          id: string;
          chapterNumber?: number | string;
          title?: string;
          status?: string;
          updatedAt: string;
          pageCount: number;
          approvedPages: number;
        }) => {
          const progress =
            ch.pageCount > 0 ? Math.round((ch.approvedPages / ch.pageCount) * 100) : 0;
          return {
            id: ch.id,
            chapter: ch.chapterNumber?.toString(),
            title: ch.title || `Chapter ${ch.chapterNumber}`,
            routeId: ch.id,
            status: ch.status?.toLowerCase() || "draft",
            cadence: "Weekly",
            updated: `Updated ${new Date(ch.updatedAt).toLocaleDateString()}`,
            pages: `${ch.approvedPages} / ${ch.pageCount} pages`,
            meta: ch.pageCount === 0 ? "No pages yet" : "In progress",
            progress,
            action: ch.status === "PUBLISHED" ? "View publication" : "Open studio",
            active: ch.status === "IN_PRODUCTION",
          };
        },
      )
      .sort(
        (a: { chapter: string }, b: { chapter: string }) =>
          parseInt(b.chapter) - parseInt(a.chapter),
      );
  }, [summary?.chapters]);

  const selectedChapterId = search.chapterId ?? null;
  const nextChapterNumber = useMemo(() => {
    const chapterNumbers = mappedChapters
      .map((chapter: { chapter: string }) => Number.parseInt(chapter.chapter, 10))
      .filter(Number.isFinite);
    return Math.max(0, ...chapterNumbers) + 1;
  }, [mappedChapters]);

  useEffect(() => {
    if (!selectedChapterId && mappedChapters.length > 0) {
      updateSearch({ chapterId: mappedChapters[0].id });
    }
  }, [mappedChapters, selectedChapterId, updateSearch]);

  useEffect(() => {
    if (!isCreateChapterOpen) return;
    setNewChapterNumber(nextChapterNumber);
    setNewChapterTitle(`Chapter ${nextChapterNumber}`);
  }, [isCreateChapterOpen, nextChapterNumber]);

  const effectiveChapterId = selectedChapterId ?? mappedChapters[0]?.id ?? null;
  const { data: pages = [], isLoading: pagesLoading } = useChapterPages(
    effectiveChapterId || undefined,
  );
  const { data: readiness, isLoading: readinessLoading } = useChapterReadiness(
    effectiveChapterId || undefined,
  );

  const selectedChapter = mappedChapters.find((ch: { id: string }) => ch.id === effectiveChapterId);
  const seriesStatus = summary.series?.status;
  const readinessBlockers = readiness?.items.filter((item) => !item.passed) ?? [];
  const chapterHandoffBlockers = getChapterHandoffBlockers({
    seriesStatus,
    currentManuscript: summary.currentManuscript,
    selectedChapter: selectedChapter ?? null,
    pages,
  });
  const chapterHandoffReady = chapterHandoffBlockers.length === 0;

  const filteredPages = useMemo(() => {
    const normalizedQuery = pageSearchQuery.trim().toLowerCase();
    return pages.filter(
      (page: { id: string; status: string; pageNumber?: number; sequenceNumber?: number }) => {
        const status = page.status.toUpperCase();
        const pageNumber = String(page.pageNumber ?? page.sequenceNumber ?? "");
        const matchesQuery = !normalizedQuery || pageNumber.includes(normalizedQuery);
        const matchesFilter =
          selectedFilter === "All" ||
          (selectedFilter === "Approved" && status === "APPROVED") ||
          (selectedFilter === "Under review" && status === "READY_FOR_EDITOR") ||
          (selectedFilter === "With tasks" && status === "IN_TASK") ||
          (selectedFilter === "Pending" &&
            ["PENDING", "UPLOADING", "PROCESSING", "UPLOADED"].includes(status));
        return matchesQuery && matchesFilter;
      },
    );
  }, [pageSearchQuery, pages, selectedFilter]);

  const orderedPages = useMemo(
    () =>
      [...pages].sort(
        (a, b) =>
          (a.pageNumber ?? a.sequenceNumber ?? Number.MAX_SAFE_INTEGER) -
          (b.pageNumber ?? b.sequenceNumber ?? Number.MAX_SAFE_INTEGER),
      ),
    [pages],
  );

  useEffect(() => {
    if (orderedPages.length === 0) {
      setViewerPageIndex(0);
      return;
    }
    setViewerPageIndex((current) => Math.min(current, orderedPages.length - 1));
  }, [orderedPages.length]);

  const openPageViewer = useCallback(
    (chapterId: string) => {
      updateSearch({ chapterId, visible: 9 });
      setViewerPageIndex(0);
      setIsPageViewerOpen(true);
    },
    [updateSearch],
  );

  if (isLoading || !summary) {
    return <div className="p-8 text-center text-foreground/50 text-sm">Loading chapters...</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-5 pt-2 xl:grid-cols-[7fr_3fr]">
      <section className="flex min-h-full flex-col overflow-hidden rounded-[10px] border border-foreground/10 bg-card shadow-[0_2px_14px_rgba(5,24,38,0.05)]">
        <header className="flex flex-col gap-4 border-b border-foreground/7 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-extrabold leading-none tracking-tight text-foreground">
                Chapter List
              </h2>
              <p className="mt-2 text-[11px] font-semibold text-foreground/50">
                Manage production progress and publication readiness by chapter.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {["All", "Draft", "In Production", "Ready", "Published"].map((filter, i) => (
                <button
                  key={filter}
                  className={`h-7 rounded-md px-2.5 text-[10px] font-extrabold transition-colors ${
                    i === 0
                      ? "bg-[#061A2B] text-white shadow-sm dark:bg-blue-600"
                      : "border border-foreground/12 bg-foreground/[0.025] text-foreground/60 hover:bg-foreground/7 hover:text-foreground"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button className="h-8 rounded-md border border-foreground/12 bg-card px-3 text-[10px] font-extrabold text-foreground/60 shadow-sm hover:bg-foreground/5">
                Latest updated
              </button>
              <button
                type="button"
                onClick={() => setIsCreateChapterOpen(true)}
                className="h-8 rounded-md bg-[#061A2B] px-3.5 text-[10px] font-extrabold text-white shadow-md hover:bg-[#0B2A43] dark:bg-blue-600"
              >
                Create Chapter
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 divide-y divide-foreground/7">
          {mappedChapters.length > 0 ? (
            mappedChapters.map(
              (chapter: {
                id: string;
                chapter: string;
                title: string;
                routeId: string;
                status: string;
                cadence: string;
                updated: string;
                pages: string;
                meta: string;
                progress: number;
                action: string;
                active: boolean;
              }) => (
                <ChapterRow
                  key={chapter.id}
                  chapter={chapter}
                  seriesId={id}
                  chapterBadgeClass={chapterBadgeClass}
                  chapterBadgeLabel={chapterBadgeLabel}
                  isSelected={chapter.id === effectiveChapterId}
                  onClick={() => updateSearch({ chapterId: chapter.id, visible: 9 })}
                  onViewPages={() => openPageViewer(chapter.id)}
                />
              ),
            )
          ) : (
            <div className="p-8 text-center text-[12px] font-medium text-foreground/50">
              No chapters found for this series.
            </div>
          )}
        </div>

        <footer className="mt-auto flex items-center justify-between gap-3 border-t border-foreground/7 px-4 py-3 text-[10px] font-semibold text-foreground/50">
          <span>
            Showing 1 to {Math.min(mappedChapters.length, 5)} of {mappedChapters.length} chapters
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous page"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground/12 bg-card text-foreground/35 shadow-sm transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-45"
              disabled
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {[1].map((page) => (
              <button
                key={page}
                type="button"
                className={`h-7 min-w-7 rounded-md px-2 text-[10px] font-black transition-colors ${
                  page === 1
                    ? "bg-[#061A2B] text-white shadow-sm dark:bg-blue-600"
                    : "border border-foreground/12 bg-card text-foreground/55 shadow-sm hover:bg-foreground/5"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground/12 bg-card text-foreground/55 shadow-sm transition-colors hover:bg-foreground/5"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </footer>
      </section>

      <section className="overflow-hidden rounded-[10px] border border-foreground/10 bg-card shadow-[0_2px_14px_rgba(5,24,38,0.05)]">
        <header className="flex items-start justify-between gap-4 px-4 pb-3 pt-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[18px] font-extrabold leading-none tracking-tight text-foreground">
                Chapter Preview
              </h2>
              {selectedChapter && (
                <span
                  className={`rounded px-2 py-1 text-[9px] font-black uppercase leading-none tracking-wider ${chapterBadgeClass[selectedChapter.status] || "bg-foreground/10"}`}
                >
                  {chapterBadgeLabel[selectedChapter.status] || selectedChapter.status}
                </span>
              )}
            </div>
          </div>
          <button className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground/12 bg-card text-foreground/55 shadow-sm hover:bg-foreground/5">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </header>

        <div className="px-4 pb-4">
          <section className="mt-3 rounded-md border border-foreground/10 bg-foreground/[0.025] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-foreground/55">
                  <ListChecks className="h-3.5 w-3.5" />
                  Chapter handoff to Editor
                </div>
                <div className="mt-2 text-sm font-bold text-foreground">
                  {pagesLoading
                    ? "Checking chapter pages..."
                    : chapterHandoffReady
                      ? "Chapter package is ready for Tantou Editor."
                      : "Complete the required chapter items before sending this chapter to Editor."}
                </div>
                <div className="mt-1 text-xs text-foreground/55">
                  Mangaka can send final uploaded pages directly, or send Assistant-assisted work
                  after approving submissions. Editor handles final approval, scheduling, and
                  publishing later.
                </div>
              </div>
              <button
                type="button"
                disabled={
                  !chapterHandoffReady || sendChapterToEditor.isPending || !effectiveChapterId
                }
                onClick={() =>
                  effectiveChapterId ? sendChapterToEditor.mutate(effectiveChapterId) : undefined
                }
                className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#061A2B] px-3 text-[11px] font-extrabold text-white hover:bg-[#0B2A43] disabled:cursor-not-allowed disabled:bg-foreground/10 disabled:text-foreground/40 dark:bg-blue-600"
              >
                <Send className="h-3.5 w-3.5" />
                {sendChapterToEditor.isPending ? "Sending..." : "Send Chapter to Editor"}
              </button>
            </div>

            {!pagesLoading && (
              <div className="mt-3 rounded-md border border-foreground/10 bg-card p-3">
                {chapterHandoffReady ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Chapter handoff checks passed.
                  </div>
                ) : (
                  <ul className="space-y-2 text-xs text-foreground/65">
                    {chapterHandoffBlockers.slice(0, 5).map((blocker) => (
                      <li key={blocker.id} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-foreground/75">{blocker.label}</div>
                          <div className="mt-0.5 text-[11px] text-foreground/45">
                            {blocker.actionHint}
                          </div>
                          {blocker.action === "manuscript" && (
                            <Link
                              to="/app/series/$id/manuscript"
                              params={{ id }}
                              className="mt-2 inline-flex h-7 items-center rounded-md border border-foreground/12 px-2.5 text-[10px] font-bold text-foreground/65 hover:bg-foreground/5"
                            >
                              Open Manuscript
                            </Link>
                          )}
                          {blocker.action === "upload-pages" && selectedChapter && (
                            <button
                              type="button"
                              onClick={() => setIsUploadPagesOpen(true)}
                              className="mt-2 inline-flex h-7 items-center rounded-md border border-foreground/12 px-2.5 text-[10px] font-bold text-foreground/65 hover:bg-foreground/5"
                            >
                              Upload pages
                            </button>
                          )}
                          {blocker.action === "failed-pages" && (
                            <button
                              type="button"
                              onClick={() =>
                                gridRef.current?.scrollIntoView({ behavior: "smooth" })
                              }
                              className="mt-2 inline-flex h-7 items-center rounded-md border border-foreground/12 px-2.5 text-[10px] font-bold text-foreground/65 hover:bg-foreground/5"
                            >
                              Review failed pages
                            </button>
                          )}
                          {blocker.action === "wait" && (
                            <span className="mt-2 inline-flex h-7 items-center rounded-md bg-foreground/5 px-2.5 text-[10px] font-bold text-foreground/45">
                              Wait for processing
                            </span>
                          )}
                          {blocker.action === "review-submissions" && (
                            <Link
                              to="/app/series/$id/reviews"
                              params={{ id }}
                              className="mt-2 inline-flex h-7 items-center rounded-md border border-foreground/12 px-2.5 text-[10px] font-bold text-foreground/65 hover:bg-foreground/5"
                            >
                              Open Reviews
                            </Link>
                          )}
                        </div>
                      </li>
                    ))}
                    {chapterHandoffBlockers.length > 5 && (
                      <li className="text-foreground/45">
                        + {chapterHandoffBlockers.length - 5} more blocker(s)
                      </li>
                    )}
                  </ul>
                )}
                {!readinessLoading && readinessBlockers.length > 0 && (
                  <div className="mt-3 border-t border-foreground/10 pt-3 text-[11px] text-foreground/45">
                    Publication readiness still has {readinessBlockers.length} blocker(s). This does
                    not block Mangaka handoff; Editor can resolve it after review.
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="mt-3 rounded-md border border-foreground/10 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[12px] font-bold text-foreground/50 tracking-wider uppercase">
                PAGES ({filteredPages.length})
              </h2>
              <div className="flex items-center gap-1">
                <div className="flex items-center pl-1.5 pr-1 py-0.5 rounded border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 focus-within:bg-foreground/5 focus-within:border-foreground/30 focus-within:w-28 w-20 transition-all duration-300 overflow-hidden">
                  <Search className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full min-w-0 text-[11px] bg-transparent border-none focus:ring-0 px-1.5 outline-none text-foreground placeholder:text-foreground/30"
                    value={pageSearchQuery}
                    onChange={(e) => updateSearch({ q: e.target.value, visible: 9 })}
                  />
                </div>
                <div className="relative">
                  <button
                    className={`flex h-6 w-6 items-center justify-center rounded border transition-colors shrink-0 ${isFilterOpen ? "border-foreground/20 bg-foreground/5 text-foreground" : "border-transparent text-foreground/40 hover:bg-foreground/5 hover:text-foreground"}`}
                    title="Filter pages"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                  >
                    <Filter className="h-3.5 w-3.5" />
                  </button>
                  {isFilterOpen && (
                    <div className="absolute top-full right-0 mt-1 w-36 bg-card border border-foreground/10 shadow-lg rounded-md overflow-hidden z-20 py-1">
                      {PAGE_FILTERS.map((filter) => {
                        const dotClass =
                          filter === "Approved"
                            ? "bg-emerald-500"
                            : filter === "Under review"
                              ? "bg-blue-500"
                              : filter === "With tasks"
                                ? "bg-orange-500"
                                : filter === "Pending"
                                  ? "border border-foreground/30 bg-white"
                                  : null;
                        return (
                          <button
                            key={filter}
                            onClick={() => {
                              updateSearch({ filter, visible: 9 });
                              setIsFilterOpen(false);
                            }}
                            className={`flex items-center gap-2 w-full px-3 py-1.5 text-[11px] text-left hover:bg-foreground/5 transition-colors ${selectedFilter === filter ? "bg-foreground/5 font-semibold text-foreground" : "text-foreground/70"}`}
                          >
                            {dotClass ? (
                              <div
                                className={`w-2 h-2 rounded-full shrink-0 shadow-sm ${dotClass}`}
                              />
                            ) : (
                              <div className="w-2 h-2 shrink-0" />
                            )}
                            {filter}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              ref={gridRef}
              className="grid grid-cols-3 gap-3 max-h-[440px] overflow-y-auto pr-1 -mr-1 custom-scrollbar"
            >
              {pagesLoading ? (
                <div className="col-span-3 text-center text-[11px] py-6 text-foreground/40">
                  Loading pages...
                </div>
              ) : filteredPages.length === 0 ? (
                <div className="col-span-3 text-center text-[11px] py-6 text-foreground/40">
                  No pages uploaded yet.
                </div>
              ) : (
                filteredPages
                  .slice(0, visiblePagesCount)
                  .map(
                    (page: {
                      id: string;
                      status: string;
                      workingFileAssetId?: string;
                      thumbnailFileAssetId?: string;
                      sequenceNumber?: number;
                      pageNumber?: number;
                    }) => {
                      const isApproved = page.status === "APPROVED";
                      const isUnderReview = page.status === "READY_FOR_EDITOR";
                      const isTaskAssigned = page.status === "IN_TASK";
                      const isProcessing = ["PENDING", "UPLOADING", "PROCESSING"].includes(
                        page.status,
                      );
                      const isFailed = ["PROCESSING_FAILED", "UPLOAD_FAILED"].includes(page.status);

                      // Mangaka still needs read/edit visibility after a task is assigned.
                      const canOpenStudio =
                        ["UPLOADED", "IN_TASK", "READY_FOR_EDITOR", "APPROVED", "LOCKED"].includes(
                          page.status,
                        ) && Boolean(page.workingFileAssetId);

                      return (
                        <div
                          key={page.id}
                          className="relative aspect-[3/4] rounded-md overflow-hidden group border border-foreground/10 block bg-foreground/5"
                        >
                          <PageThumbnail page={page} />

                          {/* Number Badge */}
                          <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-1.5 py-0.5 rounded-sm min-w-[20px] text-center z-10">
                            {page.pageNumber}
                          </div>

                          {/* Status Dot */}
                          <div
                            title={page.status}
                            className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border border-white shadow-sm z-10 ${
                              isApproved
                                ? "bg-emerald-500"
                                : isUnderReview
                                  ? "bg-blue-500"
                                  : isTaskAssigned
                                    ? "bg-orange-500"
                                    : isFailed
                                      ? "bg-destructive"
                                      : isProcessing
                                        ? "bg-sky-400 animate-pulse"
                                        : "bg-white"
                            }`}
                          />

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-20 gap-2">
                            <div className="absolute top-2 left-2 flex gap-1">
                              {!isTaskAssigned && !isApproved && !isUnderReview ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setDialogConfig({ open: true, pageId: page.id });
                                    }}
                                    className="w-6 h-6 flex items-center justify-center bg-red-500/80 text-white rounded hover:bg-red-600 transition-colors"
                                    title="Delete Page"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const newId = prompt(
                                        "Enter new originalFileAssetId to replace:",
                                      );
                                      if (newId)
                                        replacePage.mutate({
                                          chapterId: effectiveChapterId!,
                                          pageId: page.id,
                                          originalFileAssetId: newId,
                                        });
                                    }}
                                    className="w-6 h-6 flex items-center justify-center bg-blue-500/80 text-white rounded hover:bg-blue-600 transition-colors"
                                    title="Replace Page"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <div
                                  title="This page has active tasks/submissions. Cancel or reassign tasks first to modify."
                                  className="w-6 h-6 flex items-center justify-center bg-foreground/20 text-white/50 rounded cursor-not-allowed"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            {canOpenStudio ? (
                              <Link
                                to="/app/pages/$id/studio"
                                params={{ id: page.id }}
                                search={{ seriesId: id }}
                                className="bg-white text-black px-3 py-1.5 rounded text-[10px] font-bold shadow hover:bg-gray-100 transition-colors"
                              >
                                Open Studio
                              </Link>
                            ) : isProcessing ? (
                              <div className="flex flex-col items-center gap-1 text-white text-[10px] font-semibold text-center px-2">
                                <Clock className="w-4 h-4 mb-1" />
                                <span>Processing assets...</span>
                              </div>
                            ) : isFailed ? (
                              <div className="flex flex-col items-center gap-1 text-white text-[10px] font-semibold text-center px-2">
                                <span className="text-red-300">Upload Failed</span>
                              </div>
                            ) : (
                              <div
                                className="flex flex-col items-center gap-1 text-white/80 text-[10px] font-semibold text-center px-2"
                                title="Studio is only available for UPLOADED pages with a working image"
                              >
                                <Lock className="w-4 h-4 mb-1" />
                                <span>Studio Locked</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )
              )}
            </div>

            {filteredPages.length > visiblePagesCount && (
              <button
                onClick={() => {
                  updateSearch({ visible: visiblePagesCount + 9 });
                  setTimeout(() => {
                    if (gridRef.current) {
                      gridRef.current.scrollTo({
                        top: gridRef.current.scrollHeight,
                        behavior: "smooth",
                      });
                    }
                  }, 100);
                }}
                className="mx-auto block mt-4 text-[11px] font-bold text-foreground/50 hover:text-foreground transition-colors"
              >
                View more
              </button>
            )}

            <div className="border-t border-foreground/10 my-4" />

            <div className="flex items-center justify-between text-[10px] font-medium text-foreground/60 mb-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                <span>Approved</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
                <span>Review</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm" />
                <span>Tasks</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full border border-foreground/20 bg-white shadow-sm" />
                <span>Pending</span>
              </div>
            </div>

            {selectedChapter && (
              <button
                type="button"
                onClick={() => setIsUploadPagesOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-dashed border-foreground/20 text-[#061A2B] dark:text-blue-400 font-semibold text-[13px] hover:bg-foreground/5 transition-colors"
              >
                <Upload className="h-4 w-4" /> Upload pages
              </button>
            )}
          </section>
        </div>
      </section>

      {selectedChapter && (
        <PageUploadDialog
          open={isUploadPagesOpen}
          onOpenChange={setIsUploadPagesOpen}
          chapter={{ id: selectedChapter.id, chapterNumber: selectedChapter.chapter }}
          series={{
            id,
            title:
              (summary as { series?: { title?: string }; title?: string }).series?.title ??
              (summary as { title?: string }).title ??
              "Series",
            status:
              (summary as { series?: { status?: string }; status?: string }).series?.status ??
              (summary as { status?: string }).status,
          }}
        />
      )}

      <ChapterPagesViewerDialog
        open={isPageViewerOpen}
        onOpenChange={setIsPageViewerOpen}
        chapterTitle={selectedChapter?.title ?? "Chapter"}
        pages={orderedPages}
        isLoading={pagesLoading}
        activeIndex={viewerPageIndex}
        onActiveIndexChange={setViewerPageIndex}
        seriesId={id}
      />

      <AlertDialog
        open={dialogConfig.open}
        onOpenChange={(open) =>
          setDialogConfig({ open, pageId: open ? dialogConfig.pageId : null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this page? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (dialogConfig.pageId && effectiveChapterId)
                  deletePage.mutate({ chapterId: effectiveChapterId, pageId: dialogConfig.pageId });
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCreateChapterOpen} onOpenChange={setIsCreateChapterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Chapter</DialogTitle>
            <DialogDescription>
              Creates a draft chapter for this ongoing series. The backend still checks series
              status, publication type, and series membership.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createChapter.mutate(
                { chapterNumber: newChapterNumber, title: newChapterTitle.trim() },
                {
                  onSuccess: (chapter) => {
                    updateSearch({ chapterId: chapter.id, visible: 9 });
                    setIsCreateChapterOpen(false);
                  },
                },
              );
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="chapter-number">Chapter number</Label>
              <Input
                id="chapter-number"
                type="number"
                min={1}
                value={newChapterNumber}
                onChange={(event) => setNewChapterNumber(Number(event.target.value))}
                disabled={createChapter.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="chapter-title">Title</Label>
              <Input
                id="chapter-title"
                value={newChapterTitle}
                onChange={(event) => setNewChapterTitle(event.target.value)}
                disabled={createChapter.isPending}
                placeholder="Chapter title"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setIsCreateChapterOpen(false)}
                className="h-9 rounded-md border border-foreground/12 bg-card px-4 text-[12px] font-bold text-foreground/70 hover:bg-foreground/5"
                disabled={createChapter.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 rounded-md bg-[#061A2B] px-4 text-[12px] font-bold text-white hover:bg-[#0B2A43] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600"
                disabled={
                  createChapter.isPending || !newChapterTitle.trim() || newChapterNumber < 1
                }
              >
                {createChapter.isPending ? "Creating..." : "Create chapter"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type ViewerPage = {
  id: string;
  status: string;
  workingFileAssetId?: string;
  thumbnailFileAssetId?: string;
  sequenceNumber?: number;
  pageNumber?: number;
};

function ChapterPagesViewerDialog({
  open,
  onOpenChange,
  chapterTitle,
  pages,
  isLoading,
  activeIndex,
  onActiveIndexChange,
  seriesId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterTitle: string;
  pages: ViewerPage[];
  isLoading: boolean;
  activeIndex: number;
  onActiveIndexChange: (index: number | ((current: number) => number)) => void;
  seriesId: string;
}) {
  const activePage = pages[activeIndex];
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex < pages.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[94vw] max-w-6xl flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-foreground/10 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <DialogTitle>{chapterTitle} pages</DialogTitle>
              <DialogDescription>
                Read-only viewer for checking every uploaded page in this chapter.
              </DialogDescription>
            </div>
            {activePage && (
              <div className="mr-8 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-foreground/55 sm:mr-0">
                <span>
                  Page {activePage.pageNumber ?? activePage.sequenceNumber ?? activeIndex + 1} /{" "}
                  {pages.length}
                </span>
                <PageStatusPill status={activePage.status} />
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[1fr_170px]">
          <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden bg-foreground/[0.035] p-4">
            {isLoading ? (
              <div className="text-sm text-foreground/50">Loading pages...</div>
            ) : !activePage ? (
              <div className="text-center">
                <div className="text-sm font-semibold text-foreground">No pages uploaded yet.</div>
                <div className="mt-1 text-xs text-foreground/50">
                  Upload pages from the chapter preview panel first.
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={!canGoPrevious}
                  onClick={() => onActiveIndexChange((current) => Math.max(0, current - 1))}
                  className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/15 bg-background/90 text-foreground shadow-sm backdrop-blur hover:bg-background disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <PageViewerImage page={activePage} />
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={!canGoNext}
                  onClick={() =>
                    onActiveIndexChange((current) => Math.min(pages.length - 1, current + 1))
                  }
                  className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/15 bg-background/90 text-foreground shadow-sm backdrop-blur hover:bg-background disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          <aside className="flex min-h-0 flex-col border-t border-foreground/10 bg-card lg:border-l lg:border-t-0">
            <div className="border-b border-foreground/10 px-3 py-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
                Page strip
              </div>
              {activePage?.workingFileAssetId ? (
                <Link
                  to="/app/pages/$id/studio"
                  params={{ id: activePage.id }}
                  search={{ seriesId }}
                  className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-md bg-[#061A2B] px-3 text-[11px] font-extrabold text-white hover:bg-[#0B2A43] dark:bg-blue-600"
                >
                  Open Studio
                </Link>
              ) : (
                <div className="mt-2 rounded-md bg-foreground/5 px-2 py-2 text-[11px] text-foreground/50">
                  Studio opens after a working image is available.
                </div>
              )}
            </div>
            <div className="grid max-h-[220px] grid-cols-4 gap-2 overflow-y-auto p-3 lg:max-h-none lg:flex-1 lg:grid-cols-1">
              {isLoading ? (
                <div className="col-span-full text-xs text-foreground/45">Loading...</div>
              ) : pages.length === 0 ? (
                <div className="col-span-full text-xs text-foreground/45">No thumbnails.</div>
              ) : (
                pages.map((page, index) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => onActiveIndexChange(index)}
                    className={`relative aspect-[3/4] overflow-hidden rounded-md border bg-foreground/5 text-left ${
                      index === activeIndex
                        ? "border-sky-500 ring-2 ring-sky-500/30"
                        : "border-foreground/10"
                    }`}
                  >
                    <PageViewerThumb page={page} />
                    <span className="absolute left-1 top-1 rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-black text-white">
                      {page.pageNumber ?? page.sequenceNumber ?? index + 1}
                    </span>
                    <span
                      className={`absolute right-1 top-1 h-2.5 w-2.5 rounded-full border border-white ${pageStatusDotClass(page.status)}`}
                      title={page.status}
                    />
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PageViewerImage({ page }: { page: ViewerPage }) {
  const fileAssetId = page.workingFileAssetId ?? page.thumbnailFileAssetId;
  const { data: url, isLoading } = useFileObjectUrl(fileAssetId);
  const isProcessing = ["PENDING", "UPLOADING", "PROCESSING"].includes(page.status);
  const isFailed = ["PROCESSING_FAILED", "UPLOAD_FAILED"].includes(page.status);

  if (isLoading) {
    return <div className="h-full min-h-[360px] w-full animate-pulse rounded-md bg-foreground/5" />;
  }

  if (!url) {
    return (
      <div className="flex min-h-[360px] w-full max-w-xl flex-col items-center justify-center rounded-md border border-dashed border-foreground/20 bg-background text-center">
        <div className="text-sm font-bold text-foreground">
          {isProcessing
            ? "Page assets are processing"
            : isFailed
              ? "Page upload failed"
              : "No image available"}
        </div>
        <div className="mt-1 text-xs text-foreground/50">Status: {page.status}</div>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`Page ${page.pageNumber ?? page.sequenceNumber ?? ""}`}
      className="max-h-[68vh] max-w-full rounded-md object-contain shadow-sm"
    />
  );
}

function PageViewerThumb({ page }: { page: ViewerPage }) {
  const { data: url, isLoading } = useFileObjectUrl(page.thumbnailFileAssetId);
  if (isLoading) return <div className="absolute inset-0 animate-pulse bg-foreground/5" />;
  if (!url) {
    return (
      <div className="absolute inset-0 flex items-center justify-center px-1 text-center text-[9px] font-semibold uppercase text-foreground/40">
        No image
      </div>
    );
  }
  return <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />;
}

function PageStatusPill({ status }: { status: string }) {
  return (
    <span
      className={`rounded px-2 py-1 text-[10px] font-black uppercase ${pageStatusPillClass(status)}`}
    >
      {status}
    </span>
  );
}

function pageStatusPillClass(status: string) {
  if (status === "APPROVED") return "bg-emerald-500/10 text-emerald-600";
  if (status === "READY_FOR_EDITOR") return "bg-blue-500/10 text-blue-600";
  if (status === "IN_TASK") return "bg-orange-500/10 text-orange-600";
  if (["PROCESSING_FAILED", "UPLOAD_FAILED"].includes(status)) {
    return "bg-destructive/10 text-destructive";
  }
  if (["PENDING", "UPLOADING", "PROCESSING"].includes(status)) {
    return "bg-sky-500/10 text-sky-600";
  }
  return "bg-foreground/10 text-foreground/60";
}

function pageStatusDotClass(status: string) {
  if (status === "APPROVED") return "bg-emerald-500";
  if (status === "READY_FOR_EDITOR") return "bg-blue-500";
  if (status === "IN_TASK") return "bg-orange-500";
  if (["PROCESSING_FAILED", "UPLOAD_FAILED"].includes(status)) return "bg-destructive";
  if (["PENDING", "UPLOADING", "PROCESSING"].includes(status)) return "bg-sky-400";
  return "bg-white";
}
