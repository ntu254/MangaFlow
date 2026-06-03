import { useAuth } from "@clerk/react";
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
      <div className="container max-w-6xl py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading series...
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="container max-w-6xl py-8">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {state.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#fff9fb]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#2f243a]">Assigned Series</h1>
            <p className="mt-1 text-sm text-muted-foreground">{state.series.length} series available for review.</p>
          </div>
          <Button variant="outline" onClick={() => void loadSeries()}>
            <RefreshCw /> Refresh
          </Button>
        </div>

        {state.series.length === 0 ? (
          <section className="rounded-lg border border-dashed bg-white p-8 text-center">
            <BookOpen className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-3 text-base font-semibold">No series assigned</h2>
            <p className="mt-1 text-sm text-muted-foreground">Series will appear here once Mangakas create them.</p>
          </section>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.series.map((series) => (
              <article
                key={series.id}
                className="rounded-xl border border-[#eadff6] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#2f243a]">{series.title}</h3>
                    {series.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{series.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2 text-[10px]">{series.status}</Badge>
                </div>
                {series.genre && series.genre.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {series.genre.map((g) => (
                      <span key={g} className="rounded-full bg-[#f8f1ff] px-2 py-0.5 text-xs text-[#9065d5]">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <Link to={`/app/editor/series/${series.id}`}>
                    <Button size="sm" variant="outline" className="text-xs">View Details</Button>
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
