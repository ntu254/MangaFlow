import type { AssistantSubmission } from "@/entities/submission/model/assistant-types";
import { formatDateTime } from "@/shared/lib/format-date";
import { Panel } from "@/shared/ui";
import { ReviewStatusPill } from "./review-status-pill";

export function SubmissionHistoryList({
  submissions,
  title = "Version history",
}: {
  submissions: AssistantSubmission[];
  title?: string;
}) {
  if (submissions.length === 0) return null;

  return (
    <Panel title={title} contentClassName="p-0">
      <ul className="divide-y divide-[var(--admin-border)]">
        {submissions.map((submission) => (
          <li
            key={submission.id}
            className="flex items-center justify-between gap-3 px-5 py-3 text-[13px]"
          >
            <div className="min-w-0">
              <p className="font-semibold text-[var(--admin-ink)]">{submission.versionLabel}</p>
              <p className="mt-0.5 text-[12px] text-[var(--admin-faint)]">
                {formatDateTime(submission.submittedAt)}
              </p>
            </div>
            <ReviewStatusPill status={submission.status} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
