import type { AssistantSubmission } from "@/entities/submission/model/assistant-types";
import { formatDateTime } from "@/shared/lib/format-date";
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
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
      <header className="border-b border-border/60 px-4 py-3">
        <h2 className="font-serif text-[16px] font-semibold leading-tight text-foreground">
          {title}
        </h2>
      </header>
      <ul className="divide-y divide-border/60">
        {submissions.map((submission) => (
          <li
            key={submission.id}
            className="flex items-center justify-between gap-3 px-4 py-3 text-xs"
          >
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{submission.versionLabel}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {formatDateTime(submission.submittedAt)}
              </p>
            </div>
            <ReviewStatusPill status={submission.status} />
          </li>
        ))}
      </ul>
    </section>
  );
}
