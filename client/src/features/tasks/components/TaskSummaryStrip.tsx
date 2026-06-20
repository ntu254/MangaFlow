import type { Task } from "@/entities";
import { StatGrid } from "@/features/dashboard/components/StatGrid";

export function TaskSummaryStrip({ tasks }: { tasks: Task[] }) {
  const active = tasks.filter((t) => t.status === "assigned" || t.status === "in-progress").length;
  const waiting = tasks.filter((t) => t.status === "submitted").length;
  const revision = tasks.filter((t) => t.status === "rejected").length;
  const approved = tasks.filter((t) => t.status === "approved").length;

  return (
    <StatGrid
      items={[
        { label: "Active", value: String(active), hint: "Todo + In progress" },
        { label: "Waiting review", value: String(waiting), hint: "Submitted to Mangaka" },
        { label: "Needs revision", value: String(revision), hint: "Sent back for changes" },
        { label: "Approved", value: String(approved), hint: "Editor approved" },
      ]}
    />
  );
}
