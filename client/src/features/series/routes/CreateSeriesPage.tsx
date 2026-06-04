import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { SeriesForm } from "../components/SeriesForm";
import { createSeries } from "../api/series";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";

export function CreateSeriesPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Parameters<typeof createSeries>[1]) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      const series = await createSeries(token, data);
      navigate(`/app/mangaka/series/${series.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create series");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff9fb] pb-12">
      <section className="bg-gradient-to-r from-[#f8f1ff] via-[#fff3f8] to-[#fff7ec] border-b border-[#eadff6] py-10 px-6 sm:px-12 mb-8">
        <div className="max-w-4xl mx-auto flex flex-col items-start gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-[#5f5270] hover:bg-[#f8f1ff] border border-[#eadff6]/50 bg-white/60 -ml-1" 
            onClick={() => navigate("/app/mangaka/series")}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to Series
          </Button>
          <div>
            <Badge variant="outline" className="text-[#9065d5] border-[#eadff6] mb-2 bg-[#f8f1ff]">
              Series Creator
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-[#2f243a] mb-2">
              Create New Series
            </h1>
            <p className="text-[#5f5270] max-w-xl text-sm sm:text-base">
              Start a new manga project and upload its properties.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 sm:px-12">
        {error && (
          <div className="text-destructive font-medium bg-destructive/10 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        <SeriesForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
