import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { getManuscript, reviewManuscript, type Manuscript } from "../api/manuscript";
import { fetchSeriesById, type Series } from "@/features/series/api/series";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function EditorReviewPage() {
  const { seriesId, manuscriptId } = useParams<{ seriesId: string; manuscriptId: string }>();
  const { getToken } = useAuth();
  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!seriesId || !manuscriptId) return;
    try {
      setIsLoading(true);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      const [seriesData, manuscriptData] = await Promise.all([
        fetchSeriesById(token, seriesId),
        getManuscript(token, seriesId, manuscriptId)
      ]);
      setSeries(seriesData);
      setManuscript(manuscriptData);
    } catch (err: any) {
      setError(err.message || "Failed to load review page");
    } finally {
      setIsLoading(false);
    }
  }, [seriesId, manuscriptId, getToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(action: "start" | "approve" | "request_revision") {
    if (!seriesId || !manuscriptId) return;
    try {
      setActionLoading(true);
      setActionError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) return;
      const updated = await reviewManuscript(token, seriesId, manuscriptId, action);
      setManuscript(updated);
    } catch (err: any) {
      setActionError(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading review workspace...</div>;
  }

  if (error || !manuscript || !series) {
    return <div className="p-8 text-destructive">{error || "Not found"}</div>;
  }

  return (
    <div className="container py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{series.title}</h1>
          <h2 className="text-xl text-muted-foreground">{manuscript.title || `Manuscript v${manuscript.currentVersion}`}</h2>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm px-3 py-1">{manuscript.status}</Badge>
          
          {manuscript.status === "SUBMITTED" && (
            <Button onClick={() => handleAction("start")} disabled={actionLoading}>
              Start Review
            </Button>
          )}
          {manuscript.status === "EDITOR_REVIEW" && (
            <>
              <Button variant="destructive" onClick={() => handleAction("request_revision")} disabled={actionLoading}>
                Request Revision
              </Button>
              <Button variant="default" onClick={() => handleAction("approve")} disabled={actionLoading}>
                Approve
              </Button>
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div className="mb-6 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {actionError}
        </div>
      )}

      <div className="border rounded-xl bg-card overflow-hidden">
        <div className="p-4 border-b bg-muted/50">
          <h3 className="font-medium">File Viewer (Mock)</h3>
        </div>
        <div className="p-6 space-y-8 bg-black/5">
          {manuscript.fileUrls.map((url, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground mb-2">Page {i + 1}</span>
              <img 
                src={url} 
                alt={`Page ${i + 1}`} 
                className="max-w-full h-auto bg-white border shadow-sm" 
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as any).nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full max-w-2xl h-64 border-2 border-dashed border-muted-foreground/30 rounded-lg items-center justify-center text-muted-foreground bg-background">
                Preview not available for {url}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
