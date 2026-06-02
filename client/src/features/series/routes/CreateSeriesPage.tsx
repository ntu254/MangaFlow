import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { SeriesForm } from "../components/SeriesForm";
import { createSeries } from "../api/series";
import { Button } from "@/components/ui/button";

export function CreateSeriesPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Parameters<typeof createSeries>[1]) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
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
    <div className="container py-8 max-w-3xl">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          className="mb-4 -ml-4" 
          onClick={() => navigate("/app/mangaka/series")}
        >
          &larr; Back to Series
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Series</h1>
        <p className="text-muted-foreground mt-1">Start a new manga project.</p>
      </div>

      {error && (
        <div className="text-destructive font-medium bg-destructive/10 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <SeriesForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
