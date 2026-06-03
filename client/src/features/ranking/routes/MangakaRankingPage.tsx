import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/react";
import { fetchSeriesList, type Series } from "@/features/series/api/series";
import { fetchSeriesRankings, type Ranking } from "../api/ranking";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Loader2,
  Trophy,
  BarChart3
} from "lucide-react";

type SeriesRankings = {
  series: Series;
  rankings: Ranking[];
};

export function MangakaRankingPage() {
  const { getToken } = useAuth();
  const [data, setData] = useState<SeriesRankings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      const seriesList = await fetchSeriesList(token);
      const results = await Promise.all(
        seriesList.map(async (series) => {
          try {
            const rankings = await fetchSeriesRankings(token, series.id);
            return { series, rankings };
          } catch {
            return { series, rankings: [] };
          }
        })
      );
      setData(results);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load ranking data");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderTrend = (rank: number, prevRank?: number) => {
    if (prevRank === undefined) {
      return (
        <Badge variant="outline" className="text-[10px] text-indigo-400 border-indigo-500/20 bg-indigo-950/20">
          NEW
        </Badge>
      );
    }

    const diff = prevRank - rank;
    if (diff > 0) {
      return (
        <div className="flex items-center gap-1 text-emerald-400 font-semibold text-xs">
          <TrendingUp className="size-3.5" />
          <span>+{diff}</span>
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center gap-1 text-rose-400 font-semibold text-xs">
          <TrendingDown className="size-3.5" />
          <span>{diff}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-slate-500 text-xs">
          <Minus className="size-3.5" />
          <span>0</span>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-400">
          <Loader2 className="size-8 animate-spin text-indigo-500" />
          <span>Loading Ranking History...</span>
        </div>
      </div>
    );
  }

  const hasAnyRankings = data.some((d) => d.rankings.length > 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/30 py-10 px-6 sm:px-12 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="outline" className="text-indigo-400 border-indigo-500/30">
              Ranking History
            </Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
            My Series Rankings
          </h1>
          <p className="text-slate-400 max-w-xl text-sm sm:text-base">
            Track your series performance across periods. Monitor scores, trends, and warning statuses.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-8">
        {error && (
          <div className="bg-red-950/50 border border-red-500/30 p-4 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {!hasAnyRankings ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
            <BarChart3 className="mx-auto size-12 text-slate-600 mb-3" />
            <p className="text-slate-300 text-sm font-semibold">No Rankings Yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Your series haven't been ranked yet. Rankings are calculated by the Board from imported vote data.
            </p>
          </div>
        ) : (
          data.map(({ series, rankings }) => (
            <section
              key={series.id}
              className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-950/60 rounded-lg text-indigo-400 border border-indigo-500/20">
                  <Trophy className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{series.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {rankings.length} period{rankings.length !== 1 ? "s" : ""} ranked
                  </p>
                </div>
              </div>

              {rankings.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No rankings available for this series.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-medium">
                        <th className="py-3 px-4 w-16">Rank</th>
                        <th className="py-3 px-4 w-20">Trend</th>
                        <th className="py-3 px-4">Period</th>
                        <th className="py-3 px-4 w-28 text-right">Final Score</th>
                        <th className="py-3 px-4 w-28 text-right">Vote Count</th>
                        <th className="py-3 px-4 w-28 text-right">Reader Score</th>
                        <th className="py-3 px-4 w-28 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {rankings.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="py-4 px-4 font-bold text-sm text-slate-200">
                            #{r.rank}
                          </td>
                          <td className="py-4 px-4">
                            {renderTrend(r.rank, r.previousRank)}
                          </td>
                          <td className="py-4 px-4 text-slate-300">
                            {r.period}
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-slate-300">
                            {r.finalScore.toFixed(1)}
                          </td>
                          <td className="py-4 px-4 text-right text-slate-400">
                            {r.voteCount.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-right text-slate-400">
                            {r.readerScore.toFixed(1)}/10
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge
                              className={
                                r.status === "NORMAL"
                                  ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                                  : r.status === "WARNING"
                                    ? "bg-amber-950/40 text-amber-400 border border-amber-500/20"
                                    : "bg-rose-950/40 text-rose-400 border border-rose-500/20 font-bold"
                              }
                            >
                              {r.status === "WARNING" && <AlertTriangle className="inline size-3 mr-1" />}
                              {r.status === "AT_RISK" && <AlertTriangle className="inline size-3 mr-1" />}
                              {r.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
