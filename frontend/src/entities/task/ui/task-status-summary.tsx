import {
  CircleDashed,
  Loader2,
  Send,
  AlertOctagon,
  CheckCircle2,
  Archive,
  AlertTriangle,
  Clock,
  UserCheck,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/shared/ui/stat-card";
import type { StatCardTone } from "@/shared/ui/stat-card-tones";
import type { StudioTask } from "@/entities/series/model/studio-types";
import { getVisualTaskStatus, type VisualTaskStatus } from "../model/task-status-utils";

const ITEMS: Array<{
  id: string;
  statuses: VisualTaskStatus[];
  label: string;
  tone: StatCardTone;
  icon: React.ReactNode;
}> = [
  {
    id: "todo",
    statuses: ["TODO"],
    label: "To do",
    tone: "neutral",
    icon: <CircleDashed className="size-4" />,
  },
  {
    id: "in_progress",
    statuses: ["IN_PROGRESS"],
    label: "In progress",
    tone: "amber",
    icon: <Loader2 className="size-4" />,
  },
  {
    id: "revision",
    statuses: ["REVISION_REQUESTED"],
    label: "Revision",
    tone: "orange",
    icon: <AlertOctagon className="size-4" />,
  },
  {
    id: "submitted",
    statuses: ["SUBMITTED"],
    label: "Submitted",
    tone: "sky",
    icon: <Send className="size-4" />,
  },
  {
    id: "approved",
    statuses: ["MANGAKA_APPROVED"],
    label: "Approved",
    tone: "emerald",
    icon: <CheckCircle2 className="size-4" />,
  },
];

export function TaskStatusSummary({ tasks }: { tasks: StudioTask[] }) {
  const count = (statuses: VisualTaskStatus[]) =>
    tasks.filter((t) => statuses.includes(getVisualTaskStatus(t))).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {ITEMS.map((it) => (
        <StatCard
          key={it.id}
          icon={it.icon}
          tone={it.tone}
          label={it.label}
          value={count(it.statuses)}
        />
      ))}
    </div>
  );
}
