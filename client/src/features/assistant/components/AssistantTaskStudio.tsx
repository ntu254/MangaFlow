import { useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { findChapter, findSeries, findStaff, submissionsByTask, type Task } from "@/entities";
import { extractErrorMessage } from "@/shared/api/_client";
import { useMyTasks } from "@/shared/queries/useTasks";
import { useSubmitTaskSubmission, useTaskSubmissions } from "@/shared/queries/useSubmissions";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { normalizeStatus } from "../lib/taskLifecycle";
import { deadlineClass, deadlineLabel, deadlineTone } from "@/features/tasks/lib/deadline";
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

type Tab = "info" | "feedback" | "history";

export function AssistantTaskStudio({ taskId }: { taskId: string }) {
  const navigate = useNavigate();
  const { data: tasks = [], isLoading, error } = useMyTasks();
  const task = tasks.find((item) => item.id === taskId);

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center text-[13px] text-foreground/55">
        Loading task studio…
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
  const ch = findChapter(task.chapterId);
  const series = ch ? findSeries(ch.seriesId) : null;
  const assignedBy = task.assignedById ? findStaff(task.assignedById) : null;
  const submissionsQuery = useTaskSubmissions(task.id);
  const submissions = submissionsQuery.data ?? [];
  const latestVersion = submissions.reduce((latest, item) => Math.max(latest, item.version), 0);
  const submitMutation = useSubmitTaskSubmission(task.pageId);
  const tone = deadlineTone(task.deadline);
  const normalized = normalizeStatus(task.status);

  const [tab, setTab] = useState<Tab>(normalized === "revision-requested" ? "feedback" : "info");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const nextVersion = Math.max(latestVersion, task.currentVersion ?? 0) + 1;
  const canSubmit =
    normalized === "todo" || normalized === "in-progress" || normalized === "revision-requested";

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

  function handleSaveLocalDraft() {
    try {
      window.localStorage.setItem(`assistant.task-draft.${task.id}`, note);
      setNotice({ tone: "success", message: "Draft note saved locally for development only." });
    } catch {
      setNotice({ tone: "error", message: "Could not save the local draft note." });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header bar */}
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
              {series?.title} · {ch?.number} · {task.pageRange}
              {task.regionId && <> · Region {task.regionId}</>}
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
                v{task.currentVersion ?? 0} → v{nextVersion}
              </span>
              <span className={deadlineClass(tone)}>{deadlineLabel(task.deadline, tone)}</span>
              {assignedBy && <span className="text-foreground/55">From {assignedBy.name}</span>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleSaveLocalDraft}
              disabled={submitMutation.isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-foreground/15 bg-background px-3 text-[12px] font-medium text-foreground hover:bg-muted"
            >
              <Save className="h-3.5 w-3.5" /> Save local draft (dev)
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitMutation.isPending || !canSubmit || (!file && !note.trim())}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {submitMutation.isPending ? "Uploading & submitting…" : `Submit v${nextVersion}`}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Canvas */}
        <section className="relative flex flex-1 flex-col bg-[#141414] text-white">
          <div className="absolute left-3 top-3 z-10 rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur">
            You can only edit Region:{" "}
            <span className="font-medium text-white">{task.regionId ?? "assigned area"}</span>
          </div>
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="aspect-[3/4] w-full max-w-[460px] rounded-md border border-white/15 bg-gradient-to-br from-white/[0.05] to-white/[0.02]">
              <div className="flex h-full flex-col items-center justify-center gap-2 text-white/40">
                <ImageIcon className="h-10 w-10" />
                <div className="text-[12px]">Working image preview</div>
                <div className="text-[11px] text-white/30">
                  {ch?.number} · Page {task.pageNumber ?? "—"}
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 bg-black/40 px-4 py-2 text-[11px] text-white/55">
            Tools: select · pan · brush · text · comment · save. Edit limited to assigned region.
          </div>
        </section>

        {/* Inspector */}
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
            {tab === "feedback" && <FeedbackPanel taskId={task.id} />}
            {tab === "history" && <HistoryPanel taskId={task.id} />}
          </div>
        </aside>
      </div>

      {/* Submission bar */}
      <section className="border-t border-foreground/10 bg-card">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-between px-5 py-2 text-[12px] font-medium text-foreground/70 hover:bg-muted"
        >
          <span className="inline-flex items-center gap-2">
            <Upload className="h-3.5 w-3.5" />
            Submission · v{nextVersion}
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
                  placeholder="Optional message to Mangaka…"
                  className="w-full rounded-md border border-foreground/15 bg-background px-2.5 py-2 text-[12px] text-foreground placeholder:text-foreground/40 focus:border-foreground/30 focus:outline-none"
                />
              </div>
            </div>
            <div className="rounded-md border border-foreground/10 bg-background p-3 text-[11px] text-foreground/65">
              <div className="font-medium text-foreground">Heads up</div>
              <ul className="mt-2 space-y-1 leading-relaxed">
                <li>• Each submit creates a new version, never overwrites.</li>
                <li>• Approved tasks unlock earnings after Editor approval.</li>
                <li>• Use Feedback tab to address revision notes.</li>
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
      <Field label="Region" value={task.regionId ?? "Assigned area"} />
      <Field
        label="Instruction"
        value={
          task.instruction ?? "No specific instructions. Match house style and reference pages."
        }
      />
      <Field label="Due" value={task.deadline} />
      <Field label="Priority" value={task.priority ?? "medium"} />
      <Field label="Current version" value={`v${task.currentVersion ?? 0}`} />
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
      <dd className="mt-0.5 text-[12px] text-foreground">{value}</dd>
    </div>
  );
}

function FeedbackPanel({ taskId }: { taskId: string }) {
  const subs = submissionsByTask(taskId);
  const feedback = subs
    .filter((s) => s.revisionRequestedBy)
    .map((s) => ({ ...s.revisionRequestedBy!, version: s.version }));

  if (feedback.length === 0) {
    return (
      <div className="rounded-md border border-foreground/10 bg-background p-4 text-center text-[12px] text-foreground/55">
        No revision feedback yet. You're all clear.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {feedback.map((f, i) => {
        const author = findStaff(f.userId);
        return (
          <div key={i} className="rounded-md border border-foreground/10 bg-background p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground/70">
                  {author?.avatar ?? "?"}
                </span>
                {author?.name ?? "Reviewer"}
                <span
                  className={`ml-1 inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${
                    f.role === "editor"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-foreground/15 bg-muted text-foreground/70"
                  }`}
                >
                  {f.role}
                </span>
              </span>
              <span className="text-foreground/50">
                v{f.version} · {f.at}
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-foreground/80">{f.message}</p>
          </div>
        );
      })}
    </div>
  );
}

function HistoryPanel({ taskId }: { taskId: string }) {
  const subs = submissionsByTask(taskId);
  if (subs.length === 0) {
    return (
      <div className="rounded-md border border-foreground/10 bg-background p-4 text-center text-[12px] text-foreground/55">
        No submissions yet. Submit your first version below.
      </div>
    );
  }
  return (
    <ol className="space-y-2">
      {subs.map((s) => (
        <li key={s.id} className="rounded-md border border-foreground/10 bg-background p-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-foreground">Version v{s.version}</span>
            <StatusBadge status={s.status} />
          </div>
          <div className="mt-1 text-[11px] text-foreground/55">{s.submittedAt}</div>
          {s.note && <p className="mt-1.5 text-[12px] text-foreground/75">{s.note}</p>}
          {s.files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {s.files.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded border border-foreground/10 bg-muted px-1.5 py-0.5 text-[10px] text-foreground/70"
                >
                  <Download className="h-3 w-3" /> {f}
                </span>
              ))}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
