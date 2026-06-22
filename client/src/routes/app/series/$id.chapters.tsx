import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Filter,
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  Upload,
  Lock,
  Clock,
} from "lucide-react";
import { useState, useRef, useMemo, useEffect } from "react";
import { useSeriesSummary } from "@/shared/queries/useSeries";
import { ChapterRow } from "@/features/chapters/components/ChapterRow";
import { PageUploadDialog } from "@/features/chapters/components/PageUploadPanel";
import { useChapterPages } from "@/shared/queries/useChapterPages";
import { useCreateChapter, useDeletePage, useReplacePage } from "@/shared/queries/useChapterPages";
import { Trash2, RefreshCw } from "lucide-react";
import { useFileObjectUrl } from "@/shared/queries/useFileObjectUrl";
import { useRole } from "@/shared/lib/role";
import { chapterPermissions } from "@/features/chapters/lib/chapterPermissions";
import { useTasksBySeries } from "@/shared/queries/useTasks";
import { useAllSubmissions } from "@/shared/queries/useSubmissions";
import { TasksTab } from "@/features/chapters/components/tabs/TasksTab";
import { ReviewsTab } from "@/features/chapters/components/tabs/ReviewsTab";
import { CommentsTab } from "@/features/chapters/components/tabs/CommentsTab";
import { ReadinessTab } from "@/features/chapters/components/tabs/ReadinessTab";

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

export const Route = createFileRoute("/app/series/$id/chapters")({
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
  const { data: summary, isLoading } = useSeriesSummary(id);
  const gridRef = useRef<HTMLDivElement>(null);
  const [pageSearchQuery, setPageSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [visiblePagesCount, setVisiblePagesCount] = useState(9);
  const [isCreateChapterOpen, setIsCreateChapterOpen] = useState(false);
  const [isUploadPagesOpen, setIsUploadPagesOpen] = useState(false);
  const [newChapterNumber, setNewChapterNumber] = useState(1);
  const [newChapterTitle, setNewChapterTitle] = useState("");

  const deletePage = useDeletePage();
  const replacePage = useReplacePage();
  const createChapter = useCreateChapter(id);

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

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const { role } = useRole();
  const perms = useMemo(() => chapterPermissions(role), [role]);

  const { data: allTasks = [] } = useTasksBySeries(id);
  const { data: allSubmissions = [] } = useAllSubmissions();

  const [activePreviewTab, setActivePreviewTab] = useState<string>("Pages");

  const chapterTasks = useMemo(() => {
    return allTasks.filter((t) => t.chapterId === selectedChapterId);
  }, [allTasks, selectedChapterId]);

  const chapterSubmissions = useMemo(() => {
    return allSubmissions.filter((s) => {
      const cId = typeof s.chapterId === "object" ? (s.chapterId as any).id || (s.chapterId as any)._id : s.chapterId;
      return cId === selectedChapterId;
    });
  }, [allSubmissions, selectedChapterId]);

  const nextChapterNumber = useMemo(() => {
    const chapterNumbers = mappedChapters
      .map((chapter: { chapter: string }) => Number.parseInt(chapter.chapter, 10))
      .filter(Number.isFinite);
    return Math.max(0, ...chapterNumbers) + 1;
  }, [mappedChapters]);

  useEffect(() => {
    if (!selectedChapterId && mappedChapters.length > 0) {
      setSelectedChapterId(mappedChapters[0].id);
    }
  }, [mappedChapters, selectedChapterId]);

  useEffect(() => {
    if (!isCreateChapterOpen) return;
    setNewChapterNumber(nextChapterNumber);
    setNewChapterTitle(`Chapter ${nextChapterNumber}`);
  }, [isCreateChapterOpen, nextChapterNumber]);

  const { data: pages = [], isLoading: pagesLoading } = useChapterPages(
    selectedChapterId || undefined,
  );

  const selectedChapter = mappedChapters.find((ch: { id: string }) => ch.id === selectedChapterId);

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
                  isSelected={chapter.id === selectedChapterId}
                  onClick={() => setSelectedChapterId(chapter.id)}
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

      <section className="overflow-hidden rounded-[10px] border border-foreground/10 bg-card shadow-[0_2px_14px_rgba(5,24,38,0.05)] flex flex-col">
        <header className="flex items-start justify-between gap-4 px-4 pb-3 pt-4 border-b border-foreground/7 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[18px] font-extrabold leading-none tracking-tight text-foreground">
                {selectedChapter ? `Chapter ${selectedChapter.chapter}` : "Chapter Preview"}
              </h2>
              {selectedChapter && (
                <span
                  className={`rounded px-2 py-1 text-[9px] font-black uppercase leading-none tracking-wider ${chapterBadgeClass[selectedChapter.status] || "bg-foreground/10"}`}
                >
                  {chapterBadgeLabel[selectedChapter.status] || selectedChapter.status}
                </span>
              )}
            </div>
            {selectedChapter && (
              <p className="text-[11px] text-foreground/55 mt-1 truncate max-w-[200px]">
                {selectedChapter.title}
              </p>
            )}
          </div>
          <button className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground/12 bg-card text-foreground/55 shadow-sm hover:bg-foreground/5 shrink-0">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </header>

        {selectedChapter ? (
          <>
            {/* Tabs Selector */}
            <div className="flex border-b border-foreground/7 px-4 bg-foreground/[0.015] shrink-0 overflow-x-auto scrollbar-none">
              {["Pages", "Tasks", "Reviews", "Comments", "Readiness"].map((tab) => {
                const isActive = activePreviewTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActivePreviewTab(tab)}
                    className={`py-2.5 px-3 text-[12px] font-bold border-b-2 -mb-[1px] whitespace-nowrap transition-colors ${
                      isActive
                        ? "border-[#061A2B] dark:border-blue-400 text-foreground"
                        : "border-transparent text-foreground/50 hover:text-foreground/80"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
              {activePreviewTab === "Pages" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-[12px] font-bold text-foreground/50 tracking-wider uppercase">
                      PAGES ({pages.length})
                    </h2>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center pl-1.5 pr-1 py-0.5 rounded border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 focus-within:bg-foreground/5 focus-within:border-foreground/30 focus-within:w-28 w-20 transition-all duration-300 overflow-hidden">
                        <Search className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search..."
                          className="w-full min-w-0 text-[11px] bg-transparent border-none focus:ring-0 px-1.5 outline-none text-foreground placeholder:text-foreground/30"
                          value={pageSearchQuery}
                          onChange={(e) => setPageSearchQuery(e.target.value)}
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
                            {["All", "Approved", "Under review", "With tasks", "Pending"].map(
                              (filter) => {
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
                                      setSelectedFilter(filter);
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
                              },
                            )}
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
                    ) : pages.length === 0 ? (
                      <div className="col-span-3 text-center text-[11px] py-6 text-foreground/40">
                        No pages uploaded yet.
                      </div>
                    ) : (
                      pages
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
                            const isUnderReview = page.status === "IN_TASK";
                            const isTaskAssigned = page.status === "IN_TASK";
                            const isProcessing = ["PENDING", "UPLOADING", "PROCESSING"].includes(
                              page.status,
                            );
                            const isFailed = ["PROCESSING_FAILED", "UPLOAD_FAILED"].includes(page.status);

                            // Mangaka still needs read/edit visibility after a task is assigned.
                            const canOpenStudio =
                              ["UPLOADED", "IN_TASK", "APPROVED", "LOCKED"].includes(page.status) &&
                              Boolean(page.workingFileAssetId);

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
                                                chapterId: selectedChapterId!,
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

                  {pages.length > visiblePagesCount && (
                    <button
                      onClick={() => {
                        setVisiblePagesCount((prev) => prev + 9);
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

                  {selectedChapter && perms.canUploadPages && (
                    <button
                      type="button"
                      onClick={() => setIsUploadPagesOpen(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-dashed border-foreground/20 text-[#061A2B] dark:text-blue-400 font-semibold text-[13px] hover:bg-foreground/5 transition-colors"
                    >
                      <Upload className="h-4 w-4" /> Upload pages
                    </button>
                  )}
                </div>
              )}

              {activePreviewTab === "Tasks" && (
                <TasksTab
                  tasks={chapterTasks}
                  perms={perms}
                  onCreate={() => setIsUploadPagesOpen(true)}
                />
              )}

              {activePreviewTab === "Reviews" && (
                <ReviewsTab
                  tasks={chapterTasks}
                  subs={chapterSubmissions}
                  perms={perms}
                />
              )}

              {activePreviewTab === "Comments" && (
                <CommentsTab
                  tasks={chapterTasks}
                  perms={perms}
                  seriesId={id}
                  chapterId={selectedChapterId || ""}
                />
              )}

              {activePreviewTab === "Readiness" && (
                <ReadinessTab
                  tasks={chapterTasks}
                  subs={chapterSubmissions}
                  perms={perms}
                  chapterId={selectedChapterId || ""}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center p-8 text-center text-[12px] font-medium text-foreground/45">
            Select a chapter from the list to view details.
          </div>
        )}
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
                if (dialogConfig.pageId && selectedChapterId)
                  deletePage.mutate({ chapterId: selectedChapterId, pageId: dialogConfig.pageId });
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
                    setSelectedChapterId(chapter.id);
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
