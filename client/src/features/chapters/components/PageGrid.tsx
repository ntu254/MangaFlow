import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { PageCard } from "./PageCard";

export interface PageItem {
  id: number;
  status: string;
  tasks: number;
  time: string;
}

interface PageGridProps {
  pages: PageItem[];
  selectedPage: number;
  onSelectPage: (id: number) => void;
}

export function PageGrid({ pages, selectedPage, onSelectPage }: PageGridProps) {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <section className="rounded-xl bg-transparent">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-extrabold text-foreground tracking-tight">Page Grid</h2>
          <div className="text-[12px] font-medium text-foreground/50 mt-1">
            Manage all pages and production progress for this chapter.
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {["All", "Uploaded", "In Progress", "Under Review", "Approved"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-extrabold border transition-colors ${activeFilter === filter
                  ? "bg-[#061A2B] border-[#061A2B] text-white dark:bg-blue-600 dark:border-blue-600"
                  : "bg-card border-foreground/10 text-foreground/70 hover:bg-foreground/5"
                }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <button className="text-[12px] font-extrabold text-sky-600 hover:underline flex items-center gap-1">
          View all pages <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {pages.map((page) => (
          <PageCard
            key={page.id}
            page={page as any}
            variant="detailed"
            isSelected={selectedPage === page.id}
            onClick={onSelectPage}
          />
        ))}
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-6 text-[10px] font-bold text-foreground/50 uppercase tracking-wider">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Approved</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Under Review</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Task Assigned</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#e5e1d8]"></span> Uploaded</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-foreground/20"></span> Not Started</span>
      </div>
    </section>
  );
}
