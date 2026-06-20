import type { ReactNode } from "react";

export function Row({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
      <div className="min-w-0">{left}</div>
      {right && <div className="shrink-0 text-foreground/70">{right}</div>}
    </div>
  );
}
