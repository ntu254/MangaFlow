import { createFileRoute } from "@tanstack/react-router";
import { currentUserByRole } from "@/entities";
import { useRole } from "@/shared/lib/role";
import { canManageTeam } from "@/shared/lib/permissions";
import { logAudit } from "@/shared/lib/audit";
import { notify } from "@/shared/lib/notifications";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  useSeriesSummary,
  useUpdateSeriesMember,
  useRemoveSeriesMember,
} from "@/shared/queries/useSeries";
import {
  Search,
  MoreVertical,
  CheckCircle2,
  Clock,
  Users,
  UserPlus,
  ShieldAlert,
  Send,
  AlertCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";

export const Route = createFileRoute("/app/series/$id/team")({
  component: TeamPage,
});

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600 border-emerald-200",
  "pending invite": "bg-orange-50 text-orange-600 border-orange-200",
  paused: "bg-slate-100 text-slate-500 border-slate-200",
  removed: "bg-red-50 text-red-500 border-red-200",
};

function TeamPage() {
  const { id } = Route.useParams();
  const { data: summary, isLoading } = useSeriesSummary(id);
  const { role } = useRole();
  const me = currentUserByRole[role];
  const perm = canManageTeam(role);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [filter, setFilter] = useState<"All" | "Active" | "Pending" | "Paused" | "Removed">("All");

  const [dialogConfig, setDialogConfig] = useState<{
    open: boolean;
    memberId: string | null;
  }>({
    open: false,
    memberId: null,
  });

  const updateMember = useUpdateSeriesMember(id);
  const removeMember = useRemoveSeriesMember(id);

  if (isLoading || !summary) {
    return <div className="p-8 text-center text-foreground/50 text-sm">Loading team...</div>;
  }

  const members = summary.members || [];

  const mappedMembers = members.map((m: any) => ({
    ...m,
    status: m.status ? m.status.toLowerCase() : m.isActive ? "active" : "paused",
  }));

  const activeMembers = mappedMembers.filter((m: any) => m.status === "active");

  const filteredMembers = mappedMembers.filter((m: any) => {
    if (filter === "All") return true;
    return m.status === filter.toLowerCase();
  });

  function setStatus(memberId: string, status: string, type: string) {
    if (status === "removed") {
      setDialogConfig({ open: true, memberId });
    } else {
      updateMember.mutate({ memberId, status: status.toUpperCase() });
    }
  }

  // Mock pending invites for UI realism since backend doesn't explicitly store "pending invites" as members
  const pendingInvites = [
    {
      email: "a.yamamoto@example.com",
      role: "Background Assistant",
      date: "May 17, 2025 11:32 AM",
      status: "PENDING",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_320px]">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* Main List Container */}
          <div className="rounded-xl border border-border bg-card shadow-sm mt-6">
            {/* Header */}
            <div className="border-b border-border p-6 pb-5">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Production Team</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Manage assistant eligibility and collaboration for this series.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search team member"
                    className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex rounded-md border border-border bg-background p-0.5">
                  {["All", "Active", "Pending", "Paused", "Removed"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f as any)}
                      className={`px-3 py-1.5 text-[12px] font-medium rounded-sm transition-colors ${
                        filter === f
                          ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <select className="h-9 rounded-md border border-border bg-background px-3 py-1 text-[13px] font-medium text-foreground outline-none">
                    <option>Last active</option>
                    <option>Name (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <tr className="border-y border-border">
                    <th className="px-6 py-3 font-medium">User Info</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Activity</th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMembers.map((m: any) => {
                    const user = m.user || { name: "Unknown User", email: "unknown@example.com" };
                    let statusLabel = m.status.toUpperCase();
                    const initials = user.name.substring(0, 2).toUpperCase();

                    return (
                      <tr key={m.id} className="transition-colors hover:bg-muted/30 group">
                        {/* User Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground text-[14px] leading-tight">
                                {user.name}
                              </span>
                              <span className="text-[12px] text-muted-foreground mt-0.5">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-4 align-middle">
                          <span className="text-[13px] font-medium text-foreground">
                            {m.role === "ASSISTANT"
                              ? "Assistant"
                              : m.role === "EDITOR"
                                ? "Editor"
                                : m.role === "MANGAKA"
                                  ? "Mangaka"
                                  : m.role || "Unknown Role"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 align-middle">
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                              statusStyles[statusLabel.toLowerCase()] || statusStyles.active
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </td>

                        {/* Time */}
                        <td className="px-4 py-4 align-middle">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] font-medium text-foreground">
                              {m.joinedAt
                                ? new Date(m.joinedAt).toLocaleDateString()
                                : m.createdAt
                                  ? new Date(m.createdAt).toLocaleDateString()
                                  : "Unknown"}
                            </span>
                            <span className="text-[11px] text-muted-foreground">Joined At</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            {m.status === "active" && (
                              <button className="rounded-md border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground shadow-sm hover:bg-muted">
                                View profile
                              </button>
                            )}
                            {m.status === "paused" && (
                              <button
                                onClick={() =>
                                  setStatus(m.id, "active", "SERIES_MEMBER_REACTIVATED")
                                }
                                className="rounded-md border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground shadow-sm hover:bg-muted"
                              >
                                Reactivate
                              </button>
                            )}
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {openMenuId === m.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setOpenMenuId(null)}
                                  />
                                  <div className="absolute right-0 top-9 z-50 w-40 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in zoom-in-95">
                                    {m.status !== "paused" && (
                                      <button
                                        className="flex w-full items-center rounded-sm px-2 py-1.5 text-[13px] hover:bg-accent hover:text-accent-foreground"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          setStatus(m.id, "paused", "SERIES_MEMBER_PAUSED");
                                        }}
                                      >
                                        Pause member
                                      </button>
                                    )}
                                    <button
                                      className="flex w-full items-center rounded-sm px-2 py-1.5 text-[13px] text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setStatus(m.id, "removed", "SERIES_MEMBER_REMOVED");
                                      }}
                                    >
                                      Remove member
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {pendingInvites
                    .filter(() => filter === "All" || filter === "Pending")
                    .map((inv, i) => {
                      const nameParts = inv.email.split("@")[0].split(".");
                      const generatedName = nameParts
                        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                        .join(" ");

                      return (
                        <tr key={`inv_${i}`} className="transition-colors hover:bg-muted/30 group">
                          {/* User Info */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
                                {generatedName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground text-[14px] leading-tight">
                                  {generatedName}
                                </span>
                                <span className="text-[12px] text-muted-foreground mt-0.5">
                                  {inv.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-4 py-4 align-middle">
                            <span className="text-[13px] font-medium text-foreground">
                              {inv.role}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 align-middle">
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide ${statusStyles["pending invite"]}`}
                            >
                              PENDING INVITE
                            </span>
                          </td>

                          {/* Time */}
                          <td className="px-4 py-4 align-middle">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[13px] font-medium text-foreground">
                                {inv.date}
                              </span>
                              <span className="text-[11px] text-muted-foreground">Invite sent</span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 align-middle text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="rounded-md border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground shadow-sm hover:bg-muted">
                                Resend
                              </button>
                              <button className="rounded-md border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground shadow-sm hover:bg-muted">
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>

              {filteredMembers.length === 0 &&
                ((filter !== "All" && filter !== "Pending") || pendingInvites.length === 0) && (
                  <div className="p-12 text-center text-sm text-muted-foreground border-t border-border">
                    No members found matching this filter.
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (SIDEBAR) */}
        <div className="flex flex-col gap-6 mt-6">
          {/* Quick Invite */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-foreground">Quick Invite</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Email / user search"
                className="h-9 w-full rounded-md border border-[#E5DFD3] bg-[#F5EFE6] px-3 text-[13px] text-foreground placeholder:text-[#A39B8B] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-border dark:bg-muted/50"
              />
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Role
                  </label>
                  <select className="h-9 w-full rounded-md border border-[#E5DFD3] bg-[#F5EFE6] px-2 text-[13px] text-foreground focus:outline-none dark:border-border dark:bg-muted/50">
                    <option>Assistant</option>
                  </select>
                </div>
                <button className="flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900">
                  Send Invite
                </button>
              </div>
            </div>
          </div>

          {/* Team Summary */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-foreground">Team Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Users className="h-4 w-4 text-blue-500" /> Active members
                </div>
                <span className="mt-1 text-2xl font-black text-foreground">
                  {activeMembers.length}
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <UserPlus className="h-4 w-4 text-orange-500" /> Pending invites
                </div>
                <span className="mt-1 text-2xl font-black text-foreground">
                  {pendingInvites.length}
                </span>
              </div>
            </div>
          </div>

          {/* Eligibility Rules */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 font-bold text-foreground">Eligibility Rules</h3>
            <ul className="space-y-2 text-[13px] text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400"></span>
                <span>Only active assistants in this series can be assigned tasks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400"></span>
                <span>Team membership does not automatically grant access to all pages.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400"></span>
                <span>Assistants only see tasks assigned to them.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <AlertDialog
        open={dialogConfig.open}
        onOpenChange={(open) =>
          setDialogConfig({ open, memberId: open ? dialogConfig.memberId : null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member? They will lose access to the series.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (dialogConfig.memberId) removeMember.mutate(dialogConfig.memberId);
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
