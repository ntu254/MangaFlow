import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { SeriesCard } from "../components/SeriesCard";
import { fetchSeriesList, type Series } from "../api/series";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="min-h-screen bg-[#fff9fb] pb-12">
      <section className="bg-gradient-to-r from-[#f8f1ff] via-[#fff3f8] to-[#fff7ec] border-b border-[#eadff6] py-10 px-6 sm:px-12 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Badge variant="outline" className="text-[#9065d5] border-[#eadff6] mb-2 bg-[#f8f1ff]">
              Mangaka Panel
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-[#2f243a] mb-2">
              My Series
            </h1>
            <p className="text-[#5f5270] max-w-xl text-sm sm:text-base">
              Manage your manga series and manuscripts.
            </p>
          </div>
          <Link to="/app/mangaka/series/new">
            <Button className="bg-[#9065d5] text-white hover:bg-[#7f55c7]">
              Create Series
            </Button>
          </Link>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-10">
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
          <div className="text-center py-20 border border-dashed border-[#eadff6] rounded-xl bg-white">
            <h3 className="text-lg font-semibold mb-2 text-[#2f243a]">No series yet</h3>
            <p className="text-muted-foreground mb-4 text-[#5f5270]">Get started by creating your first manga series.</p>
            <Link to="/app/mangaka/series/new">
              <Button variant="outline" className="border-[#eadff6] hover:bg-[#f8f1ff] text-[#5f5270]">
                Create Series
              </Button>
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
    </div>
  );
}
