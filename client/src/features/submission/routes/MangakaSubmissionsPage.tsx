import { useAuth } from "@clerk/react";
import { Send, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { listSubmissions, type Submission, type SubmissionStatus } from "@/features/submission/api/submission";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; submissions: Submission[] }
  | { status: "error"; message: string };

const statusClassName: Record<SubmissionStatus, string> = {
  PENDING_MANGAKA_REVIEW: "bg-amber-100 text-amber-800",
  REVISION_REQUESTED: "bg-orange-100 text-orange-700",
  MANGAKA_APPROVED: "bg-emerald-100 text-emerald-700",
  EDITOR_APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700"
};

export function MangakaSubmissionsPage() {
  const { getToken } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "ALL">("ALL");

  const loadSubmissions = useCallback(async () => {
    try {
      setState({ status: "loading" });
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      const submissions = await listSubmissions(token);
      setState({ status: "ready", submissions });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load submissions"
      });
    }
  }, [getToken]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  if (state.status === "loading") {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading submissions...
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

  const filtered = state.submissions.filter((s) => {
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#fff9fb]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#2f243a]">Submissions</h1>
            <p className="mt-1 text-sm text-muted-foreground">Review assistant submissions across all your tasks.</p>
          </div>
          <Button variant="outline" onClick={() => void loadSubmissions()}>
            <RefreshCw /> Refresh
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === "ALL"
                ? "bg-[#9065d5] text-white"
                : "bg-white border border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff]"
            }`}
          >
            All ({state.submissions.length})
          </button>
          {(["PENDING_MANGAKA_REVIEW", "MANGAKA_APPROVED", "EDITOR_APPROVED", "REVISION_REQUESTED", "REJECTED"] as SubmissionStatus[])
            .filter(s => state.submissions.some(sub => sub.status === s))
            .map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-[#9065d5] text-white"
                    : "bg-white border border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff]"
                }`}
              >
                {s.replace(/_/g, " ")} ({state.submissions.filter(sub => sub.status === s).length})
              </button>
            ))}
        </div>

        {filtered.length === 0 ? (
          <section className="rounded-lg border border-dashed bg-white p-8 text-center">
            <Send className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-3 text-base font-semibold">No submissions found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Submissions from assistants will appear here.
            </p>
          </section>
        ) : (
          <div className="grid gap-3">
            {filtered.map((sub) => (
              <article key={sub.id} className="rounded-lg border border-[#eadff6] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#2f243a]">Submission v{sub.version}</span>
                      <span className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${statusClassName[sub.status]}`}>
                        {sub.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    {sub.note && (
                      <p className="mt-2 text-sm text-muted-foreground">{sub.note}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Task: {sub.taskId}</span>
                      <span>Submitted: {new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {sub.fileUrl && (
                      <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1">
                          <ExternalLink className="size-3.5" /> File
                        </Button>
                      </a>
                    )}
                    {sub.previewUrl && (
                      <a href={sub.previewUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1">
                          <ExternalLink className="size-3.5" /> Preview
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
