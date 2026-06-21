import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Crown, Loader2, Plus, Power, PowerOff, ShieldCheck } from "lucide-react";
import { PageHeader, StatCard } from "@/layouts/AppShell";
import {
  useAddBoardMember,
  useBoardMembers,
  useSetBoardChair,
  useUpdateBoardMemberStatus,
  useUsers,
} from "@/shared/queries/useUsers";
import type { AdminBoardMember, AdminUser } from "@/shared/api";

export const Route = createFileRoute("/app/admin/board-members")({
  component: BoardMembersPage,
});

function BoardMembersPage() {
  const { data: users = [], isLoading: isUsersLoading } = useUsers();
  const { data: members = [], isLoading: isMembersLoading, error } = useBoardMembers();
  const addMember = useAddBoardMember();
  const updateStatus = useUpdateBoardMemberStatus();
  const setChair = useSetBoardChair();
  const [selectedUserId, setSelectedUserId] = useState("");

  const memberIds = useMemo(() => new Set(members.map((member) => member.userId)), [members]);
  const candidates = useMemo(
    () => users.filter((user) => user.role === "BOARD" && user.isActive && !memberIds.has(user.id)),
    [users, memberIds],
  );
  const activeMembers = members.filter((member) => member.isActive && member.isUserActive).length;
  const chair = members.find((member) => member.isChair);
  const isLoading = isUsersLoading || isMembersLoading;
  const isMutating = addMember.isPending || updateStatus.isPending || setChair.isPending;

  function addSelectedMember() {
    if (!selectedUserId) return;
    addMember.mutate(selectedUserId, { onSuccess: () => setSelectedUserId("") });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Board Members"
        jp="Board access"
        description="Add or remove Board members, grant voting permission, and set the active Board Chair."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Configured members" value={String(members.length)} />
        <StatCard label="Active voting seats" value={String(activeMembers)} />
        <StatCard label="Board Chair" value={chair?.name || "Not assigned"} hint={chair?.email} />
      </div>

      <div className="rounded-md border border-foreground/10 bg-card">
        <div className="flex flex-col gap-3 border-b border-foreground/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold">Assign board permission</div>
            <div className="text-xs text-foreground/55">
              A user must have role BOARD, active account status, and active Board membership.
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              disabled={isLoading || addMember.isPending || candidates.length === 0}
              className="h-8 min-w-[240px] rounded-md border border-foreground/15 bg-background px-2 text-xs disabled:opacity-50"
            >
              <option value="">
                {candidates.length === 0 ? "No eligible BOARD users" : "Select BOARD user"}
              </option>
              {candidates.map((user) => (
                <option key={user.id} value={user.id}>
                  {labelUser(user)}
                </option>
              ))}
            </select>
            <button
              onClick={addSelectedMember}
              disabled={!selectedUserId || addMember.isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add member
            </button>
          </div>
        </div>

        {error && (
          <div className="border-b border-destructive/20 bg-destructive/5 px-4 py-2 text-xs text-destructive">
            {(error as Error).message}
          </div>
        )}

        <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr_auto] gap-3 border-b border-foreground/10 bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground/55">
          <span>Member</span>
          <span>Email</span>
          <span>User status</span>
          <span>Board permission</span>
          <span />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-foreground/50">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : members.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-foreground/50">
            No Board members configured yet.
          </div>
        ) : (
          members.map((member) => (
            <BoardMemberRow
              key={member.userId}
              member={member}
              disabled={isMutating}
              onToggle={() =>
                updateStatus.mutate({ userId: member.userId, isActive: !member.isActive })
              }
              onSetChair={() => setChair.mutate(member.userId)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function BoardMemberRow({
  member,
  disabled,
  onToggle,
  onSetChair,
}: {
  member: AdminBoardMember;
  disabled: boolean;
  onToggle: () => void;
  onSetChair: () => void;
}) {
  return (
    <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr_auto] items-center gap-3 border-b border-foreground/5 px-4 py-3 text-[13px] last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
          {initials(member.name || member.email || "B")}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-medium">
            <span className="truncate">{member.name || "Unnamed Board member"}</span>
            {member.isChair && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-300">
                <Crown className="h-3 w-3" />
                Chair
              </span>
            )}
          </div>
          <div className="text-[11px] text-foreground/50">{member.userId}</div>
        </div>
      </div>
      <span className="truncate text-foreground/70">{member.email || "-"}</span>
      <StatusDot active={member.isUserActive} activeLabel="Active" inactiveLabel="Suspended" />
      <StatusDot active={member.isActive} activeLabel="Granted" inactiveLabel="Removed" />
      <div className="flex justify-end gap-1.5">
        <button
          onClick={onSetChair}
          disabled={disabled || member.isChair || !member.isActive || !member.isUserActive}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-foreground/10 px-2 text-xs text-foreground/70 hover:text-foreground disabled:opacity-40"
        >
          <Crown className="h-3.5 w-3.5" />
          Set chair
        </button>
        <button
          onClick={onToggle}
          disabled={disabled || member.isChair}
          title={member.isActive ? "Remove member" : "Restore member"}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-foreground/10 px-2 text-xs text-foreground/70 hover:text-foreground disabled:opacity-40"
        >
          {member.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
          {member.isActive ? "Remove" : "Restore"}
        </button>
      </div>
    </div>
  );
}

function StatusDot({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 text-xs " +
        (active ? "text-emerald-500" : "text-foreground/40")
      }
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

function labelUser(user: AdminUser) {
  return `${user.name || user.email} (${user.email})`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
