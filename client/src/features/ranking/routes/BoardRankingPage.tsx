import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { fetchSeriesList, type Series } from "@/features/series/api/series";
import { fetchRankings, markRankingWarning, markRankingAtRisk, type Ranking } from "../api/ranking";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Plus,
  Table,
  ShieldAlert
} from "lucide-react";

export function BoardRankingPage() {
  const { getToken } = useAuth();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [seriesMap, setSeriesMap] = useState<Map<string, Series>>(new Map());
  const [period, setPeriod] = useState("2026-W22");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      const [seriesList, rankingList] = await Promise.all([
        fetchSeriesList(token),
        fetchRankings(token, period).catch(() => []) // Fallback to empty if not imported yet
      ]);

      const map = new Map<string, Series>();
      for (const s of seriesList) {
        map.set(s.id, s);
      }
      setSeriesMap(map);
      setRankings(rankingList);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load rankings data");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (rankingId: string, status: "WARNING" | "AT_RISK") => {
    try {
      setIsUpdating(rankingId);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      if (status === "WARNING") {
        await markRankingWarning(token, rankingId);
      } else {
        await markRankingAtRisk(token, rankingId);
      }
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update ranking status");
    } finally {
      setIsUpdating(null);
    }
  };

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
          <span>Loading Series Rankings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/30 py-10 px-6 sm:px-12 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="text-indigo-400 border-indigo-500/30">
                Ranking Workflow
              </Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
              Series Rankings
            </h1>
            <p className="text-slate-400 max-w-xl text-sm sm:text-base">
              Monitor series performances, normalized reader metrics, and update critical warning risk statuses.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/app/board/ranking/import">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2">
                <Plus className="mr-2 size-4" /> Import Period Scores
              </Button>
            </Link>
            <Button
              onClick={loadData}
              variant="outline"
              className="border-indigo-500/30 hover:bg-indigo-950/50 hover:text-white"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-8">
        {error && (
          <div className="bg-red-950/50 border border-red-500/30 p-4 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-slate-800 bg-slate-900/30 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-400">Target Period:</span>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="e.g. 2026-W22"
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <Button size="sm" onClick={loadData} className="bg-slate-800 hover:bg-slate-700 text-white text-xs">
              Load Period
            </Button>
          </div>
        </div>

        {/* Rankings Table */}
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-950/60 rounded-lg text-indigo-400 border border-indigo-500/20">
                <Table className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Leaderboard for {period}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Calculated using formula: 70% Votes + 30% Reader Score</p>
              </div>
            </div>
          </div>

          {rankings.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
              <ShieldAlert className="mx-auto size-12 text-slate-600 mb-3" />
              <p className="text-slate-300 text-sm font-semibold">No Rankings Found</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">No ranking scores have been imported yet for this period.</p>
              <Link to="/app/board/ranking/import">
                <Button size="sm" variant="outline" className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-950/50">
                  Import Scores Now
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-3 px-4 w-16">Rank</th>
                    <th className="py-3 px-4 w-20">Trend</th>
                    <th className="py-3 px-4">Series Title</th>
                    <th className="py-3 px-4 w-28 text-right">Final Score</th>
                    <th className="py-3 px-4 w-28 text-right">Vote Count</th>
                    <th className="py-3 px-4 w-28 text-right">Reader Score</th>
                    <th className="py-3 px-4 w-28 text-center">Status</th>
                    <th className="py-3 px-4 w-48 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {rankings.map((r) => {
                    const series = seriesMap.get(r.seriesId);
                    const title = series ? series.title : `Series (${r.seriesId.slice(-6)})`;

                    return (
                      <tr key={r.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-4 px-4 font-bold text-sm text-slate-200">
                          #{r.rank}
                        </td>
                        <td className="py-4 px-4">
                          {renderTrend(r.rank, r.previousRank)}
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-200">
                          {title}
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
                                  ? "bg-amber-950/40 text-amber-400 border border-amber-500/20 animate-pulse"
                                  : "bg-rose-950/40 text-rose-400 border border-rose-500/20 animate-pulse font-bold"
                            }
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right space-x-1.5">
                          {r.status !== "WARNING" && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleStatusChange(r.id, "WARNING")}
                              disabled={isUpdating !== null}
                              className="border-amber-500/30 text-amber-400 hover:bg-amber-950/40 text-[10px] py-1 px-2"
                            >
                              Warning
                            </Button>
                          )}
                          {r.status !== "AT_RISK" && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleStatusChange(r.id, "AT_RISK")}
                              disabled={isUpdating !== null}
                              className="border-rose-500/30 text-rose-400 hover:bg-rose-950/40 text-[10px] py-1 px-2 font-bold"
                            >
                              At Risk
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
