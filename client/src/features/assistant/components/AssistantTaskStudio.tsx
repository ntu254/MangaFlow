import { useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Region, Task } from "@/entities";
import type { Submission } from "@/shared/api/submissions";
import { extractErrorMessage } from "@/shared/api/_client";
import { useFileObjectUrl } from "@/shared/queries/useFileObjectUrl";
import { usePageStudio } from "@/shared/queries/usePageStudio";
import { useSubmitTaskSubmission, useTaskSubmissions } from "@/shared/queries/useSubmissions";
import { useTaskDetail, useUpdateTaskStatus } from "@/shared/queries/useTasks";
import { writeStorageString } from "@/shared/lib/storage";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { deadlineClass, deadlineLabel, deadlineTone } from "@/features/tasks/lib/deadline";
import { normalizeStatus } from "../lib/taskLifecycle";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Image as ImageIcon,
  Info,
  MessageSquare,
  Paperclip,
  Save,
  Send,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "info" | "feedback" | "history";

export function AssistantTaskStudio({ taskId }: { taskId: string }) {
  const navigate = useNavigate();
  const { data: task, isLoading, error } = useTaskDetail(taskId);

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center text-[13px] text-foreground/55">
        Loading task studio...
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-6">
        <div className="max-w-md rounded-lg border border-foreground/10 bg-card p-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="text-[15px] font-semibold text-foreground">Task not available</div>
          <p className="mt-1.5 text-[13px] text-foreground/60">
            {error ? extractErrorMessage(error) : "This task is not assigned to your account."}
          </p>
          <Link
            to="/app/assistant/tasks"
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to my tasks
          </Link>
        </div>
      </div>
    );
  }

  return <StudioBody task={task} onBack={() => navigate({ to: "/app/assistant/tasks" })} />;
}

function StudioBody({ task, onBack }: { task: Task; onBack: () => void }) {
  const studioQuery = usePageStudio(task.pageId ?? "");
  const submissionsQuery = useTaskSubmissions(task.id);
  const submissions = submissionsQuery.data ?? [];
  const workingFileAssetId = getFileAssetId(studioQuery.data?.workingFileAsset);
  const originalFileAssetId = getFileAssetId(studioQuery.data?.originalFileAsset);
  const { data: workingImageUrl } = useFileObjectUrl(workingFileAssetId);
  const { data: originalImageUrl } = useFileObjectUrl(originalFileAssetId);
  const submitMutation = useSubmitTaskSubmission(task.pageId);
  const startMutation = useUpdateTaskStatus();
  const tone = deadlineTone(task.deadline);
  const normalized = normalizeStatus(task.status);

  const [tab, setTab] = useState<Tab>(normalized === "revision-requested" ? "feedback" : "info");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const latestVersion = submissions.reduce((latest, item) => Math.max(latest, item.version), 0);
  const nextVersion = Math.max(latestVersion, task.currentVersion ?? 0) + 1;
  const canSubmit =
    normalized === "todo" || normalized === "in-progress" || normalized === "revision-requested";
  const canStart = normalized === "todo";
  const page = studioQuery.data?.page;
  const pageLabel = page ? `Page ${page.pageNumber ?? page.order ?? task.pageId}` : task.pageRange;
  const assignedRegions = getAssignedRegions(studioQuery.data?.regions ?? [], task);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  function handleSubmit() {
    if (!file && !note.trim()) {
      setNotice({ tone: "error", message: "Add a result file or a note before submitting." });
      return;
    }
    setNotice(null);
    submitMutation.mutate(
      { taskId: task.id, resultText: note, file: file ?? undefined },
      {
        onSuccess: (submission) => {
          setFile(null);
          setNote("");
          setNotice({
            tone: "success",
            message: `Submitted v${submission.version} for Mangaka review.`,
          });
        },
        onError: (mutationError) => {
          setNotice({ tone: "error", message: extractErrorMessage(mutationError) });
        },
      },
    );
  }

  function handleStartTask() {
    if (startMutation.isPending) return;
    startMutation.mutate(
      { taskId: task.id, status: "IN_PROGRESS" },
      {
        onSuccess: () => {
          setNotice({ tone: "success", message: "Task started. You can now work on it." });
          toast.success("Task started.");
        },
        onError: (mutationError) => {
          const message = extractErrorMessage(mutationError);
          setNotice({ tone: "error", message });
          toast.error(message);
        },
      },
    );
  }

  function handleSaveLocalDraft() {
    if (writeStorageString(`assistant.task-draft.${task.id}`, note)) {
      setNotice({ tone: "success", message: "Draft note saved locally for this device." });
      return;
    }
    setNotice({ tone: "error", message: "Could not save the local draft note." });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-foreground/10 bg-card px-5 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <button
              onClick={onBack}
              className="mb-1 inline-flex items-center gap-1 text-[11px] text-foreground/55 hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> My tasks
            </button>
            <div className="text-[11px] uppercase tracking-wider text-foreground/55">
              Series {task.seriesId ?? "unknown"} / Chapter {task.chapterId} / {pageLabel}
              {task.regionId && <> / Region {task.regionId}</>}
            </div>
            <h1 className="mt-0.5 text-[18px] font-semibold text-foreground">
              {task.title ?? `${task.type} pass`}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="inline-flex items-center rounded border border-foreground/10 bg-muted px-2 py-0.5 font-medium uppercase tracking-wider text-foreground/70">
                {task.type}
              </span>
              <StatusBadge status={normalized} />
              <span className="rounded border border-foreground/10 bg-background px-2 py-0.5 text-foreground/65">
                v{task.currentVersion ?? 0} to v{nextVersion}
              </span>
              <span className={deadlineClass(tone)}>{deadlineLabel(task.deadline, tone)}</span>
              {task.assignedById && (
                <span className="text-foreground/55">Assigned by {task.assignedById}</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {canStart && (
              <button
                type="button"
                onClick={handleStartTask}
                disabled={startMutation.isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {startMutation.isPending ? "Starting..." : "Start Task"}
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveLocalDraft}
              disabled={submitMutation.isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-foreground/15 bg-background px-3 text-[12px] font-medium text-foreground hover:bg-muted"
            >
              <Save className="h-3.5 w-3.5" /> Save local draft
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitMutation.isPending || !canSubmit || (!file && !note.trim())}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {submitMutation.isPending ? "Uploading and submitting..." : `Submit v${nextVersion}`}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <section className="relative flex flex-1 flex-col bg-[#141414] text-white">
          <div className="absolute left-3 top-3 z-10 rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur">
            Assigned scope:{" "}
            <span className="font-medium text-white">
              {task.regionId ? `Region ${task.regionId}` : task.pageId ? "Full page" : "Chapter"}
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center p-8">
            <AssignedTaskPreview
              task={task}
              isLoading={studioQuery.isLoading}
              error={studioQuery.error}
              workingImageUrl={workingImageUrl}
              originalImageUrl={originalImageUrl}
              regions={assignedRegions}
              pageLabel={pageLabel}
            />
          </div>
          <div className="border-t border-white/10 bg-black/40 px-4 py-2 text-[11px] text-white/55">
            Read-only assigned scope / submit result below / only assigned task data is visible.
          </div>
        </section>

        <aside className="flex w-full shrink-0 flex-col border-l border-foreground/10 bg-card lg:w-[360px]">
          <nav className="flex border-b border-foreground/10">
            {(
              [
                { key: "info", label: "Task info", icon: Info },
                { key: "feedback", label: "Feedback", icon: MessageSquare },
                { key: "history", label: "History", icon: Paperclip },
              ] as { key: Tab; label: string; icon: typeof Info }[]
            ).map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex-1 px-3 py-2.5 text-[12px] font-medium transition ${
                    active
                      ? "border-b-2 border-foreground bg-background text-foreground"
                      : "text-foreground/60 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <t.icon className="h-3.5 w-3.5" /> {t.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="flex-1 overflow-y-auto p-4 text-[12px]">
            {tab === "info" && <InfoPanel task={task} />}
            {tab === "feedback" && <FeedbackPanel submissions={submissions} />}
            {tab === "history" && <HistoryPanel submissions={submissions} />}
          </div>
        </aside>
      </div>

      <section className="border-t border-foreground/10 bg-card">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-between px-5 py-2 text-[12px] font-medium text-foreground/70 hover:bg-muted"
        >
          <span className="inline-flex items-center gap-2">
            <Upload className="h-3.5 w-3.5" />
            Submission / v{nextVersion}
          </span>
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4 rotate-90" />
          )}
        </button>
        {!collapsed && (
          <div className="grid gap-3 border-t border-foreground/10 px-5 py-4 lg:grid-cols-[1fr_280px]">
            <div className="space-y-3">
              <div>
                <div className="mb-1 text-[11px] uppercase tracking-wider text-foreground/55">
                  Result file
                </div>
                <div className="rounded-md border border-dashed border-foreground/15 bg-background p-3">
                  {!file ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[12px] text-foreground/55">
                        Select one production result file to upload.
                      </span>
                      <label
                        htmlFor={`task-submission-file-${task.id}`}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-foreground/15 bg-background px-2 text-[11px] hover:bg-muted"
                      >
                        <Paperclip className="h-3 w-3" /> Choose file
                      </label>
                      <input
                        id={`task-submission-file-${task.id}`}
                        type="file"
                        onChange={handleFileChange}
                        disabled={submitMutation.isPending}
                        className="sr-only"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded border border-foreground/10 bg-muted px-2 py-1.5 text-[12px]">
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <Paperclip className="h-3 w-3 shrink-0 text-foreground/55" />
                        <span className="truncate">{file.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        disabled={submitMutation.isPending}
                        className="text-[11px] text-foreground/55 hover:text-destructive disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-1 text-[11px] uppercase tracking-wider text-foreground/55">
                  Note to reviewer
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Optional message to Mangaka..."
                  className="w-full rounded-md border border-foreground/15 bg-background px-2.5 py-2 text-[12px] text-foreground placeholder:text-foreground/40 focus:border-foreground/30 focus:outline-none"
                />
              </div>
            </div>
            <div className="rounded-md border border-foreground/10 bg-background p-3 text-[11px] text-foreground/65">
              <div className="font-medium text-foreground">Heads up</div>
              <ul className="mt-2 space-y-1 leading-relaxed">
                <li>Each submit creates a new version, never overwrites.</li>
                <li>Approved tasks unlock earnings after Editor approval.</li>
                <li>Use Feedback tab to address revision notes.</li>
              </ul>
            </div>
          </div>
        )}
      </section>

      {notice && (
        <div
          className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md border px-4 py-2 text-[12px] font-medium shadow-lg ${
            notice.tone === "error"
              ? "border-destructive/25 bg-destructive/10 text-destructive"
              : "border-emerald-500/25 bg-card text-foreground"
          }`}
        >
          {notice.message}
        </div>
      )}
    </div>
  );
}

function InfoPanel({ task }: { task: Task }) {
  return (
    <dl className="space-y-3">
      <Field label="Task type" value={task.type} />
      <Field label="Task id" value={task.id} />
      <Field label="Series" value={task.seriesId ?? "Unknown"} />
      <Field label="Chapter" value={task.chapterId} />
      <Field label="Page" value={task.pageId ?? "Full chapter"} />
      <Field label="Region" value={task.regionId ?? "Full page / assigned area"} />
      <Field
        label="Instruction"
        value={
          task.instruction ??
          task.description ??
          "No specific instructions. Match house style and reference pages."
        }
      />
      <Field label="Due" value={task.deadline} />
      <Field label="Priority" value={task.priority ?? "medium"} />
      <Field label="Current version" value={`v${task.currentVersion ?? 0}`} />
      {task.createdAt && <Field label="Assigned at" value={formatDateTime(task.createdAt)} />}
      {task.requiredFiles && task.requiredFiles.length > 0 && (
        <Field label="Required files" value={task.requiredFiles.join(", ")} />
      )}
    </dl>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-foreground/55">{label}</dt>
      <dd className="mt-0.5 break-words text-[12px] text-foreground">{value}</dd>
    </div>
  );
}

function FeedbackPanel({ submissions }: { submissions: Submission[] }) {
  const feedback = submissions.filter((submission) => submission.reviewerNote);

  if (feedback.length === 0) {
    return (
      <div className="rounded-md border border-foreground/10 bg-background p-4 text-center text-[12px] text-foreground/55">
        No revision feedback yet. You're all clear.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {feedback.map((submission) => (
        <div
          key={submission.id}
          className="rounded-md border border-foreground/10 bg-background p-3"
        >
          <div className="flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground/70">
                R
              </span>
              Reviewer
              <span className="ml-1 inline-flex items-center rounded border border-foreground/15 bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-foreground/70">
                {submission.status}
              </span>
            </span>
            <span className="text-foreground/50">
              v{submission.version} / {formatDateTime(submission.updatedAt)}
            </span>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-foreground/80">
            {submission.reviewerNote}
          </p>
        </div>
      ))}
    </div>
  );
}

function HistoryPanel({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-md border border-foreground/10 bg-background p-4 text-center text-[12px] text-foreground/55">
        No submissions yet. Submit your first version below.
      </div>
    );
  }
  return (
    <ol className="space-y-2">
      {submissions.map((submission) => (
        <li
          key={submission.id}
          className="rounded-md border border-foreground/10 bg-background p-3"
        >
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-foreground">Version v{submission.version}</span>
            <StatusBadge status={submission.status.toLowerCase().replace(/_/g, "-") as any} />
          </div>
          <div className="mt-1 text-[11px] text-foreground/55">
            {formatDateTime(submission.createdAt)}
          </div>
          {submission.resultText && (
            <p className="mt-1.5 text-[12px] text-foreground/75">{submission.resultText}</p>
          )}
          {submission.fileAssetId && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded border border-foreground/10 bg-muted px-1.5 py-0.5 text-[10px] text-foreground/70">
                <Download className="h-3 w-3" />
                {submission.fileAssetId.originalName ?? "Attached file"}
              </span>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

function AssignedTaskPreview({
  task,
  isLoading,
  error,
  workingImageUrl,
  originalImageUrl,
  regions,
  pageLabel,
}: {
  task: Task;
  isLoading: boolean;
  error: unknown;
  workingImageUrl?: string;
  originalImageUrl?: string;
  regions: Region[];
  pageLabel: string;
}) {
  if (!task.pageId) {
    return (
      <PreviewEmpty
        title="Chapter-level task"
        hint="This task is not linked to a single page. Follow the task instruction and submit your result below."
      />
    );
  }

  if (isLoading) {
    return (
      <PreviewEmpty
        title="Loading assigned page..."
        hint="Fetching working image and assigned region."
      />
    );
  }

  if (error) {
    return <PreviewEmpty title="Unable to load page context" hint={extractErrorMessage(error)} />;
  }

  const imageUrl = workingImageUrl ?? originalImageUrl;
  if (!imageUrl) {
    return (
      <PreviewEmpty
        title="Missing working image"
        hint="The page exists, but no downloadable working image is available yet."
      />
    );
  }

  return (
    <div className="w-full max-w-[520px]">
      <div className="mb-2 flex items-center justify-between text-[11px] text-white/55">
        <span>{pageLabel}</span>
        <span>
          {regions.length > 0 ? `${regions.length} assigned region(s)` : "Full page scope"}
        </span>
      </div>
      <div className="relative overflow-hidden rounded-md border border-white/15 bg-black shadow-2xl">
        <img src={imageUrl} alt={pageLabel} className="block w-full select-none" />
        {regions.map((region) => (
          <div
            key={region.id}
            className="absolute border-2 border-orange-400 bg-orange-400/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]"
            style={{
              left: `${region.coords.x * 100}%`,
              top: `${region.coords.y * 100}%`,
              width: `${region.coords.w * 100}%`,
              height: `${region.coords.h * 100}%`,
            }}
            title={`Assigned region ${region.id}`}
          />
        ))}
      </div>
    </div>
  );
}

function PreviewEmpty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="aspect-[3/4] w-full max-w-[460px] rounded-md border border-white/15 bg-gradient-to-br from-white/[0.05] to-white/[0.02]">
      <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center text-white/40">
        <ImageIcon className="h-10 w-10" />
        <div className="text-[12px] font-medium text-white/55">{title}</div>
        <div className="text-[11px] leading-relaxed text-white/30">{hint}</div>
      </div>
    </div>
  );
}

function getAssignedRegions(regions: Region[], task: Task) {
  if (task.regionId) {
    return regions.filter((region) => region.id === task.regionId);
  }
  if (task.pageId) {
    return regions.filter((region) => region.pageId === task.pageId && region.taskId === task.id);
  }
  return [];
}

function getFileAssetId(asset: unknown): string | undefined {
  if (!asset) return undefined;
  if (typeof asset === "string") return asset;
  if (typeof asset === "object") {
    const record = asset as { _id?: string; id?: string };
    return record._id ?? record.id;
  }
  return undefined;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
