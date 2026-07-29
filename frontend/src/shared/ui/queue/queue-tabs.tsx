import { cn } from "@/shared/lib/cn";

export type QueueTab = { key: string; label: string; count?: number };

export function QueueTabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: QueueTab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-5 border-b border-[var(--admin-border)]", className)}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative -mb-px inline-flex items-center gap-1.5 border-b-2 px-0.5 pb-2.5 text-[13px] font-semibold transition-colors",
              isActive
                ? "border-[var(--admin-ink)] text-[var(--admin-ink)]"
                : "border-transparent text-[var(--admin-faint)] hover:text-[var(--admin-ink)]",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  isActive
                    ? "bg-[var(--admin-ink)] text-[var(--admin-cream)]"
                    : "bg-[var(--admin-hover)] text-[var(--admin-muted)]",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
