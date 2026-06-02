import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { fetchSeriesById, type Series } from "../api/series";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SeriesDetailPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const { getToken } = useAuth();
  const [series, setSeries] = useState<Series | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!seriesId) return;
      try {
        const token = await getToken();
        if (!token) throw new Error("Not authenticated");
        const data = await fetchSeriesById(token, seriesId);
        setSeries(data);
      } catch (err: any) {
        setError(err.message || "Failed to load series details");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [seriesId, getToken]);

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

          {/* Placeholder for future tabs (Manuscripts, Chapters, Members) */}
          <div className="border rounded-xl p-6 bg-card text-center">
            <h3 className="text-lg font-semibold mb-2">Manuscripts & Chapters</h3>
            <p className="text-muted-foreground text-sm">
              Uploading manuscripts and creating chapters will be available here soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
