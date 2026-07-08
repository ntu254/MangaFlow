import type { AssistantSubmission } from "@/entities/submission/model/assistant-types";
import {
  SUBMISSION_STATUS_BADGE,
  SUBMISSION_STATUS_LABEL,
} from "@/entities/submission/model/assistant-types";
import { formatDateTime } from "@/shared/lib/format-date";

export function SubmissionHistory({ submissions }: { submissions: AssistantSubmission[] }) {
  if (submissions.length === 0) {
    return <div className="p-3 text-xs text-muted-foreground">Chưa có submission nào.</div>;
  }
  return (
    <div className="overflow-x-auto p-2">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-2 py-1.5 text-left font-semibold">Version</th>
            <th className="px-2 py-1.5 text-left font-semibold">Status</th>
            <th className="px-2 py-1.5 text-left font-semibold">Submitted</th>
            <th className="px-2 py-1.5 text-left font-semibold">Reviewer</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id} className="border-b border-border last:border-0">
              <td className="px-2 py-1.5 font-semibold">{s.versionLabel}</td>
              <td className="px-2 py-1.5">
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${SUBMISSION_STATUS_BADGE[s.status]}`}
                >
                  {SUBMISSION_STATUS_LABEL[s.status]}
                </span>
              </td>
              <td className="px-2 py-1.5 text-muted-foreground">{formatDateTime(s.submittedAt)}</td>
              <td className="px-2 py-1.5 text-muted-foreground">{s.reviewedByName ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
