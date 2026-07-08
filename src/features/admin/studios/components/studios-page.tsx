import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleBadge, ScopeBadge } from "@/entities/user";
import { MetricCard, PageHeader, Panel, TextButton } from "@/shared/ui";
import { getAdminUsers, useAdminAccess, AccessDenied } from "../../_shared";
import { StatusPill } from "@/shared/ui/status-pill";
import { Building2, ShieldCheck, Users } from "lucide-react";

const studios = [
  {
    id: "studio-main",
    name: "Tokyo Main Studio",
    owner: "Inoue Takehiko",
    activeSeries: 3,
    status: "ACTIVE",
  },
  {
    id: "studio-board",
    name: "Board Office",
    owner: "Yamamoto Director",
    activeSeries: 0,
    status: "READ_ONLY",
  },
];

export function AdminStudiosPage() {
  const { denial } = useAdminAccess();

  if (denial) {
    return (
      <AccessDenied
        title="Studios"
        description="You do not have permission to access the studios page."
        denial={denial}
      />
    );
  }

  const users = getAdminUsers();
  const assistants = users.filter((user) => user.role === "assistant");
  const creative = users.filter((user) => user.role === "mangaka" || user.role === "editor");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Studios and teams"
        description="Inspect studio membership and role distribution without turning Admin into a production task owner."
      />

      <section className="grid gap-4 sm:grid-cols-4">
        <MetricCard label="Studios" value={String(studios.length)} hint="Operational groups" />
        <MetricCard
          label="Creative leads"
          value={String(creative.length)}
          hint="Mangaka and editors"
        />
        <MetricCard label="Assistants" value={String(assistants.length)} hint="Task executors" />
        <MetricCard
          label="Task assignment"
          value="readonly"
          hint="Admin does not assign production work here"
        />
      </section>

      <Panel
        title="Studio register"
        description="Actions are inspect-only until backend callbacks exist."
      >
        <p className="mb-4 text-xs text-[var(--admin-faint)]">
          Hardcoded demo data. No backend model for studio management in MVP.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Studio</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Active series</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studios.map((studio) => (
              <TableRow key={studio.id}>
                <TableCell>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Building2 className="size-4 text-[var(--admin-faint)]" />
                    {studio.name}
                  </p>
                  <p className="text-[11px] text-[var(--admin-faint)]">{studio.id}</p>
                </TableCell>
                <TableCell className="text-xs text-[var(--admin-faint)]">{studio.owner}</TableCell>
                <TableCell className="text-xs">
                  {studio.id === "studio-main" ? users.length - 5 : 5}
                </TableCell>
                <TableCell className="text-xs">{studio.activeSeries}</TableCell>
                <TableCell>
                  <StatusPill status={studio.status.toLowerCase()} />
                </TableCell>
                <TableCell className="text-right">
                  <TextButton>
                    <ShieldCheck className="size-3.5" />
                    Inspect
                  </TextButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <Panel title="Team member scopes">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Series access</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.slice(0, 8).map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Users className="size-4 text-[var(--admin-faint)]" />
                    {user.name}
                  </p>
                  <p className="text-[11px] text-[var(--admin-faint)]">{user.email}</p>
                </TableCell>
                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell>
                  <ScopeBadge scope={user.scope} />
                </TableCell>
                <TableCell className="text-xs text-[var(--admin-faint)]">
                  {user.assignedSeries} assigned series
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}
