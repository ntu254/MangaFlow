import type { AtRiskReview } from "@/entities/board/model/board-types";
import { Panel } from "@/shared/ui";

export function PerformanceSnapshot({ review }: { review: AtRiskReview }) {
  return (
    <Panel
      title={review.seriesTitle}
      description="Performance snapshot"
      contentClassName="space-y-4"
    >
      <p className="text-[13px] leading-relaxed text-[var(--admin-muted)]">{review.reason}</p>
      <div className="grid grid-cols-3 divide-x divide-[var(--admin-border)] border-y border-[var(--admin-border)] py-3 text-center">
        <Metric label="Final score" value={(review.finalScore ?? review.readerScore).toFixed(1)} />
        <Metric label="Reader score" value={review.readerScore.toFixed(1)} />
        <Metric label="Votes" value={(review.voteCount ?? 0).toLocaleString()} />
      </div>
    </Panel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2">
      <p className="font-serif text-[20px] text-[var(--admin-ink)] tabular-nums">{value}</p>
      <p className="mt-1 truncate text-[10px] font-semibold text-[var(--admin-faint)]">{label}</p>
    </div>
  );
}
