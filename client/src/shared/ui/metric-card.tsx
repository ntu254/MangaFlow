import { cn } from "@/shared/lib/cn";
import type { ReactNode } from "react";

export function MetricCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "warning" | "danger" | "success";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-5 shadow-[0_20px_70px_rgba(31,24,12,0.04)]",
        tone === "warning" && "border-[var(--admin-gold)] bg-[#fff7df]",
        tone === "danger" && "border-rose-200 bg-rose-50/70",
        tone === "success" && "border-emerald-200 bg-emerald-50/70",
        className,
      )}
    >
      <div className="flex items-center gap-3 text-[var(--admin-muted)]">
        {icon ? <span className="grid size-5 place-items-center">{icon}</span> : null}
        <p className="font-serif text-[15px] font-semibold text-[var(--admin-ink)]">{label}</p>
      </div>
      <p className="mt-4 font-serif text-[30px] leading-none text-[var(--admin-ink)] tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-2 text-[12px] text-[var(--admin-muted)]">{hint}</p> : null}
    </section>
  );
}
