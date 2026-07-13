import { EmptyState } from "@/shared/ui/empty-state";

export function ModulePlaceholder({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: number;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="border-b border-border pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
          Phase {phase} module
        </p>
        <h1 className="mt-1 font-serif text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </header>
      <EmptyState
        title={`${title} will be built in Phase ${phase}`}
        description="Phase 1 completed the design system, public reader, and role-aware app shell. This module will wire backend and UI in its corresponding phase."
      />
    </div>
  );
}
