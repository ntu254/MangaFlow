import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SURFACE_CLASSES } from "@/shared/ui/panel";

export { PageHeader } from "@/shared/ui/page-header";
export { TableSkeleton } from "@/shared/ui/table-skeleton";

type MaxWidth = "5xl" | "6xl" | "7xl" | "full";
type DashboardRole = "admin" | "mangaka" | "assistant" | "editor" | "board";

const MAX_WIDTH_CLASS: Record<MaxWidth, string> = {
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-none",
};

export function PageShell({
  children,
  maxWidth = "7xl",
  className,
  dashboardRole,
}: {
  children: ReactNode;
  maxWidth?: MaxWidth;
  className?: string;
  dashboardRole?: DashboardRole;
}) {
  return (
    <main
      id="main-content"
      data-dashboard-role={dashboardRole}
      className={cn(
        "mx-auto w-full space-y-6",
        MAX_WIDTH_CLASS[maxWidth],
        dashboardRole && "dashboard-shell",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function SummaryGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("grid gap-4 sm:grid-cols-3", className)}>{children}</section>;
}

export function DataManagementLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}

export function DataManagementTableCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(SURFACE_CLASSES, className)}>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function PageSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn(SURFACE_CLASSES, className)}>
      {title || description || action ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
          <div>
            {title ? (
              <h2 className="font-serif text-[18px] font-semibold leading-tight text-[var(--admin-ink)]">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-[12px] text-[var(--admin-faint)]">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={cn("p-4", contentClassName)}>{children}</div>
    </section>
  );
}

export function TableToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Loading cards"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("space-y-3 p-4", SURFACE_CLASSES)}>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="rounded-md border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-900"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-semibold">{title}</p>
          {description ? <p className="mt-1 text-xs opacity-85">{description}</p> : null}
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function SuccessState({ title, description }: { title: string; description?: string }) {
  return (
    <div
      role="status"
      className="rounded-md border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900"
    >
      <div className="flex items-start gap-2">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-semibold">{title}</p>
          {description ? <p className="mt-1 text-xs opacity-85">{description}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function WizardLayout({
  steps,
  currentStep,
  children,
}: {
  steps: string[];
  currentStep: number;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <Stepper steps={steps} currentStep={currentStep} />
      {children}
    </div>
  );
}

export function Stepper({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-4" aria-label="Import progress">
      {steps.map((step, index) => {
        const active = index === currentStep;
        const complete = index < currentStep;
        return (
          <li
            key={step}
            className={cn(
              "rounded-[6px] border px-3 py-2 text-xs font-semibold",
              active &&
                "border-[var(--admin-navy)] bg-[var(--admin-navy)] text-[var(--admin-cream)]",
              complete && "border-emerald-200 bg-emerald-50 text-emerald-900",
              !active &&
                !complete &&
                "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-faint)]",
            )}
          >
            <span className="mr-2 font-mono text-[10px]">{index + 1}</span>
            {step}
          </li>
        );
      })}
    </ol>
  );
}

export function SettingsGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <PageSection title={title} description={description} contentClassName="space-y-3">
      {children}
    </PageSection>
  );
}

export function SettingRow({
  title,
  description,
  icon,
  status,
  control,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  status?: ReactNode;
  control?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3">
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <div className="grid size-9 shrink-0 place-items-center rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-page)]">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">{control ?? status}</div>
    </div>
  );
}

export function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      Try again
    </Button>
  );
}
