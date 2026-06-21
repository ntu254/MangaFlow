import { Link } from "@tanstack/react-router";
import { Upload, Plus } from "lucide-react";

interface ChapterDetailHeaderProps {
  chapterId: string;
}

export function ChapterDetailHeader({ chapterId }: ChapterDetailHeaderProps) {
  // Hardcoded mockup data to match the screenshot for "Vol. 3 Ch. 20"
  const isGhostFixers = chapterId === "ch_g2" || chapterId === "20";
  const chapterNumber = isGhostFixers ? "Vol. 3 Ch. 20" : `Chapter ${chapterId}`;
  const chapterTitle = isGhostFixers ? "Dependent" : "Draft";
  const seriesTitle = isGhostFixers ? "Ghost Fixers" : "One Piece";
  const seriesJp = isGhostFixers ? "ゴーストフィクサーズ" : "ワンピース";
  const status = isGhostFixers ? "in-review" : "in-production";

  return (
    <div className="border-b border-foreground/10 pb-4 mt-2 mb-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-5">
        <img
          src="https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2070&auto=format&fit=crop"
          alt={seriesTitle}
          className="w-16 h-24 object-cover rounded-md shadow-sm border border-foreground/10"
        />
        <div className="min-w-0 py-0.5">
          <h1 className="truncate text-[22px] font-bold tracking-tight text-[#061A2B] dark:text-foreground">
            {chapterNumber} — {chapterTitle}
          </h1>
          <div className="mt-0.5 text-[12px] font-jp text-foreground/55">{seriesJp}</div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-foreground/70">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                status === "in-review"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {status}
            </span>
            <span>·</span>
            <span>{isGhostFixers ? "8" : "20"} pages</span>
          </div>
        </div>
      </div>
    </div>
  );
}
