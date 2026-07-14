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
  Eye,
} from "lucide-react";
import { useAuth, ASSISTANTS, findUserById } from "@/shared/auth";
import type { Role } from "@/shared/auth";
import type { ProductionSeries } from "@/entities/series/model/series-types";
import { StatCard } from "@/shared/ui/stat-card";
import {
  useSeriesMembersQuery,
  useAddMemberMutation,
  useInviteAssistantMutation,
  useRemoveMemberMutation,
  useUpdateMemberMutation,
  mapApiError,
  type DbMember,
} from "../../api/series-queries";

// ---------- helpers ----------

type Scope = "OWNER" | "FULL SERIES" | "TASK ONLY" | "READ ONLY";
type MemberKind = "MANGAKA" | "EDITOR" | "ASSISTANT" | "TASK-ONLY";

type MemberRow = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  kind: MemberKind;
  scope: Scope;
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function ownerOf(series: ProductionSeries): MemberRow {
  return {
    id: series.authorId,
    name: series.authorName,
    email: `${series.authorName.toLowerCase().replace(/\s+/g, ".")}@studio.jp`,
    kind: "MANGAKA",
    scope: "OWNER",
  };
}

function editorOf(series: ProductionSeries): MemberRow {
  const editorName = series.editorName;
  return {
    id: series.editorId ?? `editor-${series.id}`,
    name: editorName,
    email: `${editorName.toLowerCase().replace(/\s+/g, ".")}@studio.jp`,
    kind: "EDITOR",
    scope: "FULL SERIES",
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

export function TeamPanel({ series }: { series: ProductionSeries }) {
  const user = useAuth((s) => s.user);
  const isMangakaOwner = !!user && user.role === "mangaka" && user.id === series.authorId;
  const canEdit = isMangakaOwner;
  const [picker, setPicker] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [scopeDraft, setScopeDraft] = useState<string>("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteScope, setInviteScope] = useState<"Full chapter" | "Task only" | "Read only">(
    "Full chapter",
  );

  const { data: dbMembers = [], isLoading: isMembersLoading } = useSeriesMembersQuery(series.id);

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
    const list: MemberRow[] = [ownerOf(series), editorOf(series)];
    dbMembers.forEach((dbM: DbMember, idx: number) => {
      const u = findUserById(dbM.userId);
      if (!u) return;

      const mappedScope: Scope =
        dbM.scope === "Full chapter"
          ? "FULL SERIES"
          : dbM.scope === "Task only" || dbM.scope === "TASK_ONLY" || dbM.scope === "TASK ONLY"
            ? "TASK ONLY"
            : "READ ONLY";

      list.push({
        id: dbM.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        kind: u.role === "assistant" ? "ASSISTANT" : "TASK-ONLY",
        scope: mappedScope,
      });
    });
    return list;
  }, [series, dbMembers]);

  const assistantsList = members.filter((m) => m.kind === "ASSISTANT");
  const taskOnlyList = members.filter((m) => m.kind === "TASK-ONLY");

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
            {canEdit ? (
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
            value={series.editorId ? 1 : 0}
            hint={series.editorName ?? "Unassigned"}
            trailing={<ScopePill scope="FULL SERIES" />}
          />
          <StatCard
            icon={<Users className="size-4" />}
            tone="emerald"
            label="Assistants"
            value={assistantsList.length}
            hint="Series members"
          />
          <StatCard
            icon={<ClipboardList className="size-4" />}
            tone="sky"
            label="Task-only members"
            value={taskOnlyList.length}
            hint="Limited access"
          />
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
    </div>
  );
}

function MemberDetail({
  member,
  canEdit,
  onClose,
  onRemove,
  onEditScope,
}: {
  member: MemberRow;
  canEdit: boolean;
  onClose: () => void;
  onRemove: () => void;
  onEditScope?: (id: string) => void;
}) {
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
        </div>

        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Access
          </p>
          <p className="mt-1.5 rounded border border-border bg-background/60 px-2 py-2 text-[11px] leading-5 text-muted-foreground">
            This panel only shows membership and access scope. Workload metrics should come from a
            real task summary API before being displayed.
          </p>
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
            <X className="size-3" /> Remove assistant
          </button>
        ) : null}
      </div>
    </aside>
  );
}
