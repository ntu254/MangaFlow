import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { fetchSeriesList, type Series } from "@/features/series/api/series";
import { listManuscripts, type Manuscript } from "@/features/manuscript/api/manuscript";
import { listChapters, type Chapter } from "@/features/chapter/api/chapter";
import { SeriesCard } from "@/features/series/components/SeriesCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Layers, 
  AlertCircle, 
  Calendar, 
  ArrowUpRight, 
  BookOpen, 
  Loader2, 
  RefreshCw, 
  CheckCircle,
  FileText,
  Clock
} from "lucide-react";

export function EditorDashboardPage() {
  const { getToken } = useAuth();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [manuscripts, setManuscripts] = useState<(Manuscript & { seriesTitle: string })[]>([]);
  const [chapters, setChapters] = useState<(Chapter & { seriesTitle: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      // 1. Fetch assigned Series
      const sList = await fetchSeriesList(token);
      setSeriesList(sList);

      // 2. Fetch Manuscripts and Chapters for each Series in parallel
      const manuscriptPromises = sList.map(async (s) => {
        try {
          const ms = await listManuscripts(token, s.id);
          return ms.map(m => ({ ...m, seriesTitle: s.title }));
        } catch {
          return [];
        }
      });

      const chapterPromises = sList.map(async (s) => {
        try {
          const chs = await listChapters(token, s.id);
          return chs.map(c => ({ ...c, seriesTitle: s.title }));
        } catch {
          return [];
        }
      });

      const msResults = await Promise.all(manuscriptPromises);
      const chResults = await Promise.all(chapterPromises);

      // Flatten results
      const allManuscripts = msResults.flat();
      const allChapters = chResults.flat();

      setManuscripts(allManuscripts);
      setChapters(allChapters);
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

  // Filter pending items
  const pendingManuscripts = manuscripts.filter(
    (m) => m.status === "SUBMITTED" || m.status === "EDITOR_REVIEW"
  );

  const pendingChapters = chapters.filter(
    (c) => c.status === "READY_FOR_EDITOR" || c.status === "EDITOR_REVIEW"
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-400">
          <Loader2 className="size-8 animate-spin text-purple-500" />
          <span>Loading Editor Dashboard...</span>
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
            <Badge variant="outline" className="text-purple-400 border-purple-500/30 mb-2">
              Editor Panel
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Production Control
            </h1>
            <p className="text-slate-400 max-w-xl text-sm sm:text-base">
              Review submissions, track deadlines, resolve comments, and approve chapters/pages for publication.
            </p>
          </div>
          <Button 
            onClick={loadData} 
            variant="outline" 
            className="border-purple-500/30 hover:bg-purple-950/50 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Reload Workspace
          </Button>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-10">
        {error && (
          <div className="bg-red-950/50 border border-red-500/30 p-4 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Actions Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Pending Manuscripts */}
            <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-950/60 rounded-lg text-purple-400 border border-purple-500/20">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Manuscripts Awaiting Review</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Initial story and layout submissions</p>
                  </div>
                </div>
                <Badge className="bg-purple-950 text-purple-300 border border-purple-500/30">
                  {pendingManuscripts.length} Pending
                </Badge>
              </div>

              {pendingManuscripts.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-850 rounded-xl bg-slate-950/30">
                  <CheckCircle className="mx-auto size-8 text-slate-500 mb-2" />
                  <p className="text-slate-400 text-sm font-medium">All manuscripts reviewed!</p>
                  <p className="text-xs text-slate-500 mt-1">No new submissions waiting.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingManuscripts.map((m) => (
                    <div 
                      key={m.id} 
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-slate-800 bg-slate-950/40 rounded-xl hover:border-purple-500/30 hover:bg-slate-950/60 transition-all gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-200">
                            {m.title || `Manuscript v${m.currentVersion}`}
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 border-purple-500/20 text-purple-400">
                            {m.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Series: <strong className="text-slate-300">{m.seriesTitle}</strong>
                        </p>
                      </div>
                      <Link to={`/app/editor/series/${m.seriesId}/manuscripts/${m.id}/review`}>
                        <Button size="sm" className="bg-purple-650 hover:bg-purple-750 text-white font-medium gap-1 text-xs">
                          Start Review <ArrowUpRight className="size-3.5" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Pending Chapters */}
            <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-950/60 rounded-lg text-blue-400 border border-blue-500/20">
                    <Layers className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Chapters Awaiting Approval</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Finished manuscript pages and layouts</p>
                  </div>
                </div>
                <Badge className="bg-blue-950 text-blue-300 border border-blue-500/30">
                  {pendingChapters.length} Pending
                </Badge>
              </div>

              {pendingChapters.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-850 rounded-xl bg-slate-950/30">
                  <CheckCircle className="mx-auto size-8 text-slate-500 mb-2" />
                  <p className="text-slate-400 text-sm font-medium">All chapters reviewed!</p>
                  <p className="text-xs text-slate-500 mt-1">No chapters waiting for editor action.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingChapters.map((c) => (
                    <div 
                      key={c.id} 
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-slate-800 bg-slate-950/40 rounded-xl hover:border-blue-500/30 hover:bg-slate-950/60 transition-all gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-200">
                            Ch. {c.chapterNumber}: {c.title}
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 border-blue-500/20 text-blue-400">
                            {c.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1.5">
                          <span>Series: <strong className="text-slate-300">{c.seriesTitle}</strong></span>
                          {c.deadline && (
                            <span className="flex items-center gap-1 text-amber-450 font-medium">
                              <Clock className="size-3" /> Due {new Date(c.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link to={`/app/editor/chapters/${c.id}/pages`}>
                        <Button size="sm" variant="secondary" className="border border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-200 font-medium text-xs">
                          Open Pages
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>

          {/* Assigned Series Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-950/60 rounded-lg text-emerald-400 border border-emerald-500/20">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Assigned Series</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Series under your editorial scope</p>
                </div>
              </div>

              {seriesList.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  You are not assigned to any series yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {seriesList.map((series) => (
                    <SeriesCard key={series.id} series={series} />
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
