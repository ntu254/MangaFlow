import { StatCard } from "@/layouts/AppShell";

export function StatGrid({ items }: { items: { label: string; value: string; hint?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((i) => (
        <StatCard key={i.label} {...i} />
      ))}
    </div>
  );
}
