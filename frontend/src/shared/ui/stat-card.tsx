import type { ReactNode } from "react";
import { STAT_TONE_BG, type StatCardTone } from "./stat-card-tones";
import { cn } from "@/shared/lib/cn";

export function StatCard({
  icon,
  tone = "neutral",
  label,
  value,
  hint,
  trailing,
  className,
}: {
  icon: ReactNode;
  tone?: StatCardTone;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-tone={tone}
      className={cn(
        "group flex items-center gap-3 rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 transition-colors duration-150 hover:border-[var(--admin-muted)]",
        className,
      )}
    >
      <div
        className={`grid size-9 shrink-0 place-items-center rounded-[6px] ${STAT_TONE_BG[tone]}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-widest text-[var(--admin-faint)]">
            {label}
          </p>
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
        <p className="font-serif text-xl leading-none text-[var(--admin-ink)] tabular-nums">
          {value}
        </p>
        {hint ? <div className="mt-0.5 text-[10px] text-[var(--admin-muted)]">{hint}</div> : null}
      </div>
    </div>
  );
}
