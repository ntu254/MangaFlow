import { useSidebar } from "@/layouts/SidebarContext";
import { createFileRoute, Link, Outlet, useLocation, notFound, useNavigate } from "@tanstack/react-router";
import { useSeriesSummary, useDeleteDraftSeries, useWithdrawSeriesProposal, useCancelSeries, useHardDeleteSeries } from "@/shared/queries/useSeries";
import { useRole } from "@/shared/lib/role";
import { toast } from "sonner";
import {
  BookOpen,
  Pencil,
  ArrowRight,
  Settings,
  Trash2,
  Undo2,
  Ban,
  Archive
} from "lucide-react";

export const Route = createFileRoute("/app/series/$id")({
  loader: ({ params }) => {
    return { id: params.id };
  },
  component: SeriesDetailLayout,
  notFoundComponent: () => <div className="p-8 text-sm text-foreground/55">Series not found.</div>,
});

const TABS = [
  { name: "Overview", path: "overview" },
  { name: "Manuscript", path: "manuscript" },
  { name: "Chapters", path: "chapters" },
  { name: "Team", path: "team" },
  { name: "Tasks", path: "tasks" },
  { name: "Reviews", path: "reviews" },
  { name: "Publication", path: "publication" },
];

function SeriesDetailLayout() {
  const { id } = Route.useLoaderData();
  const { data: summary, isLoading, isError } = useSeriesSummary(id);
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useRole();
  
  const deleteDraft = useDeleteDraftSeries();
  const withdraw = useWithdrawSeriesProposal();
  const cancel = useCancelSeries();
  const hardDelete = useHardDeleteSeries();

  const handleDeleteDraft = () => {
    if (confirm("Are you sure you want to delete this draft?")) {
      deleteDraft.mutate(id, {
        onSuccess: () => navigate({ to: "/app" })
      });
    }
  };

  const handleWithdraw = () => {
    if (confirm("Are you sure you want to withdraw this proposal?")) {
      withdraw.mutate(id, {
        onSuccess: () => toast.success("Proposal withdrawn successfully")
      });
    }
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to request cancellation for this series?")) {
      cancel.mutate(id, {
        onSuccess: () => toast.success("Series cancellation requested")
      });
    }
  };

  const handleHardDelete = () => {
    if (confirm("DANGER: Are you sure you want to hard delete this series? This cannot be undone.")) {
      hardDelete.mutate(id, {
        onSuccess: () => navigate({ to: "/app" })
      });
    }
  };

  if (isLoading) return <div className="p-8 text-sm text-foreground/55 animate-pulse">Loading series data...</div>;
  if (isError || !summary) return <div className="p-8 text-sm text-foreground/55">Series not found or error loading data.</div>;

  const { series, chapters, currentChapter } = summary;

  // Safe defaults for properties that might not exist yet
  series.cover = series.cover || "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2070&auto=format&fit=crop";
  series.jp = series.jp || "";

  const displayChapters = chapters && chapters.length > 0 ? chapters : [];
  const displayCurrentChapter = currentChapter || (displayChapters.length > 0 ? displayChapters.find((c: any) => c.status === "in-production" || c.status === "draft" || c.active) || displayChapters[0] : null);
  const currentChapterNumber = displayCurrentChapter ? (displayCurrentChapter.chapter || displayCurrentChapter.chapterNumber) : null;
  const nextChapterNumber = currentChapterNumber ? parseInt(currentChapterNumber) + 1 : 1;

  // Derive active tab from URL
  const currentPath = location.pathname;

  return (
    <div className="w-full px-4 md:px-8 lg:px-10 pb-12 transition-all duration-300">
      <div className="w-full mt-4">
        {/* Content Container */}
        <div className="flex flex-col xl:flex-row justify-between gap-8 w-full">
          {/* Left Section */}
          <div className="flex gap-6 min-w-0 flex-1">
            {/* Cover */}
            <img
              src={series.cover}
              alt={series.title}
              className="w-[120px] h-[176px] rounded-lg shadow-xl shrink-0 object-cover border border-white/10"
            />

            {/* Details */}
            <div className="flex flex-col justify-between py-1 min-w-0">
              <div>
                <h1 className="text-[28px] font-bold flex items-center gap-3 tracking-tight text-[#061A2B] dark:text-foreground truncate">
                  {series.title}
                  <button className="bg-indigo-600 rounded-full p-1.5 hover:bg-indigo-500 transition-colors shrink-0">
                    <Pencil className="w-3.5 h-3.5 text-white" />
                  </button>
                </h1>
                <p className="text-[14px] text-foreground/70 mt-2 line-clamp-1">
                  {series.description || "The world ended once. He remembers."}
                </p>

                <div className="flex gap-2.5 mt-4 flex-wrap">
                  <span className="px-3 py-1 bg-foreground/5 border border-foreground/10 rounded-md text-[11px] font-medium text-foreground/70">Action</span>
                  <span className="px-3 py-1 bg-foreground/5 border border-foreground/10 rounded-md text-[11px] font-medium text-foreground/70">Fantasy</span>
                  <span className="px-3 py-1 bg-foreground/5 border border-foreground/10 rounded-md text-[11px] font-medium text-foreground/70">Dark Fantasy</span>
                  <span className="px-3 py-1 bg-foreground/5 border border-foreground/10 rounded-md text-[11px] font-medium text-foreground/70">Supernatural</span>
                </div>
              </div>

              {/* Bottom Stats Row */}
              <div className="flex flex-wrap items-center gap-x-10 gap-y-5 mt-8 w-full xl:pr-8">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase text-foreground/50 font-bold tracking-wider">Stage</span>
                  <span className="px-2 py-0.5 bg-foreground/10 text-foreground rounded text-[11px] font-bold border border-foreground/20 w-max">
                    {series.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase text-foreground/50 font-bold tracking-wider">Publication Type</span>
                  <span className="text-[13px] font-semibold text-[#061A2B] dark:text-foreground">{series.publicationType || "Web Manga"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase text-foreground/50 font-bold tracking-wider">Chapters</span>
                  <span className="text-[13px] font-semibold text-[#061A2B] dark:text-foreground">{displayChapters?.length || 12}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase text-foreground/50 font-bold tracking-wider">Pages</span>
                  <span className="text-[13px] font-semibold text-[#061A2B] dark:text-foreground">234 / 300</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase text-foreground/50 font-bold tracking-wider">Created</span>
                  <span className="text-[13px] font-semibold text-[#061A2B] dark:text-foreground">Jan 12, 2024</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase text-foreground/50 font-bold tracking-wider">Next Milestone</span>
                  <span className="text-[13px] font-semibold text-[#061A2B] dark:text-foreground">Chapter {nextChapterNumber} Submission</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section (Actions) */}
          <div className="flex flex-col gap-2 shrink-0 justify-center min-w-[220px]">
            {displayCurrentChapter && (
              <Link
                to={(`/app/series/${id}/chapters`) as any}
                className="w-full h-10 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-md flex items-center justify-between px-4 text-[13px] font-semibold transition-colors shadow-sm"
              >
                Continue to Next Action <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <button className="w-full h-10 bg-foreground/5 hover:bg-foreground/10 border border-foreground/15 text-foreground rounded-md flex items-center gap-3 px-4 text-[13px] font-semibold transition-colors">
              <BookOpen className="w-4 h-4 text-foreground/50" /> Open Page Workspace
            </button>

            {role === "MANGAKA" && series.status === "DRAFT" && (
              <button onClick={handleDeleteDraft} className="w-full h-10 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-md flex items-center gap-3 px-4 text-[13px] font-semibold transition-colors">
                <Trash2 className="w-4 h-4" /> Delete Draft
              </button>
            )}
            
            {role === "MANGAKA" && ["EDITOR_REVIEW", "REVISION_REQUESTED", "BOARD_REVIEW"].includes(series.status) && (
              <button onClick={handleWithdraw} className="w-full h-10 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 rounded-md flex items-center gap-3 px-4 text-[13px] font-semibold transition-colors">
                <Undo2 className="w-4 h-4" /> Withdraw Proposal
              </button>
            )}

            {(role === "MANGAKA" || role === "ADMIN" || role === "BOARD_MEMBER") && ["APPROVED", "ONGOING", "AT_RISK"].includes(series.status) && (
              <button onClick={handleCancel} className="w-full h-10 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-500 rounded-md flex items-center gap-3 px-4 text-[13px] font-semibold transition-colors">
                <Ban className="w-4 h-4" /> {role === "MANGAKA" ? "Request Cancellation" : "Cancel Series"}
              </button>
            )}

            {role === "ADMIN" && (
              <button onClick={handleHardDelete} className="w-full h-10 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-600 rounded-md flex items-center gap-3 px-4 text-[13px] font-semibold transition-colors mt-2">
                <Trash2 className="w-4 h-4" /> Hard Delete (Admin)
              </button>
            )}
            
            <button className="w-full h-10 bg-foreground/5 hover:bg-foreground/10 border border-foreground/15 text-foreground rounded-md flex items-center gap-3 px-4 text-[13px] font-semibold transition-colors mt-2">
              <Settings className="w-4 h-4 text-foreground/50" /> Series Settings
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-between w-full overflow-x-auto border-b border-foreground/10 scrollbar-hide pt-6 mt-2">
        {TABS.map((tab) => {
          const isActive = currentPath.includes(`/app/series/${id}/${tab.path}`);
          return (
            <Link
              key={tab.name}
              to={(`/app/series/${id}/${tab.path}`) as any}
              className={`relative flex-1 flex justify-center py-2.5 text-[13px] whitespace-nowrap transition-colors ${isActive
                ? "text-[#061A2B] dark:text-foreground font-bold"
                : "text-foreground/60 font-medium hover:text-foreground"
                }`}
            >
              {tab.name}
              {isActive && (
                <span className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-10 h-[3px] bg-[#061A2B] dark:bg-blue-400 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Render sub-routes here */}
      <div className="pt-2">
        <Outlet />
      </div>
    </div>
  );
}
