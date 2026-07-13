import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  X,
  Plus,
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
} from "lucide-react";
import { useAuth, ASSISTANTS, findUserById, type User as AppUser } from "@/shared/auth";
import type { Role } from "@/shared/auth";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import { StatCard } from "@/shared/ui/stat-card";
import {
  useSeriesMembersQuery,
  useAddMemberMutation,
  useInviteAssistantMutation,
  useRemoveMemberMutation,
  useUpdateMemberMutation,
  useTantouEditorQuery,
  useAssignEditorMutation,
  useRemoveEditorMutation,
  mapApiError,
  type DbMember,
  type TantouEditor,
} from "../../api/series-queries";

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
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const PRESENCES: Presence[] = ["Online", "Away", "Offline"];
const RISKS: Risk[] = ["Low", "Medium", "High"];
const LAST_ACTIVE = [
  "Today 09:21",
  "Today 08:47",
  "Today 09:10",
  "Today 08:59",
  "Yesterday 22:31",
  "Today 07:45",
  "2 days ago",
  "3 days ago",
];

function mockMetrics(id: string, kind: MemberKind) {
  const h = hash(id);
  const isOwner = kind === "MANGAKA";
  const active = isOwner ? 0 : (h % 13) + 1;
  const pending = isOwner ? 0 : (h >> 2) % 6;
  const revision = isOwner ? 0 : (h >> 4) % 5;
  const done = isOwner ? 0 : (h >> 6) % 20;
  const completed = isOwner ? 120 + (h % 30) : (h >> 8) % 60;
  const risk = isOwner ? "Low" : RISKS[(h >> 3) % RISKS.length];
  const lastActive = LAST_ACTIVE[h % LAST_ACTIVE.length];
  const presence = PRESENCES[(h >> 1) % PRESENCES.length];
  const joinedDays = (h % 360) + 30;
  const joined = new Date(Date.now() - joinedDays * 86400_000).toLocaleDateString("vi-VN");
  const load = Math.min(100, Math.round((active / 20) * 100) + 20);
  return { active, pending, revision, done, completed, risk, lastActive, presence, joined, load };
}

function ownerOf(series: ProductionSeries): MemberRow {
  const m = mockMetrics(series.authorId, "MANGAKA");
  return {
    id: series.authorId,
    name: series.authorName,
    email: `${series.authorName.toLowerCase().replace(/\s+/g, ".")}@studio.jp`,
    kind: "MANGAKA",
    scope: "OWNER",
    ...m,
  };
}

function editorOf(series: ProductionSeries, tantouEditor?: TantouEditor | null): MemberRow {
  const editorId = tantouEditor?.userId ?? series.editorId;
  const editorName = tantouEditor?.userName ?? series.editorName;
  const m = mockMetrics(editorId, "EDITOR");
  return {
    id: tantouEditor?.id ?? `editor-${series.id}`,
    name: editorName,
    email: tantouEditor?.userEmail ?? `${editorName.toLowerCase().replace(/\s+/g, ".")}@studio.jp`,
    kind: "EDITOR",
    scope: "FULL SERIES",
    ...m,
  };
}

function assistantRow(u: AppUser, scope: Scope = "FULL SERIES"): MemberRow {
  const m = mockMetrics(u.id, "ASSISTANT");
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    kind: scope === "TASK ONLY" || scope === "READ ONLY" ? "TASK-ONLY" : "ASSISTANT",
    scope,
    ...m,
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
    MANGAKA: "bg-violet-100 text-violet-800",
    EDITOR: "bg-blue-100 text-blue-800",
    ASSISTANT: "bg-amber-100 text-amber-800",
    "TASK-ONLY": "bg-slate-200 text-slate-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[kind]}`}
    >
      {kind}
    </span>
  );
}

function ScopePill({ scope }: { scope: Scope }) {
  const map: Record<Scope, string> = {
    OWNER: "bg-amber-200 text-amber-900",
    "FULL SERIES": "bg-emerald-100 text-emerald-800",
    "TASK ONLY": "bg-sky-100 text-sky-800",
    "READ ONLY": "bg-rose-100 text-rose-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[scope]}`}
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
      <span className={`size-1.5 rounded-full ${color}`} /> {risk}
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
  return <span className={`size-1.5 rounded-full ${color}`} />;
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const h = hash(name);
  const hues = [
    "bg-violet-200",
    "bg-amber-200",
    "bg-sky-200",
    "bg-emerald-200",
    "bg-rose-200",
    "bg-slate-200",
  ];
  const bg = hues[h % hues.length];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${bg} font-bold text-[11px] text-foreground/80`}
      style={{ width: size, height: size }}
    >
      {initials(name)}
    </span>
  );
}

function roleForMember(kind: MemberKind): Role {
  if (kind === "MANGAKA") return "mangaka";
  if (kind === "EDITOR") return "editor";
  return "assistant";
}

// ---------- main ----------

export function TeamPanel({ series, chapters }: { series: ProductionSeries; chapters: Chapter[] }) {
  const user = useAuth((s) => s.user);
  const canEdit = !!user && (user.role === "admin" || user.role === "editor");
  const isMangakaOwner = !!user && user.role === "mangaka" && user.id === series.authorId;
  const [picker, setPicker] = useState(false);
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

  const { data: dbMembers = [], isLoading: isMembersLoading } = useSeriesMembersQuery(series.id);
  const { data: tantouEditor } = useTantouEditorQuery(series.id);
  const assignEditor = useAssignEditorMutation(series.id);
  const removeEditor = useRemoveEditorMutation(series.id);

  const addMember = useAddMemberMutation(series.id);
  const inviteAssistant = useInviteAssistantMutation(series.id);
  const removeMember = useRemoveMemberMutation(series.id, editingMemberId ?? selectedId ?? "");
  const updateMember = useUpdateMemberMutation(series.id, editingMemberId ?? selectedId ?? "");

  const handleAddAssistant = async (userId: string) => {
    try {
      const u = findUserById(userId);
      if (!u) return;
      await addMember.mutateAsync({
        userId,
        role: "assistant",
        scope: "Full chapter",
      });
      toast.success(`Added ${u.name}.`);
      setPicker(false);
    } catch (err) {
      toast.error(mapApiError(err));
    }
  };

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

  const members: MemberRow[] = useMemo(() => {
    const list: MemberRow[] = [ownerOf(series), editorOf(series, tantouEditor)];
    dbMembers.forEach((dbM: DbMember, idx: number) => {
      const u = findUserById(dbM.userId);
      if (!u) return;

      const mappedScope: Scope =
        dbM.scope === "Full chapter"
          ? "FULL SERIES"
          : dbM.scope === "Task only" || dbM.scope === "TASK_ONLY" || dbM.scope === "TASK ONLY"
            ? "TASK ONLY"
            : "READ ONLY";

      const m = mockMetrics(u.id, u.role === "assistant" ? "ASSISTANT" : "TASK-ONLY");
      list.push({
        id: dbM.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        kind: u.role === "assistant" ? "ASSISTANT" : "TASK-ONLY",
        scope: mappedScope,
        ...m,
      });
    });
    return list;
  }, [series, dbMembers, tantouEditor]);

  const assistantsList = members.filter((m) => m.kind === "ASSISTANT");
  const taskOnlyList = members.filter((m) => m.kind === "TASK-ONLY");

  // Workload featured = first 4 assistants/task-only
  const workloadFeatured = members
    .filter((m) => m.kind !== "MANGAKA" && m.kind !== "EDITOR")
    .slice(0, 4);

  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(members.length / pageSize));
  const pageRows = members.slice((page - 1) * pageSize, page * pageSize);

  const selected = selectedId ? (members.find((m) => m.id === selectedId) ?? null) : null;
  const currentMemberUserIds = dbMembers.map((m: DbMember) => m.userId);
  const available = ASSISTANTS.filter((a) => !currentMemberUserIds.includes(a.id));

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Team management
          </p>
          <div className="flex items-center gap-2">
            {canEdit || isMangakaOwner ? (
              <button
                onClick={() => setInviteOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <UserPlus className="size-3.5" /> Invite assistant
              </button>
            ) : null}
            {canEdit ? (
              <div className="relative">
                <button
                  onClick={() => setPicker((p) => !p)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
                >
                  <Plus className="size-3.5" /> Add assistant
                </button>
                {picker ? (
                  <div className="absolute right-0 z-10 mt-2 w-64 space-y-1 rounded-md border border-border bg-card p-2 shadow-lg">
                    {available.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">
                        No more assistants to add.
                      </p>
                    ) : (
                      available.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => handleAddAssistant(a.id)}
                          className="block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-muted"
                        >
                          + {a.name}
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={<Crown className="size-4" />}
            tone="amber"
            label="Mangaka / Owner"
            value={1}
            hint={series.authorName}
            trailing={<ScopePill scope="OWNER" />}
          />
          <StatCard
            icon={<PenLine className="size-4" />}
            tone="blue"
            label="Editor"
            value={tantouEditor ? 1 : 0}
            hint={tantouEditor?.userName ?? "Unassigned"}
            trailing={
              isMangakaOwner ? (
                <button
                  onClick={() => setAssignEditorOpen(true)}
                  className="text-[10px] font-semibold text-accent hover:underline"
                >
                  {tantouEditor ? "Change" : "Assign"}
                </button>
              ) : (
                <ScopePill scope="FULL SERIES" />
              )
            }
          />
          <StatCard
            icon={<Users className="size-4" />}
            tone="emerald"
            label="Assistants"
            value={assistantsList.length}
            hint={`${assistantsList.length} active · 1 invited`}
          />
          <StatCard
            icon={<ClipboardList className="size-4" />}
            tone="sky"
            label="Task-only members"
            value={taskOnlyList.length}
            hint={`${taskOnlyList.length} active · 2 invited`}
          />
        </div>

        {/* Workload */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Workload overview
          </p>
          {workloadFeatured.length === 0 ? (
            <p className="text-xs text-muted-foreground">No assistants yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {workloadFeatured.map((m) => (
                <WorkloadCard
                  key={m.id}
                  member={m}
                  selected={selectedId === m.id}
                  onClick={() => setSelectedId(m.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Members table */}
        <div className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Member list
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 text-left font-semibold">Name</th>
                  <th className="px-3 py-2 text-left font-semibold">Role</th>
                  <th className="px-3 py-2 text-left font-semibold">Access scope</th>
                  <th className="px-3 py-2 text-right font-semibold">Active</th>
                  <th className="px-3 py-2 text-right font-semibold">Pending</th>
                  <th className="px-3 py-2 text-right font-semibold">Completed</th>
                  <th className="px-3 py-2 text-left font-semibold">Deadline risk</th>
                  <th className="px-3 py-2 text-left font-semibold">Last active</th>
                  <th className="px-3 py-2 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((m) => {
                  const isSel = selectedId === m.id;
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedId(m.id)}
                      className={`cursor-pointer border-b border-border last:border-0 hover:bg-muted/40 ${
                        isSel ? "bg-accent/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={m.name} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{m.name}</p>
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
                      <td className="px-3 py-3 text-right tabular-nums">{m.active}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{m.pending}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{m.completed}</td>
                      <td className="px-3 py-3">
                        <RiskDot risk={m.risk} />
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{m.lastActive}</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(m.id);
                          }}
                          className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label="Actions"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, members.length)} of{" "}
              {members.length} members
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border border-border px-2 py-1 disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-7 rounded border px-2 py-1 ${
                    p === page ? "border-foreground bg-foreground text-background" : "border-border"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="rounded border border-border px-2 py-1 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {selected ? (
        <MemberDetail
          member={selected}
          chapters={chapters}
          canEdit={canEdit}
          onClose={() => setSelectedId(null)}
          onRemove={() => handleRemoveAssistant(selected.id, selected.name)}
          onEditScope={(id) => {
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
      ) : null}

      {/* Invite Assistant Dialog */}
      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={closeInvite}
        >
          <div
            className="w-80 rounded-md border border-border bg-card p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Invite assistant</h3>
              <button
                onClick={closeInvite}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Enter the email of an existing assistant account. Only users with the <b>assistant</b>{" "}
              role can be invited.
            </p>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Email
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
              className="mb-3 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Access scope
            </label>
            <select
              value={inviteScope}
              onChange={(e) =>
                setInviteScope(e.target.value as "Full chapter" | "Task only" | "Read only")
              }
              className="mb-4 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
            >
              <option value="Full chapter">Full chapter</option>
              <option value="Task only">Task only</option>
              <option value="Read only">Read only</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeInvite}
                className="rounded border border-border px-3 py-1.5 text-xs hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteAssistant}
                disabled={inviteAssistant.isPending || inviteEmail.trim().length === 0}
                className="rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {inviteAssistant.isPending ? "Inviting..." : "Invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scope Edit Dialog */}
      {editingMemberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-80 rounded-md border border-border bg-card p-4 shadow-lg">
            <h3 className="mb-3 text-sm font-semibold">Change access scope</h3>
            <select
              value={scopeDraft}
              onChange={(e) => setScopeDraft(e.target.value)}
              className="mb-3 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
            >
              <option value="Full chapter">Full chapter</option>
              <option value="Task only">Task only</option>
              <option value="Read only">Read only</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingMemberId(null)}
                className="rounded border border-border px-3 py-1.5 text-xs hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateScope(editingMemberId, scopeDraft)}
                disabled={updateMember.isPending}
                className="rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-50"
              >
                {updateMember.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Editor Dialog */}
      {assignEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-80 rounded-md border border-border bg-card p-4 shadow-lg">
            <h3 className="mb-3 text-sm font-semibold">
              {tantouEditor ? "Change Tantou Editor" : "Assign Tantou Editor"}
            </h3>
            {tantouEditor ? (
              <div className="mb-3 rounded border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">Current editor:</p>
                <p className="mt-1 text-sm font-semibold">{tantouEditor.userName}</p>
                <p className="text-xs text-muted-foreground">{tantouEditor.userEmail}</p>
                <button
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
                  className="mt-2 inline-flex items-center gap-1 rounded border border-rose-300 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  <Ban className="size-3" /> Remove editor
                </button>
              </div>
            ) : (
              <p className="mb-3 text-xs text-muted-foreground">
                No Tantou Editor yet. Select an editor from the list below.
              </p>
            )}
            <div className="mb-3">
              <p className="mb-1 text-xs font-semibold">Select editor:</p>
              <select
                id="assign-editor-select"
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
              >
                <option value="">-- Select editor --</option>
                <option value="u-editor">Tanaka Akira</option>
                <option value="u-mobile-editor">Mobile Editor</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAssignEditorOpen(false)}
                className="rounded border border-border px-3 py-1.5 text-xs hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const select = document.getElementById(
                    "assign-editor-select",
                  ) as HTMLSelectElement;
                  const editorId = select?.value;
                  if (!editorId) {
                    toast.error("Please select an editor.");
                    return;
                  }
                  const editorName = editorId === "u-editor" ? "Tanaka Akira" : "Mobile Editor";
                  try {
                    await assignEditor.mutateAsync({ editorId, editorName });
                    toast.success("Tantou Editor assigned.");
                    setAssignEditorOpen(false);
                  } catch (err) {
                    toast.error(mapApiError(err));
                  }
                }}
                disabled={assignEditor.isPending}
                className="rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-50"
              >
                {assignEditor.isPending ? "Saving..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkloadCard({
  member,
  selected,
  onClick,
}: {
  member: MemberRow;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border bg-card p-3 text-left transition ${
        selected
          ? "border-foreground ring-1 ring-foreground"
          : "border-border hover:border-foreground/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <Avatar name={member.name} size={28} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{member.name}</p>
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <PresenceDot presence={member.presence} /> {member.presence}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[10px]">
        <Stat label="Active" value={member.active} />
        <Stat label="Pending" value={member.pending} />
        <Stat label="Revision" value={member.revision} />
        <Stat label="Done" value={member.done} />
        <div>
          <p className="text-muted-foreground">Risk</p>
          <p className="mt-0.5 flex items-center justify-center gap-1 font-semibold">
            <span
              className={`size-1.5 rounded-full ${
                member.risk === "High"
                  ? "bg-rose-500"
                  : member.risk === "Medium"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
            />
            {member.risk}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-foreground" style={{ width: `${member.load}%` }} />
        </div>
        <p className="mt-1 text-right text-[10px] text-muted-foreground">{member.load}% load</p>
      </div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

function MemberDetail({
  member,
  chapters,
  canEdit,
  onClose,
  onRemove,
  onEditScope,
}: {
  member: MemberRow;
  chapters: Chapter[];
  canEdit: boolean;
  onClose: () => void;
  onRemove: () => void;
  onEditScope?: (id: string) => void;
}) {
  const tasks = useMemo(() => {
    return chapters.slice(0, 3).map((c, i) => ({
      id: c.id,
      title: `Ch. ${String(c.number).padStart(3, "0")} – ${c.title}`,
      due: c.draftDueAt ?? c.reviewDueAt ?? c.plannedAt ?? "",
      status: ["IN PROGRESS", "IN REVIEW", "PENDING"][i % 3],
      risk: ["Medium", "Low", "Low"][i % 3] as Risk,
    }));
  }, [chapters]);

  return (
    <aside className="flex w-full shrink-0 flex-col rounded-md border border-border bg-card xl:w-[280px]">
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center gap-2">
          <Avatar name={member.name} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{member.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">{member.email}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <RolePill kind={member.kind} />
          <ScopePill scope={member.scope} />
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            <PresenceDot presence={member.presence} /> {member.presence}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">Tham gia {member.joined}</p>

        <div className="mt-3 grid grid-cols-4 gap-1 text-center">
          <MiniStat value={member.active} label="Active" />
          <MiniStat value={member.pending} label="Pending" />
          <MiniStat value={member.revision} label="Revision" />
          <MiniStat value={member.completed} label="Done" />
        </div>
        <div className="mt-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground"
              style={{ width: `${member.load}%` }}
            />
          </div>
          <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{member.load}% load</p>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Tasks
            </p>
            <button className="text-[10px] text-accent hover:underline">View all →</button>
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {tasks.length === 0 ? (
              <li className="text-[11px] text-muted-foreground">No tasks yet.</li>
            ) : (
              tasks.map((t) => (
                <li
                  key={t.id}
                  className="rounded border border-border bg-background/60 px-2 py-1.5 text-[11px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{t.title}</p>
                    <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t.status}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{t.due ? new Date(t.due).toLocaleDateString("vi-VN") : "—"}</span>
                    <RiskDot risk={t.risk} />
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-border p-3">
        <div className="grid grid-cols-3 gap-1">
          <button
            title="Xem tasks"
            className="inline-flex items-center justify-center rounded-md bg-foreground px-2 py-1.5 text-xs font-semibold text-background hover:opacity-90"
          >
            <Eye className="size-3.5" />
          </button>
          <button
            title="Change access scope"
            onClick={() => onEditScope?.(member.id)}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-2 py-1.5 hover:bg-muted"
          >
            <ShieldCheck className="size-3.5" />
          </button>
          <button
            title="Send message"
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-2 py-1.5 hover:bg-muted"
          >
            <Mail className="size-3.5" />
          </button>
        </div>
        {canEdit ? (
          <button
            onClick={onRemove}
            className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-rose-300 bg-background px-2 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
          >
            <Ban className="size-3" /> Disable
          </button>
        ) : null}
      </div>
    </aside>
  );
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded border border-border bg-background/60 px-1 py-1.5">
      <p className="text-sm font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
