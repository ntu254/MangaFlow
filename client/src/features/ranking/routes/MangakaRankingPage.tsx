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
        <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-200 bg-indigo-50">
          NEW
        </Badge>
      );
    }

    const diff = prevRank - rank;
    if (diff > 0) {
      return (
        <div className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
          <TrendingUp className="size-3.5" />
          <span>+{diff}</span>
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center gap-1 text-rose-600 font-semibold text-xs">
          <TrendingDown className="size-3.5" />
          <span>{diff}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-slate-400 text-xs">
          <Minus className="size-3.5" />
          <span>0</span>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-[#5f5270]">
          <Loader2 className="size-8 animate-spin text-[#9065d5]" />
          <span>Loading Ranking History...</span>
        </div>
      </div>
    );
  }

  const hasAnyRankings = data.some((d) => d.rankings.length > 0);

  return (
    <div className="pb-12">
      <section className="bg-gradient-to-r from-[#fff9fb] via-[#f8f1ff] to-[#fff7ec] border-b border-[#eadff6] py-10 px-6 sm:px-12 mb-8 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="outline" className="text-[#9065d5] border-[#eadff6] bg-[#f8f1ff]">
              Ranking History
            </Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[#2f243a] mb-2">
            My Series Rankings
          </h1>
          <p className="text-[#5f5270] max-w-xl text-sm sm:text-base">
            Track your series performance across periods. Monitor scores, trends, and warning statuses.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {!hasAnyRankings ? (
          <div className="text-center py-16 border border-dashed border-[#eadff6] rounded-xl bg-white">
            <BarChart3 className="mx-auto size-12 text-[#8a7a99] mb-3" />
            <p className="text-[#2f243a] text-sm font-semibold">No Rankings Yet</p>
            <p className="text-xs text-[#5f5270] mt-1">
              Your series haven't been ranked yet. Rankings are calculated by the Board from imported vote data.
            </p>
          </div>
        ) : (
          data.map(({ series, rankings }) => (
            <section
              key={series.id}
              className="bg-white border border-[#eadff6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(144,101,213,0.02)]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#f8f1ff] rounded-lg text-[#9065d5] border border-[#eadff6]">
                  <Trophy className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2f243a]">{series.title}</h2>
                  <p className="text-xs text-[#5f5270] mt-0.5">
                    {rankings.length} period{rankings.length !== 1 ? "s" : ""} ranked
                  </p>
                </div>
              </div>

              {rankings.length === 0 ? (
                <p className="text-xs text-[#5f5270] py-4">No rankings available for this series.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#eadff6] text-[#5f5270] font-medium">
                        <th className="py-3 px-4 w-16">Rank</th>
                        <th className="py-3 px-4 w-20">Trend</th>
                        <th className="py-3 px-4">Period</th>
                        <th className="py-3 px-4 w-28 text-right">Final Score</th>
                        <th className="py-3 px-4 w-28 text-right">Vote Count</th>
                        <th className="py-3 px-4 w-28 text-right">Reader Score</th>
                        <th className="py-3 px-4 w-28 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eadff6]/50">
                      {rankings.map((r) => (
                        <tr key={r.id} className="hover:bg-[#fcfaff] transition-colors">
                          <td className="py-4 px-4 font-bold text-sm text-[#2f243a]">
                            #{r.rank}
                          </td>
                          <td className="py-4 px-4">
                            {renderTrend(r.rank, r.previousRank)}
                          </td>
                          <td className="py-4 px-4 text-[#2f243a]">
                            {r.period}
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-[#2f243a]">
                            {r.finalScore.toFixed(1)}
                          </td>
                          <td className="py-4 px-4 text-right text-[#5f5270]">
                            {r.voteCount.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-right text-[#5f5270]">
                            {r.readerScore.toFixed(1)}/10
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge
                              className={
                                r.status === "NORMAL"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : r.status === "WARNING"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200 font-bold"
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
