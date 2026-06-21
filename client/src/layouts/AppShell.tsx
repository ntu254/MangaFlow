import React, { type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { ThemeProvider } from "@/shared/lib/theme";
import { Sidebar } from "@/layouts/Sidebar";
import { Topbar } from "@/layouts/Topbar";
import { SidebarProvider } from "@/layouts/SidebarContext";

function AppShellInner({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isPageStudio = pathname.startsWith("/app/pages/") && pathname.endsWith("/studio");
  const isAssistantTaskStudio =
    pathname.startsWith("/app/assistant/tasks/") && pathname.endsWith("/studio");

  if (isPageStudio) {
    return (
      <div suppressHydrationWarning className="flex min-h-screen w-full bg-[#141414] text-foreground">
        <main className="flex-1 flex flex-col min-w-0">{children}</main>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main
          className={
            isAssistantTaskStudio
              ? "flex h-[calc(100vh-3.5rem)] min-h-0 flex-col overflow-hidden"
              : "flex-1 px-10 py-5"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppShellInner>{children}</AppShellInner>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export function PageHeader({
  title,
  jp,
  description,
  actions,
}: {
  title: string;
  jp?: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {title}
          {jp && (
            <span className="ml-2 font-jp text-base font-normal text-foreground/45">{jp}</span>
          )}
        </h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  icon: Icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-foreground/10 bg-gradient-to-b from-foreground/[0.02] to-transparent px-8 py-16 text-center">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5 border border-foreground/10 mb-1">
          <Icon className="h-5 w-5 text-foreground/30" />
        </div>
      )}
      <div className="text-[14px] font-semibold text-foreground">{title}</div>
      {hint && (
        <div className="max-w-[280px] text-[12px] leading-relaxed text-foreground/50">{hint}</div>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 h-8 rounded-md bg-foreground/5 border border-foreground/10 px-4 text-[12px] font-medium text-foreground/70 hover:bg-foreground/10 hover:text-foreground transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function StatusDot({
  tone = "neutral",
}: {
  tone?: "neutral" | "success" | "warn" | "danger" | "info";
}) {
  const map = {
    neutral: "bg-foreground/40",
    success: "bg-emerald-500",
    warn: "bg-amber-500",
    danger: "bg-destructive",
    info: "bg-sky-500",
  } as const;
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${map[tone]}`} />;
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-foreground/10 bg-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-2xl font-bold text-foreground">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-foreground/55">{hint}</div>}
    </div>
  );
}
