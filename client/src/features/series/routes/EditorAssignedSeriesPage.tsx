import { useAuth } from "@/shared/hooks/useAuth";
import { BookOpen, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchSeriesList, type Series } from "@/features/series/api/series";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; series: Series[] }
  | { status: "error"; message: string };

export function EditorAssignedSeriesPage() {
  const { getToken } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const loadSeries = useCallback(async () => {
    try {
      setState({ status: "loading" });
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      const series = await fetchSeriesList(token);
      setState({ status: "ready", series });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load series"
      });
    }
  }, [getToken]);

  useEffect(() => {
    void loadSeries();
  }, [loadSeries]);

  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-400">
          <Loader2 className="size-8 animate-spin text-purple-500" />
          <span>Loading series...</span>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
        <div className="max-w-6xl w-full rounded-lg border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-400">
          {state.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Top Hero Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border-b border-purple-900/30 py-10 px-6 sm:px-12 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <Badge variant="outline" className="text-purple-400 border-purple-500/30 mb-2 bg-purple-950/10">
              Editor Panel
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Assigned Series
            </h1>
            <p className="text-slate-400 max-w-xl text-sm sm:text-base">
              {state.series.length} series available for review.
            </p>
          </div>
          <Button 
            onClick={() => void loadSeries()} 
            variant="outline" 
            className="border-purple-500/30 hover:bg-purple-950/50 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12">
        {state.series.length === 0 ? (
          <section className="rounded-lg border border-dashed border-slate-800 bg-slate-900/20 p-8 text-center text-slate-400">
            <BookOpen className="mx-auto size-8 text-slate-500" />
            <h2 className="mt-3 text-base font-semibold text-slate-200">No series assigned</h2>
            <p className="mt-1 text-sm text-slate-500">Series will appear here once Mangakas create them.</p>
          </section>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.series.map((series) => (
              <article
                key={series.id}
                className="rounded-xl bg-slate-900/40 border border-slate-800/80 p-5 shadow-sm hover:border-purple-500/30 hover:bg-slate-900/60 transition-all text-slate-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{series.title}</h3>
                    {series.description && (
                      <p className="mt-1 text-sm text-slate-400 line-clamp-2">{series.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2 text-[10px] text-purple-400 border-purple-500/30 bg-purple-950/10">{series.status}</Badge>
                </div>
                {series.genre && series.genre.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {series.genre.map((g) => (
                      <span key={g} className="rounded-full bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <Link to={`/app/editor/series/${series.id}`}>
                    <Button size="sm" variant="outline" className="text-xs border-purple-500/30 hover:bg-purple-950/50 hover:text-white">View Details</Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
