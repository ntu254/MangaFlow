import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import { ROLES } from "@/shared/lib/role";

const PERMS = [
  "Create series",
  "Approve manuscripts (round 1)",
  "Approve manuscripts (round 2)",
  "Forward to board",
  "Vote on board",
  "Schedule publication",
  "Confirm payroll",
  "Lock rankings",
];

const MATRIX: Record<string, string[]> = {
  admin: PERMS,
  mangaka: ["Create series", "Approve manuscripts (round 1)"],
  editor: [
    "Approve manuscripts (round 2)",
    "Forward to board",
    "Schedule publication",
    "Confirm payroll",
  ],
  assistant: [],
  board: ["Vote on board", "Lock rankings"],
};

export const Route = createFileRoute("/app/admin/roles")({
  component: () => (
    <div>
      <PageHeader
        title="Roles & permissions"
        jp="権限管理"
        description="Phase 1 displays the matrix from src/lib/role.tsx. Edit lives in phase 2."
      />
      <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
        <div className="grid grid-cols-[2fr_repeat(5,1fr)] gap-3 border-b border-foreground/10 bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground/55">
          <span>Permission</span>
          {ROLES.map((r) => (
            <span key={r.id} className="text-center">
              {r.label}
            </span>
          ))}
        </div>
        {PERMS.map((p) => (
          <div
            key={p}
            className="grid grid-cols-[2fr_repeat(5,1fr)] items-center gap-3 border-b border-foreground/5 px-4 py-2.5 text-[13px] last:border-b-0"
          >
            <span>{p}</span>
            {ROLES.map((r) => (
              <span key={r.id} className="text-center">
                {MATRIX[r.id].includes(p) ? (
                  <span className="text-emerald-600 dark:text-emerald-400">●</span>
                ) : (
                  <span className="text-foreground/20">·</span>
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  ),
});
