import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  X,
  UserPlus,
  MoreHorizontal,
  Crown,
  PenLine,
  Users,
  ClipboardList,
  Mail,
  ShieldCheck,
  Ban,
  Eye,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  UserCheck,
  ChevronRight,
} from "lucide-react";
import { apiRequest } from "@/shared/api/client";
import { useAuth, findUserById } from "@/shared/auth";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import { isTaskActive, type StudioTask } from "@/entities/series/model/studio-types";
import { StatCard } from "@/shared/ui/stat-card";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSeriesMembersQuery,
  useInviteAssistantMutation,
  useRemoveMemberMutation,
  useUpdateMemberMutation,
  useTantouEditorQuery,
  useAssignEditorMutation,
  useRemoveEditorMutation,
  useStudioTasksQuery,
  mapApiError,
  seriesKeys,
  type DbMember,
  type TantouEditor,
} from "../../api/series-queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/cn";

// ---------- helpers ----------

type Scope = "OWNER" | "FULL SERIES" | "TASK ONLY" | "READ ONLY";
type MemberKind = "MANGAKA" | "EDITOR" | "ASSISTANT" | "TASK-ONLY";
type Risk = "Low" | "Medium" | "High";
type Presence = "Online" | "Away" | "Offline";

type MemberRow = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  kind: MemberKind;
  scope: Scope;
  active: number;
  pending: number;
  revision: number;
  completed: number;
  done: number;
  risk: Risk;
  lastActive: string;
  presence: Presence;
  joined: string;
  load: number; // 0..100
  hasProductionTasks?: boolean;
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function emptyMetrics(joined = "—") {
  return {
    active: 0,
    pending: 0,
    revision: 0,
    done: 0,
    completed: 0,
    risk: "Low" as Risk,
    lastActive: "—",
    presence: "Offline" as Presence,
    joined,
    load: 0,
  };
}

function ownerOf(series: ProductionSeries): MemberRow {
  const m = emptyMetrics();
  return {
    ...m,
    id: series.authorId,
    name: series.authorName,
    email: "—",
    kind: "MANGAKA",
    scope: "OWNER",
    presence: "Online",
  };
}

function editorOf(series: ProductionSeries, tantouEditor?: TantouEditor | null): MemberRow | null {
  const editorId = tantouEditor?.userId ?? series.editorId;
  const editorName = tantouEditor?.userName ?? series.editorName;
  if (!editorId || !editorName) return null;
  const m = emptyMetrics(
    tantouEditor?.joinedAt ? new Date(tantouEditor.joinedAt).toLocaleDateString("en-US") : "—",
  );
  return {
    ...m,
    id: tantouEditor?.id ?? `editor-${series.id}`,
    name: editorName,
    email: tantouEditor?.userEmail ?? "—",
    kind: "EDITOR",
    scope: "FULL SERIES",
    presence: "Online",
  };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// ---------- pills ----------

function RolePill({ kind }: { kind: MemberKind }) {
  const map: Record<MemberKind, string> = {
    MANGAKA: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    EDITOR: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    ASSISTANT: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    "TASK-ONLY": "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        map[kind],
      )}
    >
      {kind}
    </span>
  );
}

function ScopePill({ scope }: { scope: Scope }) {
  const map: Record<Scope, string> = {
    OWNER: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 font-bold",
    "FULL SERIES": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    "TASK ONLY": "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
    "READ ONLY": "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-semibold tracking-wider",
        map[scope],
      )}
    >
      {scope}
    </span>
  );
}

function RiskDot({ risk }: { risk: Risk }) {
  const color =
    risk === "High" ? "bg-rose-500" : risk === "Medium" ? "bg-amber-500" : "bg-emerald-500";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={cn("size-2 rounded-full", color)} /> {risk}
    </span>
  );
}

function PresenceDot({ presence }: { presence: Presence }) {
  const color =
    presence === "Online"
      ? "bg-emerald-500"
      : presence === "Away"
        ? "bg-amber-500"
        : "bg-slate-400";
  return <span className={cn("size-2 rounded-full ring-2 ring-background", color)} />;
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const h = hash(name);
  const hues = [
    "bg-primary/10 text-primary border-primary/20",
    "bg-purple-500/10 text-purple-600 border-purple-500/20",
    "bg-sky-500/10 text-sky-600 border-sky-500/20",
    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    "bg-amber-500/10 text-amber-600 border-amber-500/20",
  ];
  const style = hues[h % hues.length];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border font-bold text-[11px]",
        style,
      )}
      style={{ width: size, height: size }}
    >
      {initials(name)}
    </span>
  );
}

// ---------- main ----------

export function TeamPanel({ series, chapters }: { series: ProductionSeries; chapters: Chapter[] }) {
  const user = useAuth((s) => s.user);
  const isMangakaOwner = !!user && user.role === "mangaka" && user.id === series.authorId;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [scopeDraft, setScopeDraft] = useState<string>("");
  const [assignEditorOpen, setAssignEditorOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteScope, setInviteScope] = useState<"Full chapter" | "Task only" | "Read only">(
    "Full chapter",
  );

  const { data: dbMembers = [] } = useSeriesMembersQuery(series.id);
  const { data: tantouEditor } = useTantouEditorQuery(series.id);
  const { data: seriesTasks = [] } = useStudioTasksQuery({ seriesId: series.id });
  const isAssignedTantou =
    !!user &&
    user.role === "editor" &&
    (user.id === series.editorId || user.id === tantouEditor?.userId);
  const canEdit = isMangakaOwner || isAssignedTantou;
  const assignEditor = useAssignEditorMutation(series.id);
  const removeEditor = useRemoveEditorMutation(series.id);

  const inviteAssistant = useInviteAssistantMutation(series.id);
  const removeMember = useRemoveMemberMutation(series.id, editingMemberId ?? selectedId ?? "");
  const updateMember = useUpdateMemberMutation(series.id, editingMemberId ?? selectedId ?? "");

  const handleRemoveAssistant = async (memberId: string, name: string) => {
    try {
      await removeMember.mutateAsync();
      toast.success(`Deactivated ${name}.`);
      setSelectedId(null);
    } catch (err) {
      toast.error(mapApiError(err));
    }
  };

  const closeInvite = () => {
    setInviteOpen(false);
    setInviteEmail("");
    setInviteScope("Full chapter");
  };

  const handleInviteAssistant = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email.");
      return;
    }
    try {
      await inviteAssistant.mutateAsync({ email, scope: inviteScope });
      toast.success("Assistant invited.");
      closeInvite();
    } catch (err) {
      toast.error(mapApiError(err));
    }
  };

  const handleUpdateScope = async (memberId: string, scope: string) => {
    try {
      await updateMember.mutateAsync({ scope });
      toast.success("Scope updated.");
      setEditingMemberId(null);
    } catch (err) {
      toast.error(mapApiError(err));
    }
  };

  const queryClient = useQueryClient();

  const handleRevokeInvite = async (memberId: string, email: string) => {
    try {
      await apiRequest(`/series/${series.id}/members/${memberId}`, { method: "DELETE" });
      toast.success(`Revoked invitation for ${email}.`);
      queryClient.invalidateQueries({ queryKey: seriesKeys.members(series.id) });
    } catch (err) {
      toast.error(mapApiError(err));
    }
  };

  const pendingInvites = useMemo(() => {
    return dbMembers.filter(
      (dbM) =>
        dbM.role !== "editor" &&
        (dbM.status === "invited" ||
          dbM.status === "pending" ||
          dbM.status === "INVITED" ||
          dbM.status === "PENDING"),
    );
  }, [dbMembers]);

  const members: MemberRow[] = useMemo(() => {
    const editor = editorOf(series, tantouEditor);
    const list: MemberRow[] = [ownerOf(series), ...(editor ? [editor] : [])];
    const busyIds = new Set(
      seriesTasks
        .filter((t: StudioTask) => t.assigneeId && isTaskActive(t.status))
        .map((t: StudioTask) => t.assigneeId),
    );
    dbMembers.forEach((dbM: DbMember) => {
      if (dbM.role === "editor" || dbM.status !== "active") return;
      const u = findUserById(dbM.userId);
      const role = String(dbM.userRole ?? u?.role ?? dbM.role).toUpperCase();
      const name = dbM.userName ?? u?.name ?? dbM.userId;
      const email = dbM.userEmail ?? u?.email ?? "—";

      const mappedScope: Scope =
        dbM.accessScope === "FULL_SERIES" ||
        dbM.scope === "Full chapter" ||
        dbM.scope === "full_series" ||
        dbM.scope === "FULL_SERIES"
          ? "FULL SERIES"
          : dbM.accessScope === "TASK_ONLY" ||
              dbM.scope === "Task only" ||
              dbM.scope === "TASK_ONLY" ||
              dbM.scope === "TASK ONLY"
            ? "TASK ONLY"
            : "READ ONLY";

      const kind: MemberKind = role === "ASSISTANT" ? "ASSISTANT" : "TASK-ONLY";
      const m = emptyMetrics(
        dbM.createdAt ? new Date(dbM.createdAt).toLocaleDateString("en-US") : "—",
      );
      list.push({
        id: dbM.id,
        name,
        email,
        avatar: u?.avatar,
        kind,
        scope: mappedScope,
        hasProductionTasks: busyIds.has(dbM.userId),
        ...m,
      });
    });
    return list;
  }, [series, dbMembers, tantouEditor, seriesTasks]);

  const assistantsList = members.filter((m) => m.kind === "ASSISTANT");
  const taskOnlyList = members.filter((m) => m.kind === "TASK-ONLY");

  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(members.length / pageSize));
  const pageRows = members.slice((page - 1) * pageSize, page * pageSize);

  const selected = selectedId ? (members.find((m) => m.id === selectedId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        {/* Executive Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight text-foreground font-serif">
                Studio Crew & Team Roster
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage roles, assistant task scopes, and production capacity for {series.title}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canEdit || isMangakaOwner ? (
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-2xs hover:opacity-95 transition-all"
              >
                <UserPlus className="size-4" /> Invite Assistant
              </button>
            ) : null}
          </div>
        </div>

        {/* SaaS KPI Cards Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={<Crown className="size-4 text-amber-500" />}
            tone="amber"
            label="Mangaka / Author"
            value={1}
            hint={series.authorName}
            trailing={<ScopePill scope="OWNER" />}
          />
          <StatCard
            icon={<PenLine className="size-4 text-indigo-500" />}
            tone="blue"
            label="Tantou Editor"
            value={tantouEditor ? 1 : 0}
            hint={tantouEditor?.userName ?? "Not assigned"}
            trailing={
              isMangakaOwner ? (
                <button
                  type="button"
                  onClick={() => setAssignEditorOpen(true)}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  {tantouEditor ? "Change" : "Assign"}
                </button>
              ) : (
                <ScopePill scope="FULL SERIES" />
              )
            }
          />
          <StatCard
            icon={<Users className="size-4 text-emerald-500" />}
            tone="emerald"
            label="Active Assistants"
            value={assistantsList.length}
            hint={`${assistantsList.length} registered crew`}
          />
          <StatCard
            icon={<Mail className="size-4 text-amber-500" />}
            tone="amber"
            label="Pending Invites"
            value={pendingInvites.length}
            hint={pendingInvites.length > 0 ? "Awaiting acceptance" : "All invites accepted"}
          />
        </div>

        {/* Pending Assistant Invitations Banner / Card Section */}
        {pendingInvites.length > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Pending Assistant Invitations ({pendingInvites.length})
                </h3>
              </div>
              <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                Awaiting Assistant Acceptance
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingInvites.map((inv) => {
                const displayEmail = inv.userEmail || inv.userName || inv.userId;
                const scope = inv.accessScope || inv.scope || "Full Chapter";
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-xl border border-amber-500/25 bg-card/90 p-3.5 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs">
                        <Mail className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">{displayEmail}</p>
                        <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 flex items-center gap-1 mt-0.5">
                          <span className="inline-block size-1.5 rounded-full bg-amber-500 animate-ping" />
                          Invited • Scope: {scope}
                        </p>
                      </div>
                    </div>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRevokeInvite(inv.id, displayEmail)}
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all shrink-0 ml-2"
                        title="Revoke / Cancel Invitation"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Team Roster Table Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Official Roster Directory ({members.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-left font-bold">Member Name</th>
                  <th className="px-3 py-3 text-left font-bold">Role</th>
                  <th className="px-3 py-3 text-left font-bold">Access Scope</th>
                  <th className="px-3 py-3 text-right font-bold">Active Tasks</th>
                  <th className="px-3 py-3 text-right font-bold">Pending</th>
                  <th className="px-3 py-3 text-right font-bold">Completed</th>
                  <th className="px-3 py-3 text-left font-bold">Deadline Risk</th>
                  <th className="px-3 py-3 text-left font-bold">Last Active</th>
                  <th className="px-3 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {pageRows.map((m) => {
                  const isSel = selectedId === m.id;
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedId(m.id)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-muted/40",
                        isSel ? "bg-primary/5" : "",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={m.name} size={34} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{m.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <RolePill kind={m.kind} />
                      </td>
                      <td className="px-3 py-3">
                        <ScopePill scope={m.scope} />
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold text-foreground">
                        {m.active}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                        {m.pending}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                        {m.completed}
                      </td>
                      <td className="px-3 py-3">
                        <RiskDot risk={m.risk} />
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{m.lastActive}</td>
                      <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex size-7 items-center justify-center rounded-lg border border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground shadow-2xs transition-all"
                              aria-label="Member Action Menu"
                            >
                              <MoreHorizontal className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setSelectedId(m.id)}>
                              <Eye className="size-4 text-primary" /> View Details
                            </DropdownMenuItem>
                            {canEdit && m.kind !== "MANGAKA" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingMemberId(m.id);
                                  setScopeDraft(
                                    m.scope === "FULL SERIES"
                                      ? "Full chapter"
                                      : m.scope === "TASK ONLY"
                                        ? "Task only"
                                        : "Read only",
                                  );
                                }}
                              >
                                <ShieldCheck className="size-4 text-sky-500" /> Change Scope
                              </DropdownMenuItem>
                            )}
                            {canEdit && m.kind === "ASSISTANT" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={m.hasProductionTasks}
                                  onClick={() => handleRemoveAssistant(m.id, m.name)}
                                  className="text-rose-600 dark:text-rose-400 focus:bg-rose-500/10 focus:text-rose-600"
                                >
                                  <Ban className="size-4" /> Deactivate Crew
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <span>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, members.length)} of{" "}
              {members.length} members
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-40 shadow-2xs transition-all"
              >
                ‹ Prev
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "min-w-7 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-2xs transition-all",
                    p === page
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-muted",
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-40 shadow-2xs transition-all"
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Member Detail Modal Dialog */}
      <MemberDetailModal
        member={selected}
        chapters={chapters}
        canEdit={canEdit}
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        onRemove={() => {
          if (selected) handleRemoveAssistant(selected.id, selected.name);
        }}
        onEditScope={(id) => {
          if (!selected) return;
          setEditingMemberId(id);
          setScopeDraft(
            selected.scope === "FULL SERIES"
              ? "Full chapter"
              : selected.scope === "TASK ONLY"
                ? "Task only"
                : "Read only",
          );
        }}
      />

      {/* Glassmorphic Invite Assistant Modal Dialog */}
      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={closeInvite}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border/80 bg-card p-6 shadow-xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Invite Assistant to Studio</h3>
              </div>
              <button
                type="button"
                onClick={closeInvite}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
              Enter the email address of an existing assistant user. Only accounts with the{" "}
              <b className="text-foreground">assistant</b> role can be invited.
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </label>
                <input
                  type="email"
                  autoFocus
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !inviteAssistant.isPending) handleInviteAssistant();
                  }}
                  placeholder="assistant@studio.jp"
                  className="w-full rounded-xl border border-border/80 bg-background/60 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Access Scope & Rights
                </label>
                <select
                  value={inviteScope}
                  onChange={(e) =>
                    setInviteScope(e.target.value as "Full chapter" | "Task only" | "Read only")
                  }
                  className="w-full rounded-xl border border-border/80 bg-background/60 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Full chapter">Full chapter (View & work on all tasks)</option>
                  <option value="Task only">Task only (Assigned tasks only)</option>
                  <option value="Read only">Read only (View materials only)</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-border/60 pt-4">
              <button
                type="button"
                onClick={closeInvite}
                className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInviteAssistant}
                disabled={inviteAssistant.isPending || inviteEmail.trim().length === 0}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-2xs hover:opacity-95 disabled:opacity-50"
              >
                {inviteAssistant.isPending ? "Inviting..." : "Send Invitation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scope Edit Dialog */}
      {editingMemberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-card p-6 shadow-xl backdrop-blur-md">
            <h3 className="mb-2 text-sm font-bold text-foreground">Change Member Access Scope</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Adjust workspace permissions for this assistant.
            </p>
            <select
              value={scopeDraft}
              onChange={(e) => setScopeDraft(e.target.value)}
              className="mb-4 w-full rounded-xl border border-border/80 bg-background/60 px-3 py-2 text-xs"
            >
              <option value="Full chapter">Full chapter</option>
              <option value="Task only">Task only</option>
              <option value="Read only">Read only</option>
            </select>
            <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
              <button
                type="button"
                onClick={() => setEditingMemberId(null)}
                className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateScope(editingMemberId, scopeDraft)}
                disabled={updateMember.isPending}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-2xs hover:opacity-95 disabled:opacity-50"
              >
                {updateMember.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Tantou Editor Dialog */}
      {assignEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-card p-6 shadow-xl backdrop-blur-md">
            <h3 className="mb-2 text-sm font-bold text-foreground">
              {tantouEditor ? "Change Tantou Editor" : "Assign Tantou Editor"}
            </h3>
            {tantouEditor ? (
              <div className="mb-4 rounded-xl border border-border/70 bg-muted/30 p-3.5">
                <p className="text-[11px] text-muted-foreground">Currently assigned Editor:</p>
                <p className="mt-1 text-xs font-bold text-foreground">{tantouEditor.userName}</p>
                <p className="text-[11px] text-muted-foreground">{tantouEditor.userEmail}</p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await removeEditor.mutateAsync();
                      toast.success("Tantou Editor removed.");
                      setAssignEditorOpen(false);
                    } catch (err) {
                      toast.error(mapApiError(err));
                    }
                  }}
                  disabled={removeEditor.isPending}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-50"
                >
                  <Ban className="size-3" /> Remove Assigned Editor
                </button>
              </div>
            ) : (
              <p className="mb-4 text-xs text-muted-foreground">
                No Tantou Editor assigned. Select an editor from the directory below.
              </p>
            )}
            <div className="mb-4">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Select Tantou Editor
              </label>
              <select
                id="assign-editor-select"
                className="w-full rounded-xl border border-border/80 bg-background/60 px-3 py-2 text-xs"
              >
                <option value="">-- Select Editor --</option>
                <option value="u-editor">Tanaka Akira</option>
                <option value="u-mobile-editor">Mobile Editor</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
              <button
                type="button"
                onClick={() => setAssignEditorOpen(false)}
                className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const select = document.getElementById(
                    "assign-editor-select",
                  ) as HTMLSelectElement;
                  const editorId = select?.value;
                  if (!editorId) {
                    toast.error("Please select an editor.");
                    return;
                  }
                  try {
                    await assignEditor.mutateAsync({ editorId });
                    toast.success("Tantou Editor assigned.");
                    setAssignEditorOpen(false);
                  } catch (err) {
                    toast.error(mapApiError(err));
                  }
                }}
                disabled={assignEditor.isPending}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-2xs hover:opacity-95 disabled:opacity-50"
              >
                {assignEditor.isPending ? "Saving..." : "Assign Editor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xs font-extrabold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function MemberDetailModal({
  member,
  chapters,
  canEdit,
  open,
  onClose,
  onRemove,
  onEditScope,
}: {
  member: MemberRow | null;
  chapters: Chapter[];
  canEdit: boolean;
  open: boolean;
  onClose: () => void;
  onRemove: () => void;
  onEditScope?: (id: string) => void;
}) {
  const tasks = useMemo(() => {
    if (!member) return [];
    return chapters.slice(0, 3).map((c, i) => ({
      id: c.id,
      title: `Ch. ${String(c.number).padStart(3, "0")} – ${c.title}`,
      due: c.draftDueAt ?? c.reviewDueAt ?? c.plannedAt ?? "",
      status: ["IN PROGRESS", "IN REVIEW", "PENDING"][i % 3],
      risk: ["Medium", "Low", "Low"][i % 3] as Risk,
    }));
  }, [chapters, member]);

  if (!member) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <Avatar name={member.name} size={40} />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-bold text-foreground font-serif">
                {member.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate">
                {member.email}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <RolePill kind={member.kind} />
            <ScopePill scope={member.scope} />
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <PresenceDot presence={member.presence} /> {member.presence}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">Joined studio: {member.joined}</p>

          <div className="grid grid-cols-4 gap-2 text-center">
            <MiniStat value={member.active} label="Active" />
            <MiniStat value={member.pending} label="Pending" />
            <MiniStat value={member.revision} label="Revision" />
            <MiniStat value={member.completed} label="Done" />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-muted-foreground">Capacity Allocation</span>
              <span className="font-bold text-primary">{member.load}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${member.load}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 border-t border-border/60 pt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Assigned Tasks & Contributions
            </p>
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {tasks.length === 0 ? (
                <li className="text-xs text-muted-foreground">No assigned tasks found.</li>
              ) : (
                tasks.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-xl border border-border/70 bg-background/60 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-foreground">{t.title}</p>
                      <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                        {t.status}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{t.due ? new Date(t.due).toLocaleDateString("en-US") : "—"}</span>
                      <RiskDot risk={t.risk} />
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/60 pt-4 mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {canEdit && member.kind !== "MANGAKA" ? (
              <button
                type="button"
                onClick={() => onEditScope?.(member.id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-2xs hover:opacity-95 transition-all"
              >
                <ShieldCheck className="size-4" /> Change Scope
              </button>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted shadow-2xs transition-all"
                >
                  <MoreHorizontal className="size-4" /> Actions
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => toast.info(`Direct message to ${member.name}`)}>
                  <Mail className="size-4 text-sky-500" /> Send Message
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => toast.info(`Viewing all tasks for ${member.name}`)}
                >
                  <Eye className="size-4 text-primary" /> View Assigned Tasks
                </DropdownMenuItem>
                {canEdit && member.kind === "ASSISTANT" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={member.hasProductionTasks}
                      onClick={onRemove}
                      className="text-rose-600 dark:text-rose-400 focus:bg-rose-500/10 focus:text-rose-600"
                    >
                      <Ban className="size-4" /> Deactivate Member
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted transition-all"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/50 p-2">
      <p className="text-xs font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
