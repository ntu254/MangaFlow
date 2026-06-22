import { Link } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

export function DecisionPortalShell({
  eyebrow = "Dashboard",
  title,
  description,
  active,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: ReactNode;
  active?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="overflow-hidden rounded-md border border-border bg-card">
        <div className="grid gap-5 border-b border-border bg-foreground/[0.025] p-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {eyebrow}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {title}
            </h1>
            <div className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </div>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </section>
      {children}
    </div>
  );
}

export function PortalCard({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-md border border-border bg-card ${className}`}>
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {description && (
              <div className="mt-1 text-xs leading-5 text-muted-foreground">{description}</div>
            )}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function PortalMetric({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground/5 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 font-mono text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

export function PortalAction({
  icon: Icon,
  title,
  text,
  to,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-md border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:bg-foreground/5 active:translate-y-px"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition group-hover:text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">{text}</div>
      </div>
    </Link>
  );
}

export function PortalPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "success" | "warn" | "danger";
}) {
  const toneClass = {
    neutral: "border-border bg-foreground/5 text-muted-foreground",
    primary: "border-primary/25 bg-primary/10 text-primary",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warn: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "border-destructive/25 bg-destructive/10 text-destructive",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function PortalLoadingRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-md bg-foreground/5" />
      ))}
    </div>
  );
}

export function PortalNotice({
  children,
  tone = "warn",
}: {
  children: ReactNode;
  tone?: "warn" | "info";
}) {
  const classes =
    tone === "warn"
      ? "border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-300"
      : "border-primary/20 bg-primary/5 text-primary";
  return <div className={`rounded-md border px-4 py-3 text-sm ${classes}`}>{children}</div>;
}

export function DecisionTimeline({ steps, activeStep }: { steps: string[]; activeStep: number }) {
  return (
    <div className="grid gap-2 rounded-md border border-border bg-card p-3 sm:grid-cols-3 lg:grid-cols-6">
      {steps.map((step, index) => {
        const done = index < activeStep;
        const active = index === activeStep;
        return (
          <div
            key={step}
            className={`rounded-md border px-3 py-2 text-xs ${
              active
                ? "border-primary bg-primary/10 text-primary"
                : done
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-border bg-background text-muted-foreground"
            }`}
          >
            <div className="font-mono text-[10px] opacity-70">0{index + 1}</div>
            <div className="mt-1 font-medium">{step}</div>
          </div>
        );
      })}
    </div>
  );
}

export const boardFlowSteps = ["Proposal", "Evidence", "Vote", "Schedule", "Ranking", "Decision"];

export { CalendarClock };
