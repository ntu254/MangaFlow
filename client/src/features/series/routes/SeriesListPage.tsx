import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { SeriesCard } from "../components/SeriesCard";
import { fetchSeriesList, type Series } from "../api/series";
import { Button } from "@/components/ui/button";

export function SeriesListPage() {
  const { getToken } = useAuth();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken({ template: "mangaflow" });
        if (!token) throw new Error("Not authenticated");
        const data = await fetchSeriesList(token);
        setSeriesList(data);
      } catch (err: any) {
        setError(err.message || "Failed to load series");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [getToken]);

  return (
    <div className="container py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Series</h1>
          <p className="text-muted-foreground mt-1">Manage your manga series and manuscripts.</p>
        </div>
        <Link to="/app/mangaka/series/new">
          <Button>Create Series</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-muted rounded-xl aspect-[3/4] w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-destructive font-medium bg-destructive/10 p-4 rounded-md">
          {error}
        </div>
      ) : seriesList.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl bg-card">
          <h3 className="text-lg font-semibold mb-2">No series yet</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first manga series.</p>
          <Link to="/app/mangaka/series/new">
            <Button variant="outline">Create Series</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {seriesList.map((series) => (
            <SeriesCard key={series.id} series={series} />
          ))}
        </div>
      )}
    </div>
  );
}
