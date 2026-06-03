import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { fetchSeriesById, type Series } from "../api/series";
import { listManuscripts, type Manuscript } from "@/features/manuscript/api/manuscript";
import { listChapters, type Chapter } from "@/features/chapter/api/chapter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadManuscriptDialog } from "@/features/manuscript/components/UploadManuscriptDialog";
import { CreateChapterDialog } from "@/features/chapter/components/CreateChapterDialog";
import { fetchSeriesRankings, type Ranking } from "@/features/ranking/api/ranking";
import { AlertTriangle, ShieldAlert } from "lucide-react";

export function SeriesDetailPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const { getToken } = useAuth();
  const [series, setSeries] = useState<Series | null>(null);
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRankings = useCallback(async () => {
    if (!seriesId) return;
    try {
      const token = await getToken({ template: "mangaflow" });
      if (!token) return;
      const data = await fetchSeriesRankings(token, seriesId);
      setRankings(data);
    } catch (err: any) {
      console.error("Failed to load rankings", err);
    }
  }, [seriesId, getToken]);

  const loadManuscripts = useCallback(async () => {
    if (!seriesId) return;
    try {
      const token = await getToken({ template: "mangaflow" });
      if (!token) return;
      const data = await listManuscripts(token, seriesId);
      setManuscripts(data);
    } catch (err: any) {
      console.error(err);
    }
  }, [seriesId, getToken]);

  const loadChapters = useCallback(async () => {
    if (!seriesId) return;
    try {
      const token = await getToken({ template: "mangaflow" });
      if (!token) return;
      const data = await listChapters(token, seriesId);
      setChapters(data);
    } catch (err: any) {
      console.error(err);
    }
  }, [seriesId, getToken]);

  const load = useCallback(async () => {
    if (!seriesId) return;
    try {
      setIsLoading(true);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      const data = await fetchSeriesById(token, seriesId);
      setSeries(data);
      await loadManuscripts();
      await loadChapters();
      await loadRankings();
    } catch (err: any) {
      setError(err.message || "Failed to load series details");
    } finally {
      setIsLoading(false);
    }
  }, [seriesId, getToken, loadManuscripts, loadChapters, loadRankings]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="container py-8 max-w-5xl animate-pulse">
        <div className="h-10 w-1/3 bg-muted rounded mb-4" />
        <div className="h-6 w-1/4 bg-muted rounded mb-8" />
        <div className="aspect-[3/4] w-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="container py-8 max-w-5xl">
        <div className="text-destructive font-medium bg-destructive/10 p-4 rounded-md mb-4">
          {error || "Series not found"}
        </div>
        <Link to="/app/mangaka/series">
          <Button variant="outline">&larr; Back to Series</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-6">
        <Link to="/app/mangaka/series" className="text-sm text-muted-foreground hover:text-primary transition-colors">
          &larr; Back to Series
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 shrink-0">
          <div className="aspect-[3/4] w-full bg-muted rounded-xl border overflow-hidden">
             {series.coverUrl ? (
                <img src={series.coverUrl} alt={series.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-medium">No Cover</div>
              )}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">{series.title}</h1>
              <div className="flex gap-2 items-center mb-6">
                <Badge variant={series.status === "DRAFT" ? "secondary" : "default"}>
                  {series.status}
                </Badge>
                {series.publicationType && (
                  <Badge variant="outline">{series.publicationType}</Badge>
                )}
              </div>
            </div>
            <Button variant="outline">Edit Series</Button>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
            <p>{series.description || "No description provided."}</p>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold mb-3">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {series.genre.length > 0 ? series.genre.map((g) => (
                <Badge key={g} variant="secondary">{g}</Badge>
              )) : (
                <span className="text-muted-foreground text-sm">No genres selected</span>
              )}
            </div>
          </div>

          <Tabs defaultValue="manuscripts" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="manuscripts">Manuscripts</TabsTrigger>
              <TabsTrigger value="chapters">Chapters</TabsTrigger>
              <TabsTrigger value="rankings">Rankings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="border rounded-xl p-6 bg-card">
              <h3 className="text-lg font-semibold mb-2">Overview</h3>
              <p className="text-muted-foreground text-sm">Series statistics and details will appear here.</p>
            </TabsContent>
            <TabsContent value="manuscripts" className="border rounded-xl p-6 bg-card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Manuscripts</h3>
                {seriesId && <UploadManuscriptDialog seriesId={seriesId} onUploadSuccess={loadManuscripts} />}
              </div>
              
              {manuscripts.length > 0 ? (
                <div className="space-y-4">
                  {manuscripts.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                      <div>
                        <h4 className="font-medium">{m.title || `Manuscript v${m.currentVersion}`}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(m.createdAt).toLocaleDateString()} &middot; {m.fileUrls.length} file(s)
                        </p>
                      </div>
                      <Badge variant="outline">{m.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No manuscripts uploaded yet.</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="chapters" className="border rounded-xl p-6 bg-card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Chapters</h3>
                {seriesId && <CreateChapterDialog seriesId={seriesId} onSuccess={loadChapters} />}
              </div>

              {chapters.length > 0 ? (
                <div className="space-y-4">
                  {chapters.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                      <div>
                        <h4 className="font-medium">Ch. {c.chapterNumber}: {c.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(c.createdAt).toLocaleDateString()}
                          {c.deadline && ` | Deadline: ${new Date(c.deadline).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{c.status}</Badge>
                        <Link to={`/app/mangaka/chapters/${c.id}/pages`}>
                          <Button size="sm" variant="secondary">Manage Pages</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No chapters created yet.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="rankings" className="border rounded-xl p-6 bg-card space-y-6">
              <h3 className="text-lg font-semibold">Ranking History</h3>
              
              {/* Warnings check */}
              {rankings.some(r => r.status === "WARNING" || r.status === "AT_RISK") && (
                <div className="space-y-3">
                  {rankings.some(r => r.status === "AT_RISK") && (
                    <div className="flex gap-2.5 items-start p-4 border border-red-500/35 bg-red-950/20 text-red-400 rounded-xl text-sm font-medium">
                      <ShieldAlert className="size-5 shrink-0 text-red-400" />
                      <div>
                        <strong className="font-semibold block mb-0.5">CRITICAL: Series AT-RISK</strong>
                        This series has been marked as AT_RISK. An Editorial Board review is pending to decide on final publication status.
                      </div>
                    </div>
                  )}
                  {rankings.some(r => r.status === "WARNING" && !rankings.some(x => x.id === r.id && x.status === "AT_RISK")) && (
                    <div className="flex gap-2.5 items-start p-4 border border-amber-500/35 bg-amber-950/20 text-amber-300 rounded-xl text-sm font-medium">
                      <AlertTriangle className="size-5 shrink-0 text-amber-400" />
                      <div>
                        <strong className="font-semibold block mb-0.5">Warning Alert Triggered</strong>
                        This series is currently flagged under WARNING. Please monitor popularity rankings and reader scores to prevent dropping into critical risk levels.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {rankings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b text-muted-foreground font-medium">
                        <th className="py-2.5 px-3">Period</th>
                        <th className="py-2.5 px-3">Rank</th>
                        <th className="py-2.5 px-3 text-right">Final Score</th>
                        <th className="py-2.5 px-3 text-right">Votes</th>
                        <th className="py-2.5 px-3 text-right">Reader Score</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rankings.map(r => (
                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-3 font-semibold">{r.period}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-sm">#{r.rank}</span>
                            {r.previousRank && (
                              <span className="text-[10px] text-muted-foreground ml-2">
                                (was #{r.previousRank})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                            {r.finalScore.toFixed(1)}
                          </td>
                          <td className="py-3 px-3 text-right text-muted-foreground">
                            {r.voteCount.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right text-muted-foreground">
                            {r.readerScore.toFixed(1)}/10
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge
                              className={
                                r.status === "NORMAL"
                                  ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                                  : r.status === "WARNING"
                                    ? "bg-amber-950/40 text-amber-400 border border-amber-500/20"
                                    : "bg-rose-950/40 text-rose-400 border border-rose-500/20 font-bold"
                              }
                            >
                              {r.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No ranking history recorded yet.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>
  );
}
