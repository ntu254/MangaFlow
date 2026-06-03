import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { fetchSeriesList, type Series } from "@/features/series/api/series";
import { listChapters, type Chapter } from "@/features/chapter/api/chapter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  Plus,
  ArrowUpRight,
  BookOpen,
  Loader2,
  RefreshCw,
  CheckCircle,
  Clock,
} from "lucide-react";

export function MangakaDashboardPage() {
  const { getToken } = useAuth();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [chapters, setChapters] = useState<(Chapter & { seriesTitle: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const sList = await fetchSeriesList(token);
      setSeriesList(sList);

      const chapterPromises = sList.map(async (s) => {
        try {
          const chs = await listChapters(token, s.id);
          return chs.map((c) => ({ ...c, seriesTitle: s.title }));
        } catch {
          return [];
        }
      });

      const chResults = await Promise.all(chapterPromises);
      setChapters(chResults.flat());
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeChapters = chapters.filter(
    (c) => c.status === "DRAFT" || c.status === "IN_PROGRESS"
  );

  const pendingReview = chapters.filter(
    (c) => c.status === "READY_FOR_EDITOR" || c.status === "EDITOR_REVIEW"
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fff9fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-[#5f5270]">
          <Loader2 className="size-8 animate-spin text-[#9065d5]" />
          <span>Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff9fb] pb-12">
      <section className="bg-gradient-to-r from-[#f8f1ff] via-[#fff3f8] to-[#fff7ec] border-b border-[#eadff6] py-10 px-6 sm:px-12 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Badge variant="outline" className="text-[#9065d5] border-[#eadff6] mb-2">
              Mangaka Panel
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-[#2f243a] mb-2">
              My Series
            </h1>
            <p className="text-[#5f5270] max-w-xl text-sm sm:text-base">
              Create series, manage chapters, and track your manga production.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={loadData} variant="outline" className="border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff]">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Link to="/app/mangaka/series/new">
              <Button className="bg-[#9065d5] text-white hover:bg-[#7f55c7] gap-1">
                <Plus className="size-4" /> New Series
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-10">
        {error && (
          <div className="bg-[#ffe7de] border border-[#ff7196]/30 p-4 rounded-xl text-[#e15f2f] text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-white border border-[#eadff6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(144,101,213,0.04)]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#ece5ff] rounded-lg text-[#9065d5]">
                    <Layers className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#2f243a]">Active Chapters</h2>
                    <p className="text-xs text-[#5f5270] mt-0.5">Chapters you are working on</p>
                  </div>
                </div>
                <Badge className="bg-[#ece5ff] text-[#9065d5] border-none">
                  {activeChapters.length} Active
                </Badge>
              </div>

              {activeChapters.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[#eadff6] rounded-xl bg-[#f8f1ff]/30">
                  <CheckCircle className="mx-auto size-8 text-[#b8a9c7] mb-2" />
                  <p className="text-[#5f5270] text-sm font-medium">No active chapters</p>
                  <p className="text-xs text-[#8a7a99] mt-1">Create a series and add chapters to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeChapters.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-[#eadff6] bg-white rounded-xl hover:border-[#d4c4ee] hover:shadow-sm transition-all gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#2f243a]">
                            Ch. {c.chapterNumber}: {c.title}
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 border-[#eadff6] text-[#5f5270]">
                            {c.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#5f5270] mt-1">
                          Series: <strong className="text-[#2f243a]">{c.seriesTitle}</strong>
                        </p>
                      </div>
                      <Link to={`/app/mangaka/chapters/${c.id}/pages`}>
                        <Button size="sm" className="bg-[#9065d5] text-white hover:bg-[#7f55c7] font-medium gap-1 text-xs">
                          Open Pages <ArrowUpRight className="size-3.5" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white border border-[#eadff6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(144,101,213,0.04)]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#ffe6f2] rounded-lg text-[#e560bc]">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#2f243a]">Pending Review</h2>
                    <p className="text-xs text-[#5f5270] mt-0.5">Chapters submitted for editor review</p>
                  </div>
                </div>
                <Badge className="bg-[#ffe6f2] text-[#e560bc] border-none">
                  {pendingReview.length} Pending
                </Badge>
              </div>

              {pendingReview.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[#eadff6] rounded-xl bg-[#f8f1ff]/30">
                  <CheckCircle className="mx-auto size-8 text-[#b8a9c7] mb-2" />
                  <p className="text-[#5f5270] text-sm font-medium">Nothing pending review</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReview.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-[#eadff6] bg-white rounded-xl hover:border-[#e560bc]/30 hover:shadow-sm transition-all gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#2f243a]">
                            Ch. {c.chapterNumber}: {c.title}
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 border-[#e560bc]/20 text-[#e560bc]">
                            {c.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#5f5270] mt-1">
                          Series: <strong className="text-[#2f243a]">{c.seriesTitle}</strong>
                        </p>
                      </div>
                      <Link to={`/app/mangaka/chapters/${c.id}/pages`}>
                        <Button size="sm" variant="outline" className="border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff] font-medium text-xs">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white border border-[#eadff6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(144,101,213,0.04)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#f4ffd2] rounded-lg text-[#7a8f00]">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2f243a]">My Series</h2>
                  <p className="text-xs text-[#5f5270] mt-0.5">{seriesList.length} total</p>
                </div>
              </div>

              {seriesList.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#5f5270] text-sm">No series yet.</p>
                  <Link to="/app/mangaka/series/new">
                    <Button size="sm" className="mt-3 bg-[#9065d5] text-white hover:bg-[#7f55c7] gap-1">
                      <Plus className="size-3.5" /> Create First Series
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {seriesList.map((series) => (
                    <Link
                      key={series.id}
                      to={`/app/mangaka/series/${series.id}`}
                      className="block p-3 border border-[#eadff6] rounded-xl hover:border-[#9065d5]/30 hover:shadow-sm transition-all"
                    >
                      <div className="font-semibold text-sm text-[#2f243a]">{series.title}</div>
                      {series.genre && (
                        <p className="text-xs text-[#5f5270] mt-1">{series.genre}</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
