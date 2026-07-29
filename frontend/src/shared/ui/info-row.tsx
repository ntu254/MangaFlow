import type { ReactNode } from "react";

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(110px,1fr)_minmax(0,1fr)] gap-4 text-[13px]">
      <span className="text-[var(--admin-faint)]">{label}</span>
      <span className="min-w-0 text-right font-medium break-words text-[var(--admin-ink)]">
        {value}
      </span>
    </div>
  );
}
