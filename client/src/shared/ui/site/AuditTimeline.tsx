import { findStaff } from "@/entities";
import { useAuditLog } from "@/shared/lib/audit";
import type { AuditEntity } from "@/entities/audit/model";

export function AuditTimeline({
  entity,
  entityId,
  title = "Activity",
  limit,
}: {
  entity?: AuditEntity;
  entityId?: string;
  title?: string;
  limit?: number;
}) {
  let events = useAuditLog(entity, entityId);
  if (limit) events = events.slice(0, limit);

  return (
    <div className="rounded-md border border-foreground/10 bg-card">
      <div className="border-b border-foreground/10 px-4 py-2.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
          {title}
        </div>
      </div>
      <div className="divide-y divide-foreground/10">
        {events.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-foreground/55">No activity yet.</div>
        )}
        {events.map((e) => {
          const actor = findStaff(e.actorId);
          return (
            <div key={e.id} className="flex items-start gap-3 px-4 py-2.5 text-xs">
              <div className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[11px] text-foreground/80">{e.type}</div>
                <div className="mt-0.5 text-foreground/60">
                  {actor ? `${actor.name} · ` : ""}
                  {e.at}
                </div>
                {e.payload && (
                  <div className="mt-0.5 font-mono text-[10px] text-foreground/50">
                    {JSON.stringify(e.payload)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
