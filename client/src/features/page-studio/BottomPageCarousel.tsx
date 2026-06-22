import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import type { Page } from "@/entities";
import { PageAssetImage } from "@/shared/ui/PageAssetImage";
import { useStudioStore } from "./useStudioStore";

interface Props {
  pages: Page[];
  currentPageId: string;
  chapterNumber?: string;
}

export function BottomPageCarousel({ pages, currentPageId }: Props) {
  const { isCarouselCollapsed, setCarouselCollapsed } = useStudioStore();

  const currentPage = pages.find((p) => p.id === currentPageId);
  const currentPageNum = currentPage ? currentPage.order : 0;
  const totalPages = pages.length;

  const getStatusStyle = (status: Page["status"]) => {
    switch (status) {
      case "approved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "under-review":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "task-assigned":
      case "in-progress":
      case "in-task":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-foreground/5 text-foreground/40 border-border";
    }
  };

  const getStatusLabel = (status: Page["status"]) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "under-review":
        return "Review";
      case "task-assigned":
      case "in-progress":
      case "in-task":
        return "Assigned";
      default:
        return "Uploaded";
    }
  };

  // ── COLLAPSED SIDEBAR RAIL (w-12) ──────────────────────────────────
  if (isCarouselCollapsed) {
    return (
      <div className="w-12 shrink-0 border-r border-border bg-background flex flex-col items-center py-4 gap-4 select-none">
        <button
          onClick={() => setCarouselCollapsed(false)}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-foreground/5 text-foreground/40 hover:text-foreground/80"
          title="Expand pages panel"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="h-px w-6 bg-border" />

        <div className="flex-1 w-full overflow-y-auto scrollbar-hide flex flex-col gap-3 items-center">
          {pages.map((p) => {
            const isActive = p.id === currentPageId;

            return (
              <Link
                key={p.id}
                to="/app/pages/$id/studio"
                params={{ id: p.id }}
                search={(prev: any) => ({ seriesId: prev?.seriesId })}
                className={`relative flex h-7.5 w-7.5 items-center justify-center rounded-md text-[10px] font-bold border ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground/40 hover:bg-foreground/5"
                }`}
                title={`Page ${p.order}`}
              >
                {p.order}
                <span
                  className={`absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full border border-background ${
                    p.status === "approved"
                      ? "bg-emerald-400"
                      : p.status === "under-review"
                        ? "bg-blue-400"
                        : p.status === "task-assigned"
                          ? "bg-amber-400"
                          : p.status === "in-task"
                            ? "bg-amber-400"
                            : "bg-foreground/20"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // ── EXPANDED SIDEBAR PANEL (w-[92px]) ──────────────────────────────
  return (
    <div className="w-[92px] shrink-0 border-r border-border bg-background flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/35">
          Pages ({totalPages})
        </span>
        <button
          onClick={() => setCarouselCollapsed(true)}
          className="flex h-5 w-5 items-center justify-center rounded hover:bg-foreground/5 text-foreground/30 hover:text-foreground/60"
          title="Collapse panel"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-3 px-2 flex flex-col gap-3">
        {pages.map((p) => {
          const isActive = p.id === currentPageId;
          const pageNumStr = String(p.order).padStart(2, "0");
          const statusStyle = getStatusStyle(p.status);

          return (
            <div key={p.id} className="relative">
              <Link
                to="/app/pages/$id/studio"
                params={{ id: p.id }}
                search={(prev: any) => ({ seriesId: prev?.seriesId })}
                className={`group flex flex-col items-center rounded p-1 bg-background border ${
                  isActive
                    ? "border-primary bg-foreground/5"
                    : "border-border hover:border-border/60 hover:bg-foreground/[0.02]"
                }`}
              >
                <div className="relative w-full aspect-[3/4] rounded overflow-hidden bg-foreground/[0.03]">
                  <span className="absolute top-1 left-1.5 z-10 text-[8px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {pageNumStr}
                  </span>
                  <PageAssetImage
                    thumbnailFileAssetId={p.thumbnailFileAssetId}
                    workingFileAssetId={p.workingFileAssetId}
                    originalFileAssetId={p.originalFileAssetId}
                    alt={`Page ${p.order}`}
                    className="h-full w-full"
                  />
                </div>

                <span
                  className={`mt-1.5 w-full text-center text-[6.5px] font-bold py-0.5 rounded uppercase border tracking-wider truncate ${statusStyle}`}
                >
                  {getStatusLabel(p.status)}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
