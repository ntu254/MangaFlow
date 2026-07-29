import { forwardRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export const SURFACE_CLASSES =
  "rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)]";

type PanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
};

export const Panel = forwardRef<HTMLElement, PanelProps>(function Panel(
  { title, description, children, action, className, headerClassName, contentClassName },
  ref,
) {
  return (
    <section ref={ref} className={cn(SURFACE_CLASSES, "flex flex-col", className)}>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4",
          headerClassName,
        )}
      >
        <div>
          <h2 className="font-serif text-[18px] font-semibold leading-tight text-[var(--admin-ink)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-[12px] text-[var(--admin-faint)]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className={cn("flex-1 p-5", contentClassName)}>{children}</div>
    </section>
  );
});

Panel.displayName = "Panel";
