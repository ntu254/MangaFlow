import { BookOpen, FileText, Image as ImageIcon, CheckCircle, Users } from "lucide-react";

export function ProductionOverview() {
  const stats = [
    {
      icon: BookOpen,
      value: "3",
      label: "Series Ongoing",
      subLabel: "2 At Risk",
    },
    {
      icon: FileText,
      value: "12",
      label: "Chapters",
      subLabel: "In Production",
    },
    {
      icon: ImageIcon,
      value: "184",
      label: "Pages",
      subLabel: "Uploaded",
    },
    {
      icon: CheckCircle,
      value: "27",
      label: "Tasks",
      subLabel: <span className="text-destructive font-medium">Waiting Review</span>,
    },
    {
      icon: Users,
      value: "18",
      label: "Team Members",
      subLabel: "Active",
    },
  ];

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-[15px] font-bold text-foreground">Production Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-foreground/10 bg-card p-4 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <s.icon className="mb-3 h-5 w-5 text-foreground/60" />
            <div className="text-2xl font-bold leading-none">{s.value}</div>
            <div className="mt-1 text-[11px] font-medium text-foreground/80">{s.label}</div>
            <div className="text-[10px] text-foreground/50">{s.subLabel}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
