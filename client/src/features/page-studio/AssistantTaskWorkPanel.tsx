import { type ChangeEvent, useMemo, useState } from "react";
import {
  Clock3,
  Download,
  FileDown,
  Loader2,
  MessageSquare,
  Paperclip,
  Play,
  Send,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import type { Task } from "@/entities";
import { extractErrorMessage } from "@/shared/api/_client";
import type { Submission } from "@/shared/api/submissions";
import { useFileDownloadUrl } from "@/shared/queries/useFileDownloadUrl";
import { useSubmitTaskSubmission, useTaskSubmissions } from "@/shared/queries/useSubmissions";
import { useUpdateTaskStatus } from "@/shared/queries/useTasks";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { normalizeStatus } from "@/features/assistant/lib/taskLifecycle";

type AssistantTaskWorkPanelProps = {
  task: Task;
  pageId: string;
  originalFileAssetId?: string;
  workingFileAssetId?: string;
};

export function AssistantTaskWorkPanel({
  task,
  pageId,
  originalFileAssetId,
  workingFileAssetId,
}: AssistantTaskWorkPanelProps) {
  const submissionsQuery = useTaskSubmissions(task.id);
  const submissions = useMemo(
    () => [...(submissionsQuery.data ?? [])].sort((a, b) => b.version - a.version),
    [submissionsQuery.data],
  );
  const submitMutation = useSubmitTaskSubmission(pageId);
  const startMutation = useUpdateTaskStatus();
  const normalized = normalizeStatus(task.status);
  const latestVersion = submissions.reduce(
    (latest, submission) => Math.max(latest, submission.version),
    task.currentVersion ?? 0,
  );
  const nextVersion = latestVersion + 1;
  const feedback = submissions.filter((submission) => submission.reviewerNote);
  const canStart = normalized === "todo";
  const canSubmit =
    normalized === "todo" || normalized === "in-progress" || normalized === "revision-requested";

  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(
    null,
  );

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  function handleStartTask() {
    if (startMutation.isPending) return;
    startMutation.mutate(
      { taskId: task.id, status: "IN_PROGRESS" },
      {
        onSuccess: () => {
          setNotice({ tone: "success", message: "Task started. You can work on this page now." });
          toast.success("Task started.");
        },
        onError: (error) => {
          const message = extractErrorMessage(error);
          setNotice({ tone: "error", message });
          toast.error(message);
        },
      },
    );
  }

  function handleSubmit() {
    if (!file && !note.trim()) {
      setNotice({ tone: "error", message: "Upload a result file or add a note before submitting." });
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
            message: `Submitted version ${submission.version} for Mangaka review.`,
          });
          toast.success(`Submitted v${submission.version} for review.`);
        },
        onError: (error) => {
          const message = extractErrorMessage(error);
          setNotice({ tone: "error", message });
          toast.error(message);
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
              Page Task Workspace
            </div>
            <div className="mt-1 truncate text-[13px] font-bold text-foreground">
              {task.title ?? `${task.type} task`}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-foreground/60">
              Work mode is read-only on the canvas. Use the assigned region, download resources,
              then upload a result for Mangaka review.
            </p>
          </div>
          <StatusBadge status={normalized} />
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-amber-500/15 pt-3 text-[11px]">
          <Field label="Task type" value={task.type} />
          <Field label="Due" value={task.deadline} />
          <Field label="Page" value={task.pageNumber ? `Page ${task.pageNumber}` : task.pageId ?? "Page scope"} />
          <Field label="Region" value={task.regionId ?? "Full page"} />
        </dl>

        <div className="mt-3 border-t border-amber-500/15 pt-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/35">
            Instruction
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-foreground/75">
            {task.instruction ?? task.description ?? "No specific instruction provided."}
          </p>
        </div>

        {canStart && (
          <button
            type="button"
            onClick={handleStartTask}
            disabled={startMutation.isPending}
            className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {startMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {startMutation.isPending ? "Starting..." : "Start task"}
          </button>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-3.5">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground/35">
          <FileDown className="h-3.5 w-3.5" />
          Download resources
        </div>
        <div className="grid gap-2">
          <ResourceDownload label="Working page" fileAssetId={workingFileAssetId} />
          <ResourceDownload label="Original page" fileAssetId={originalFileAssetId} />
        </div>
        {task.requiredFiles && task.requiredFiles.length > 0 && (
          <div className="mt-2 rounded-md border border-foreground/10 bg-muted px-2 py-1.5 text-[10px] text-foreground/55">
            Required output: {task.requiredFiles.join(", ")}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-3.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground/35">
            <UploadCloud className="h-3.5 w-3.5" />
            Submit work
          </div>
          <span className="rounded border border-foreground/10 bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-foreground/60">
            next v{nextVersion}
          </span>
        </div>

        <div className="space-y-2">
          {!file ? (
            <label
              htmlFor={`assistant-task-submission-${task.id}`}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-foreground/15 bg-background px-3 py-2 text-[11px] text-foreground/60 hover:bg-muted ${
                !canSubmit ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <span>Select result file</span>
              <span className="inline-flex items-center gap-1 rounded border border-foreground/10 px-1.5 py-0.5">
                <Paperclip className="h-3 w-3" />
                Choose
              </span>
              <input
                id={`assistant-task-submission-${task.id}`}
                type="file"
                disabled={submitMutation.isPending || !canSubmit}
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-md border border-foreground/10 bg-background px-2.5 py-2 text-[11px]">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-foreground/45" />
                <span className="truncate">{file.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={submitMutation.isPending}
                className="text-foreground/45 hover:text-destructive disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          )}

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            disabled={submitMutation.isPending || !canSubmit}
            placeholder={
              canSubmit
                ? "Optional note to Mangaka..."
                : "This task is not currently open for submission."
            }
            className="w-full resize-none rounded-md border border-foreground/15 bg-background px-2.5 py-2 text-[11px] text-foreground placeholder:text-foreground/35 focus:border-foreground/30 focus:outline-none disabled:opacity-50"
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitMutation.isPending || !canSubmit || (!file && !note.trim())}
            className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {submitMutation.isPending ? "Uploading..." : `Submit v${nextVersion}`}
          </button>

          {notice && (
            <div
              className={`rounded-md border px-2.5 py-2 text-[11px] ${
                notice.tone === "error"
                  ? "border-destructive/20 bg-destructive/5 text-destructive"
                  : "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
              }`}
            >
              {notice.message}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-3.5">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground/35">
          <MessageSquare className="h-3.5 w-3.5" />
          Feedback
        </div>
        {feedback.length === 0 ? (
          <div className="rounded-md border border-foreground/10 bg-background p-3 text-center text-[11px] text-foreground/45">
            No revision feedback yet.
          </div>
        ) : (
          <div className="space-y-2">
            {feedback.map((submission) => (
              <div key={submission.id} className="rounded-md border border-foreground/10 bg-background p-2.5">
                <div className="flex items-center justify-between gap-2 text-[10px] text-foreground/45">
                  <span>v{submission.version}</span>
                  <span>{formatDateTime(submission.updatedAt)}</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-foreground/75">
                  {submission.reviewerNote}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-3.5">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground/35">
          <Clock3 className="h-3.5 w-3.5" />
          Version history
        </div>
        {submissionsQuery.isLoading ? (
          <div className="py-4 text-center text-[11px] text-foreground/45">Loading versions...</div>
        ) : submissions.length === 0 ? (
          <div className="rounded-md border border-foreground/10 bg-background p-3 text-center text-[11px] text-foreground/45">
            No submissions yet.
          </div>
        ) : (
          <ol className="space-y-2">
            {submissions.map((submission) => (
              <SubmissionHistoryItem key={submission.id} submission={submission} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] uppercase tracking-wider text-foreground/35">{label}</dt>
      <dd className="mt-0.5 truncate text-[11px] text-foreground/75">{value}</dd>
    </div>
  );
}

function ResourceDownload({ label, fileAssetId }: { label: string; fileAssetId?: string }) {
  const { data: url, isLoading } = useFileDownloadUrl(fileAssetId);
  const disabled = !fileAssetId || isLoading || !url;

  return (
    <a
      href={disabled ? undefined : url}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => {
        if (disabled) event.preventDefault();
      }}
      className={`flex items-center justify-between gap-2 rounded-md border border-foreground/10 bg-background px-2.5 py-2 text-[11px] ${
        disabled
          ? "cursor-not-allowed text-foreground/35"
          : "text-foreground/70 hover:border-foreground/20 hover:bg-muted hover:text-foreground"
      }`}
    >
      <span>{label}</span>
      <span className="inline-flex items-center gap-1">
        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
        {fileAssetId ? "Download" : "Unavailable"}
      </span>
    </a>
  );
}

function SubmissionHistoryItem({ submission }: { submission: Submission }) {
  return (
    <li className="rounded-md border border-foreground/10 bg-background p-2.5">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-semibold text-foreground">Version v{submission.version}</span>
        <StatusBadge status={submissionStatusForBadge(submission.status)} />
      </div>
      <div className="mt-1 text-[10px] text-foreground/45">{formatDateTime(submission.createdAt)}</div>
      {submission.resultText && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-foreground/70">{submission.resultText}</p>
      )}
      {submission.fileAssetId && <SubmissionFileLink fileAsset={submission.fileAssetId} />}
    </li>
  );
}

function SubmissionFileLink({ fileAsset }: { fileAsset: Submission["fileAssetId"] }) {
  const fileAssetId = getFileAssetId(fileAsset);
  const { data: url, isLoading } = useFileDownloadUrl(fileAssetId);
  const disabled = !fileAssetId || isLoading || !url;
  const label =
    typeof fileAsset === "object" && fileAsset
      ? fileAsset.originalName ?? "Submitted file"
      : "Submitted file";

  return (
    <a
      href={disabled ? undefined : url}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => {
        if (disabled) event.preventDefault();
      }}
      className={`mt-2 inline-flex max-w-full items-center gap-1.5 rounded border border-foreground/10 bg-muted px-1.5 py-0.5 text-[10px] ${
        disabled ? "cursor-not-allowed text-foreground/35" : "text-foreground/70 hover:text-foreground"
      }`}
    >
      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
      <span className="truncate">{label}</span>
    </a>
  );
}

function getFileAssetId(fileAsset: Submission["fileAssetId"]): string | undefined {
  if (!fileAsset) return undefined;
  if (typeof fileAsset === "string") return fileAsset;
  return fileAsset.id ?? fileAsset._id;
}

function submissionStatusForBadge(status: Submission["status"]) {
  return status.toLowerCase().replace(/_/g, "-") as Parameters<typeof StatusBadge>[0]["status"];
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
