import {
  Upload,
  FilePlus,
  Send,
  CheckCircle2,
  XCircle,
  Rocket,
  Activity as ActivityIcon,
} from "lucide-react";
import type { ActivityEvent } from "../../lib/activityFilter";

const ICON = {
  "page-uploaded": Upload,
  "task-created": FilePlus,
  "submission-submitted": Send,
  "submission-mangaka-approved": CheckCircle2,
  "submission-editor-approved": CheckCircle2,
  "submission-rejected": XCircle,
  "chapter-published": Rocket,
} as const;

export function ActivityTab({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <div className="text-[12px] text-foreground/55">No production activity yet.</div>;
  }
  return (
    <ul className="space-y-2">
      {events.map((e) => {
        const Icon = ICON[e.kind] ?? ActivityIcon;
        return (
          <li
            key={e.id}
            className="flex items-start gap-3 rounded border border-foreground/10 bg-card p-2.5 text-[12px]"
          >
            <Icon className="mt-0.5 h-4 w-4 text-foreground/55" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-foreground/85">{e.label}</div>
              <div className="text-[11px] text-foreground/55">
                {e.actor ? `${e.actor} · ` : ""}
                {e.at}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
