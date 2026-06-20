import type { ReactNode } from "react";

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-foreground/10 bg-card">
      <header className="flex items-center justify-between border-b border-foreground/10 px-4 py-2.5">
        <h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>
        {action}
      </header>
      <div className="divide-y divide-foreground/5">{children}</div>
    </section>
  );
}
