import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/shared/lib/format-date";
import {
  DecisionActions,
  EmptyState,
  InfoRow,
  Notice,
  PageFrame,
  PageHeader,
  Panel,
} from "@/shared/ui";
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
  eyebrow: string;
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
    <PageFrame>
      <section className="mx-auto max-w-7xl space-y-5">
        {backLink}
        <Skeleton className="h-10 w-72 rounded-[6px]" />
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-72 rounded-[6px]" />
          <Skeleton className="h-48 rounded-[6px]" />
        </div>
      </section>
    </PageFrame>
  );
}

export function SubmissionReviewMissing({ backLink }: { backLink: ReactNode }) {
  return (
    <PageFrame>
      <section className="mx-auto max-w-7xl space-y-5">
        {backLink}
        <EmptyState
          title="Submission not found"
          description="The submission may have been deleted or the URL is invalid."
        />
      </section>
    </PageFrame>
  );
}

export function SubmissionReviewWorkspace({
  backLink,
  eyebrow,
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
    <PageFrame>
      <section className="mx-auto max-w-7xl space-y-5">
        {backLink}

        <PageHeader
          eyebrow={`${eyebrow} · ${submission.id}`}
          title={title}
          actions={<ReviewStatusPill status={submission.status} />}
        >
          <p className="mt-2 max-w-2xl text-[14px] text-[var(--admin-muted)]">{subtitle}</p>
        </PageHeader>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            {comparison ? <Panel title="Before / After">{comparison}</Panel> : null}

            {submission.note ? (
              <Panel title="Submission note">
                <p className="whitespace-pre-line text-[14px] leading-6 text-[var(--admin-muted)]">
                  {submission.note}
                </p>
              </Panel>
            ) : null}

            {submission.feedback ? (
              <Notice
                icon={<AlertTriangle className="size-4" />}
                title="Review feedback"
                className="border-amber-200 bg-amber-50/60"
              >
                <p className="whitespace-pre-line text-amber-900">{submission.feedback}</p>
                {feedbackMeta ? (
                  <p className="mt-2 text-[12px] font-medium text-amber-800">- {feedbackMeta}</p>
                ) : null}
              </Notice>
            ) : null}
          </div>

          <aside className="space-y-5">
            <Panel title="Submission info">
              <div className="grid gap-2.5">
                <InfoRow label="Version" value={submission.versionLabel} />
                <InfoRow label="Status" value={SUBMISSION_STATUS_LABEL[submission.status]} />
                <InfoRow label="Submitted" value={formatDateTime(submission.submittedAt)} />
                <InfoRow label="Assistant" value={submission.assistantId} />
                {submission.fileName ? <InfoRow label="File" value={submission.fileName} /> : null}
              </div>
            </Panel>

            <Panel title="Review actions">
              <div className="space-y-3">
                {selfApprovalBlocked ? (
                  <Notice
                    icon={<AlertTriangle className="size-4" />}
                    title="Self-Approval Blocked"
                    className="border-rose-200 bg-rose-50/60"
                  >
                    You cannot approve your own submission to prevent conflicts of interest.
                  </Notice>
                ) : null}

                {isReviewable ? (
                  <DecisionActions actions={actions} />
                ) : (
                  <p className="text-[13px] text-[var(--admin-faint)]">{processedMessage}</p>
                )}
              </div>
            </Panel>

            {comments.length > 0 ? (
              <Panel title={`Task comments (${comments.length})`} contentClassName="p-0">
                <ul className="divide-y divide-[var(--admin-border)]">
                  {comments.map((comment) => (
                    <li key={comment.id} className="px-5 py-3 text-[13px]">
                      <p className="font-semibold text-[var(--admin-ink)]">
                        {comment.authorName ?? "Unknown"}
                      </p>
                      <p className="mt-1 text-[var(--admin-muted)]">{comment.text}</p>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}

            {history}
          </aside>
        </div>
      </section>
    </PageFrame>
  );
}
