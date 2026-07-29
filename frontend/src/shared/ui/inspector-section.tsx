import type { ReactNode } from "react";

export function InspectorSection({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h3 className="font-serif text-[17px] font-semibold text-[var(--admin-ink)]">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}
