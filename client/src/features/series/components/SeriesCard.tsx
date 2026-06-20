import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { MoreHorizontal } from "lucide-react";

export interface SeriesCardProps {
  series: any; // Using any for now based on the original code
  variant?: "grid" | "list";
  onActionClick?: (e: React.MouseEvent, s: any) => void;
}

const getTaskColor = (count: number = 0) => {
  if (count === 0) return "text-foreground/50";
  if (count <= 3) return "text-[#061A2B] dark:text-blue-400 font-medium";
  if (count <= 9) return "text-amber-500 font-medium";
  return "text-destructive font-bold";
};

const getActionColor = (action?: string) => {
  if (!action) return "text-foreground";
  const a = action.toLowerCase();
  if (a.includes("asap"))
    return "text-amber-600 dark:text-amber-400 font-bold hover:text-amber-700";
  if (a.includes("finalize"))
    return "text-purple-600 dark:text-purple-400 font-bold hover:opacity-80";
  if (a.includes("archives")) return "text-foreground/60 font-medium hover:text-foreground/80";
  if (a.includes("wait for board")) return "text-purple-600/60 dark:text-purple-400/60";
  if (a.includes("wait for feedback")) return "text-sky-600/60 dark:text-sky-400/60";
  if (a.includes("wait")) return "text-foreground/60";
  return "text-[#061A2B] dark:text-blue-400 font-bold hover:opacity-80";
};

export function SeriesCard({ series: s, variant = "grid", onActionClick }: SeriesCardProps) {
  const isAtRisk = s.status === "at-risk";
  const isWait = s.nextAction?.toLowerCase().includes("wait");

  if (variant === "list") {
    return (
      <Link
        to="/app/series/$id"
        params={{ id: s.id || s._id }}
        className={`group flex h-[160px] overflow-hidden rounded-md border transition-all hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(5,24,38,0.08)] ${
          isAtRisk
            ? "border-red-200 bg-card hover:border-red-300"
            : "border-foreground/10 bg-card hover:border-foreground/20"
        }`}
      >
        <div className="h-full w-[110px] flex-none bg-foreground/5">
          {s.cover && (
            <img
              src={s.cover}
              alt={s.title}
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            />
          )}
        </div>
        <div className="flex flex-1 flex-col p-4 relative">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-foreground">{s.title}</div>
              <div className="truncate font-jp text-[11px] text-foreground/55">{s.jp || ""}</div>
            </div>
            <StatusBadge status={s.status} variant="solid" />
          </div>

          <div className="mt-4 flex flex-1 flex-col justify-end gap-2 text-[11px] text-foreground/70">
            <div className="flex items-center justify-between">
              <span className="capitalize">{s.publicationType || "Weekly"}</span>
              <span className="font-medium text-foreground">
                {s.currentChapter ? `Ch. ${s.currentChapter}` : ""}
              </span>
            </div>
            <div className="text-[10px]">
              Pages {s.pages?.uploaded || 0}/{s.pages?.total || 0} &middot; Tasks{" "}
              <span className={getTaskColor(s.pendingTasks)}>
                {s.pendingTasks || 0}{" "}
                {s.status === "board-review" || s.status === "editor-review"
                  ? "waiting"
                  : "pending"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded bg-foreground/5 px-2 py-1.5 mt-1">
              <span className="text-[#8A8F98]">{isWait ? "Status" : "Action"}</span>
              <button
                onClick={(e) => {
                  if (isWait) e.preventDefault();
                  else if (onActionClick) onActionClick(e, s);
                }}
                className={`flex items-center gap-1 transition-opacity ${getActionColor(s.nextAction)}`}
              >
                {s.nextAction || "Continue"} {!isWait && "→"}
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid variant
  const progress = Math.floor(Math.random() * 60) + 20; // Mock progress percentage
  return (
    <Link
      to="/app/series/$id"
      params={{ id: s.id || s._id }}
      className={`group relative flex flex-col justify-end overflow-hidden rounded-xl aspect-[3/4] transition-all hover:-translate-y-1 hover:shadow-xl shadow-sm border ${
        isAtRisk ? "border-red-500/50" : "border-foreground/10"
      }`}
    >
      {/* Background Image */}
      {s.cover && (
        <img
          src={s.cover}
          alt={s.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#061A2B] via-[#061A2B]/60 to-transparent opacity-90 transition-opacity group-hover:opacity-100"></div>

      {/* Top Actions & Badge */}
      <div className="absolute top-3 left-3 z-10">
        <StatusBadge status={s.status} variant="solid" />
      </div>
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={(e) => e.preventDefault()}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-black/20 text-white backdrop-blur-md transition-colors hover:bg-black/40"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Content (Overlaid) */}
      <div className="relative z-10 flex flex-col p-5">
        <div className="min-w-0 mb-3">
          <div className="truncate text-[16px] font-bold text-white drop-shadow-sm">{s.title}</div>
          <div className="truncate font-jp text-[12px] text-white/70 font-medium mt-0.5">
            {s.jp || ""}
          </div>
        </div>

        <div className="flex flex-col gap-1 text-[11px] text-white/80 font-medium mb-4">
          <div className="flex items-center gap-2">
            <span className="capitalize">{s.publicationType || "Weekly"}</span>
            <span className="opacity-50">•</span>
            <span>Ch. {s.currentChapter || 0}</span>
            <span className="opacity-50">•</span>
            <span>1h ago</span>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between text-[10px] font-bold text-white/60 mb-1.5 uppercase tracking-wider">
            <span>Progress</span>
            <span className="text-white/90">{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
            <div
              className={`h-full rounded-full ${isAtRisk ? "bg-red-400" : s.status === "completed" ? "bg-purple-400" : "bg-white"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
