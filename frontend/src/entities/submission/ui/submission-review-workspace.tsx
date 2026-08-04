// DESIGN CONTRACT — submission review workspace (mangaka + editor routes)
// THESIS: one page asset under review, decided in full context — original vs
// edited, submission note, prior feedback, comments, version history — with a
// single action row; it refuses the cream admin-* editorial palette in favor of
// the light register world shared by /app/proposals, /app/series, and the
// review queue.
// OWN-WORLD: standard MangaFlow tokens (white --card, paper --background, ink
// --primary, --border ink/10), serif page title with status pill, white cards
// with serif card titles, tinted decision buttons (ink / amber / destructive),
// amber and rose notice boxes, dashed-light empty state, muted uppercase
// tracked info labels.
// STORY: a reviewer lands on a submission, scans the before/after comparison
// and note, reads prior feedback and comments, then acts — approve, request
// revision, or reject — with a reason when required, and is returned to the
// queue.
// FIRST VIEWPORT: back link, header (serif title + status pill), before/after
// comparison, submission note, feedback notice, info + review actions side
// panel.
// FORM: shared by /app/mangaka/submissions/$submissionId/review and
// /app/editor/review/$submissionId; both routes render these entity components
// directly, so the port extends the light world to both. Shared primitives
// (ImageCompare) are ported to standard tokens alongside.
// FINISH: unreviewed and undocumented is unfinished; this build ends with the
// finish review, the verdict, and DESIGN.md.
import { useState, type ReactNode } from "react";
import { AlertTriangle, FileQuestion } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/cn";
import { formatDateTime } from "@/shared/lib/format-date";
import type { AssistantSubmission } from "../model/assistant-types";
import { SUBMISSION_STATUS_LABEL } from "../model/assistant-types";
import { ReviewStatusPill } from "./review-status-pill";

export interface SubmissionReviewAction {
  key: string;
  label: string;
  variant: "primary" | "warn" | "danger" | "neutral";
  requiresReason?: boolean;
  supported: boolean;
  onAct?: (reason?: string) => void;
}

export interface SubmissionReviewComment {
  id: string;
  authorName?: string;
  text: string;
}

export interface SubmissionReviewWorkspaceProps {
  backLink: ReactNode;
  title: string;
  subtitle: ReactNode;
  submission: AssistantSubmission;
  comments?: SubmissionReviewComment[];
  isReviewable: boolean;
  actions: SubmissionReviewAction[];
  currentUserId?: string;
  history?: ReactNode;
  comparison?: ReactNode;
  processedMessage?: string;
}

export function SubmissionReviewLoading({ backLink }: { backLink: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {backLink}
      <Skeleton className="h-9 w-80" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SubmissionReviewMissing({ backLink }: { backLink: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {backLink}
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
        <div className="grid size-10 place-items-center rounded-lg border border-border bg-card text-muted-foreground">
          <FileQuestion className="size-5" />
        </div>
        <h3 className="font-serif text-lg font-semibold text-foreground">Submission not found</h3>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          The submission may have been deleted or the route is invalid.
        </p>
      </div>
    </div>
  );
}

function ReviewCard({
  title,
  description,
  children,
  contentClassName,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div>
          <h2 className="font-serif text-[16px] font-semibold leading-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </header>
      <div className={cn("p-4", contentClassName)}>{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium break-words text-foreground">{value}</span>
    </div>
  );
}

function Notice({
  tone,
  title,
  children,
}: {
  tone: "amber" | "rose";
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-xs",
        tone === "amber"
          ? "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/30"
          : "border-rose-200 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/30",
      )}
    >
      <AlertTriangle
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "amber"
            ? "text-amber-700 dark:text-amber-400"
            : "text-rose-700 dark:text-rose-400",
        )}
      />
      <div>
        <p
          className={cn(
            "font-semibold",
            tone === "amber"
              ? "text-amber-900 dark:text-amber-200"
              : "text-rose-900 dark:text-rose-200",
          )}
        >
          {title}
        </p>
        <div
          className={cn(
            "mt-1 leading-relaxed",
            tone === "amber"
              ? "text-amber-900/80 dark:text-amber-200/80"
              : "text-rose-900/80 dark:text-rose-200/80",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function DecisionButtons({
  actions,
  reviewable,
  blockedMessage,
  processedMessage,
}: {
  actions: SubmissionReviewAction[];
  reviewable: boolean;
  blockedMessage?: ReactNode;
  processedMessage?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-3">
      {blockedMessage}

      {reviewable && actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => {
            const disabled = !a.supported;
            return (
              <button
                key={a.key}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  if (a.requiresReason) {
                    setOpen(a.key);
                    setReason("");
                  } else {
                    a.onAct?.();
                  }
                }}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  a.variant === "primary" &&
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  a.variant === "warn" && "bg-amber-600 text-white hover:bg-amber-700",
                  a.variant === "danger" &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                  a.variant === "neutral" &&
                  "border border-border bg-card text-foreground hover:bg-muted",
                )}
                title={disabled ? "Unavailable for this submission" : undefined}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{processedMessage}</p>
      )}

      {open ? (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <label
            htmlFor="review-reason"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Reason / Feedback
          </label>
          <textarea
            id="review-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Enter detailed feedback..."
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="rounded-md border border-border bg-card px-3 py-1 text-xs text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={reason.trim().length < 3}
              onClick={() => {
                const a = actions.find((x) => x.key === open);
                a?.onAct?.(reason.trim());
                setOpen(null);
              }}
              className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SubmissionReviewWorkspace({
  backLink,
  title,
  subtitle,
  submission,
  comments = [],
  isReviewable,
  actions,
  currentUserId,
  history,
  comparison,
  processedMessage = "This submission has already been processed. No further action is available.",
}: SubmissionReviewWorkspaceProps) {
  const selfApprovalBlocked = currentUserId ? submission.assistantId === currentUserId : false;
  const feedbackMeta =
    submission.reviewedByName && submission.reviewedAt
      ? `${submission.reviewedByName}, ${formatDateTime(submission.reviewedAt)}`
      : submission.reviewedByName;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {backLink}

      <div className="flex flex-col gap-3 border-b border-border/60 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="md:pb-0.5">
          <ReviewStatusPill status={submission.status} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          {comparison ? (
            <ReviewCard title="Before / After">
              <div className="overflow-hidden rounded-lg">{comparison}</div>
            </ReviewCard>
          ) : null}

          {submission.note ? (
            <ReviewCard title="Submission note">
              <p className="text-xs leading-6 whitespace-pre-line text-muted-foreground">
                {submission.note}
              </p>
            </ReviewCard>
          ) : null}

          {submission.feedback ? (
            <Notice tone="amber" title="Review feedback">
              <p className="whitespace-pre-line">{submission.feedback}</p>
              {feedbackMeta ? (
                <p className="mt-2 font-medium opacity-80">— {feedbackMeta}</p>
              ) : null}
            </Notice>
          ) : null}
        </div>

        <aside className="space-y-5">
          <ReviewCard title="Submission info">
            <div className="grid gap-2.5">
              <InfoRow label="ID" value={submission.id} />
              <InfoRow label="Version" value={submission.versionLabel} />
              <InfoRow label="Status" value={SUBMISSION_STATUS_LABEL[submission.status]} />
              <InfoRow label="Submitted" value={formatDateTime(submission.submittedAt)} />
              <InfoRow label="Assistant" value={submission.assistantId} />
              {submission.fileName ? <InfoRow label="File" value={submission.fileName} /> : null}
            </div>
          </ReviewCard>

          <ReviewCard title="Review actions">
            <DecisionButtons
              actions={actions}
              reviewable={isReviewable}
              processedMessage={processedMessage}
              blockedMessage={
                selfApprovalBlocked ? (
                  <Notice tone="rose" title="Self-Approval Blocked">
                    You cannot approve your own submission to prevent conflicts of interest.
                  </Notice>
                ) : undefined
              }
            />
          </ReviewCard>

          {comments.length > 0 ? (
            <ReviewCard title={`Task comments (${comments.length})`} contentClassName="p-0">
              <ul className="divide-y divide-border/60">
                {comments.map((comment) => (
                  <li key={comment.id} className="px-4 py-3 text-xs">
                    <p className="font-semibold text-foreground">
                      {comment.authorName ?? "Unknown"}
                    </p>
                    <p className="mt-0.5 leading-relaxed text-muted-foreground">{comment.text}</p>
                  </li>
                ))}
              </ul>
            </ReviewCard>
          ) : null}

          {history}
        </aside>
      </div>
    </div>
  );
}
