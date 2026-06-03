import { useAuth } from "@/shared/hooks/useAuth";
import { ArrowLeft, ExternalLink, Loader2, RefreshCw, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPage, type Page } from "@/features/page/api/page";
import { listRegions, type Region } from "@/features/region/api/region";
import { regionBoxToStyle } from "@/features/region/lib/region-workspace";
import {
  createTaskSubmission,
  listTaskSubmissions,
  type Submission
} from "@/features/submission/api/submission";
import { getTask, type Task } from "@/features/task/api/task";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; task: Task; page: Page; regions: Region[]; submissions: Submission[] }
  | { status: "error"; message: string };

const submittableStatuses: Task["status"][] = ["IN_PROGRESS", "REVISION_REQUESTED"];

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString() : "Not set";
}

function TaskRegionOverlay({ region }: { region: Region }) {
  return (
    <div
      className="absolute rounded-[3px] border-2 border-[#9065d5] bg-[#9065d5]/25 shadow-[0_0_0_2px_white,0_0_0_5px_#9065d5]"
      style={regionBoxToStyle(region)}
    >
      <span className="absolute left-1 top-1 rounded-sm bg-[#9065d5] px-1.5 py-0.5 text-[10px] font-semibold text-white">
        Task region
      </span>
    </div>
  );
}

export function AssistantTaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { getToken } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [fileUrl, setFileUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadTask = useCallback(async () => {
    if (!taskId) return;

    try {
      setState({ status: "loading" });
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      const task = await getTask(token, taskId);
      const [page, regions, submissions] = await Promise.all([
        getPage(token, task.pageId),
        listRegions(token, task.pageId),
        listTaskSubmissions(token, task.id)
      ]);
      setState({ status: "ready", task, page, regions, submissions });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load task detail"
      });
    }
  }, [getToken, taskId]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  async function handleSubmit() {
    if (state.status !== "ready") return;

    try {
      setSubmitting(true);
      setActionError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      const submission = await createTaskSubmission(token, state.task.id, {
        fileUrl: fileUrl.trim(),
        previewUrl: previewUrl.trim() || undefined,
        note: note.trim() || undefined
      });
      setState({
        status: "ready",
        page: state.page,
        regions: state.regions,
        task: { ...state.task, status: "SUBMITTED", submittedAt: submission.createdAt },
        submissions: [submission, ...state.submissions.filter((item) => item.id !== submission.id)]
      });
      setFileUrl("");
      setPreviewUrl("");
      setNote("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to submit task result");
    } finally {
      setSubmitting(false);
    }
  }

  if (state.status === "loading") {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading task detail
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="container max-w-5xl py-8">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {state.message}
        </div>
      </div>
    );
  }

  const { task, page, regions, submissions } = state;
  const imageUrl = page.processedFileUrl ?? page.previewUrl ?? page.originalFileUrl;
  const taskRegion = task.regionId ? regions.find((region) => region.id === task.regionId) ?? null : null;
  const canSubmit = submittableStatuses.includes(task.status);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#fff9fb]">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                to="/app/assistant/tasks"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="size-4" /> Back to tasks
              </Link>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-[#2f243a]">{task.title}</h1>
                <Badge variant="outline">{task.status}</Badge>
              </div>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{task.description}</p>
            </div>
            <Button variant="outline" onClick={() => void loadTask()}>
              <RefreshCw /> Refresh
            </Button>
          </div>

          <div className="rounded-lg border border-[#eadff6] bg-[#f7f3ff] p-3 shadow-sm">
            <div className="relative mx-auto aspect-[3/4] max-h-[calc(100vh-12rem)] overflow-hidden rounded-md bg-white shadow-inner">
              <img
                src={imageUrl}
                alt={`Page ${page.pageNumber}`}
                className="h-full w-full object-contain"
                draggable={false}
              />
              <div className="absolute inset-0">{taskRegion ? <TaskRegionOverlay region={taskRegion} /> : null}</div>
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-4">
          <section className="rounded-lg border border-[#eadff6] bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold tracking-tight">Task context</h2>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">{task.type}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Priority</dt>
                <dd className="font-medium">{task.priority}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Due</dt>
                <dd className="font-medium">{formatDate(task.dueDate)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Page</dt>
                <dd className="font-medium">{page.pageNumber}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Region</dt>
                <dd className="max-w-48 truncate font-medium">{task.regionId ?? "Whole page"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-[#eadff6] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight">Submit result</h2>
              <Badge variant={canSubmit ? "outline" : "secondary"}>{canSubmit ? "Ready" : task.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste the uploaded result URL. File upload handoff will plug into this form later.
            </p>

            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                File URL
                <input
                  value={fileUrl}
                  onChange={(event) => setFileUrl(event.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="storage://tasks/task_1/submissions/v1/result.png"
                  disabled={!canSubmit || submitting}
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                Preview URL
                <input
                  value={previewUrl}
                  onChange={(event) => setPreviewUrl(event.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="https://cdn.example.com/preview.png"
                  disabled={!canSubmit || submitting}
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                Note
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="Cleaned background and exported final PNG"
                  maxLength={2000}
                  disabled={!canSubmit || submitting}
                />
              </label>

              {actionError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                  {actionError}
                </div>
              ) : null}

              <Button onClick={() => void handleSubmit()} disabled={!canSubmit || submitting || !fileUrl.trim()}>
                {submitting ? <Loader2 className="animate-spin" /> : <Send />}
                Submit result
              </Button>
            </div>
          </section>

          <section className="rounded-lg border border-[#eadff6] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight">Submissions</h2>
              <Badge variant="secondary">{submissions.length}</Badge>
            </div>

            {submissions.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No submissions yet.
              </p>
            ) : (
              <div className="grid gap-2">
                {submissions.map((submission) => (
                  <article key={submission.id} className="rounded-md border bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-medium">Version {submission.version}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(submission.createdAt)}</p>
                      </div>
                      <Badge variant="outline">{submission.status}</Badge>
                    </div>
                    {submission.note ? (
                      <p className="mt-2 text-sm text-muted-foreground">{submission.note}</p>
                    ) : null}
                    <a
                      href={submission.previewUrl ?? submission.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary"
                    >
                      Open result <ExternalLink className="size-3" />
                    </a>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
