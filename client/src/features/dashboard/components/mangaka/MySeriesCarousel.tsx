import { useRef } from "react";
import { series as mockSeries, type Series as MockSeriesType } from "@/entities";
import { useSeriesList } from "@/shared/queries/useSeries";
import { Progress } from "@/shared/ui/shadcn/progress";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";

const getTaskColor = (count: number = 0) => {
  if (count === 0) return "text-foreground/50";
  if (count <= 3) return "text-primary font-medium";
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
  return "text-primary font-bold hover:opacity-80";
};

export function MySeriesCarousel({ mangakaId }: { mangakaId: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { data: seriesList, isLoading } = useSeriesList();
  
  const mine = seriesList?.map((s) => {
    // Hash based on ID to pick a consistent mock cover
    let mockIndex = 0;
    if (s.id) {
      const charCodes = s.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      mockIndex = charCodes % mockSeries.length;
    }
    const mock = mockSeries.find(ms => ms.id === s.id || ms.title === s.title) || mockSeries[mockIndex];
    
    return {
      ...s,
      cover: s.cover
        ? (s.cover.startsWith("http") ? s.cover : `/api/public/images/${s.cover}`)
        : (mock?.cover || "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2070&auto=format&fit=crop"),
      jp: mock?.jp || "",
      pages: mock?.pages || { uploaded: 0, total: 0 },
      pendingTasks: mock?.pendingTasks || 0,
      currentChapter: mock?.currentChapter || "Ch. 1",
      nextAction: mock?.nextAction || "Upload manuscript",
    };
  }) || [];

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 360, behavior: "smooth" });
  };
  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -360, behavior: "smooth" });
  };

  const handleActionClick = (e: React.MouseEvent, s: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (s.nextAction?.includes("Review")) navigate({ to: `/app/series/${s.id}/reviews` });
    else if (s.nextAction?.includes("Upload"))
      navigate({ to: `/app/series/${s.id}/chapters/current/pages/upload` });
    else if (s.nextAction?.includes("archives")) navigate({ to: `/app/series/${s.id}/archives` });
    else if (s.nextAction?.includes("Finalize")) navigate({ to: `/app/series/${s.id}/proposal` });
  };

  if (isLoading) {
    return <div className="h-[180px] flex items-center justify-center"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (mine.length === 0) {
    return null;
  }

  return (
    <section className="mb-8 relative">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-foreground">My Series</h2>
        <Link
          to="/app/series"
          className="flex items-center gap-1 text-[12px] font-medium text-foreground/60 hover:text-foreground"
        >
          View all series <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {mine.map((s) => {
          const progressVal =
            s.pages && s.pages.total > 0 ? Math.round((s.pages.uploaded / s.pages.total) * 100) : 0;
          const isWait = s.nextAction?.toLowerCase().includes("wait");
          const isAtRisk = s.status === "at-risk";

          const chapterNumMatch = s.currentChapter?.match(/\d+/);
          const nextChapterText = chapterNumMatch
            ? `Chapter ${parseInt(chapterNumMatch[0]) + 1}`
            : "Next chapter";

          return (
            <Link
              key={s.id}
              to="/app/series/$id"
              params={{ id: s.id }}
              className={`group relative flex w-[350px] flex-none shrink-0 flex-row overflow-hidden rounded-xl border transition-all hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(5,24,38,0.08)] ${
                isAtRisk
                  ? "border-destructive/80 bg-card hover:border-destructive"
                  : "border-foreground/10 bg-card hover:border-foreground/20"
              }`}
            >
              <div className="w-[125px] shrink-0 bg-foreground/5">
                <img
                  src={s.cover}
                  alt={s.title}
                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                />
              </div>

              <div className="flex flex-1 flex-col p-4 relative">
                <div className="min-w-0 mb-3">
                  <div className="truncate text-[14px] font-bold leading-tight text-foreground">
                    {s.title}
                  </div>
                  <div className="truncate font-jp text-[11px] text-foreground/50 mb-2">{s.jp}</div>
                  <StatusBadge status={s.status} />
                </div>

                <div className="mt-auto flex flex-col text-[11px] text-foreground/70">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="capitalize">{s.publicationType}</span>
                    <span className="h-1 w-1 rounded-full bg-foreground/20" />
                    <span className="font-medium text-foreground">{s.currentChapter}</span>
                  </div>
                  <div className="mb-3">
                    Pages {s.pages?.uploaded}/{s.pages?.total} &middot; Tasks{" "}
                    <span className={getTaskColor(s.pendingTasks)}>
                      {s.pendingTasks}{" "}
                      {s.status === "board-review" || s.status === "editor-review"
                        ? "waiting"
                        : "pending"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span>Next: {nextChapterText}</span>
                    <span className="font-medium text-foreground">{progressVal}%</span>
                  </div>
                  <Progress value={progressVal} className="h-1.5 bg-foreground/10 mb-3" />

                  <button
                    onClick={(e) => (isWait ? e.preventDefault() : handleActionClick(e, s))}
                    className={`flex items-center gap-1 transition-opacity text-xs ${getActionColor(s.nextAction)}`}
                  >
                    {s.nextAction} {!isWait && "→"}
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="absolute -left-4 top-10 bottom-4 w-12 bg-gradient-to-r from-background to-transparent flex items-center justify-center pointer-events-none">
        <button
          onClick={scrollLeft}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-foreground/15 bg-background shadow-sm text-foreground/60 hover:text-foreground pointer-events-auto"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      <div className="absolute -right-4 top-10 bottom-4 w-12 bg-gradient-to-l from-background to-transparent flex items-center justify-center pointer-events-none">
        <button
          onClick={scrollRight}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-foreground/15 bg-background shadow-sm text-foreground/60 hover:text-foreground pointer-events-auto"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
