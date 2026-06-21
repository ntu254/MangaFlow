import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Loader2, Plus, Power, PowerOff, Search, Trash2 } from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/layouts/AppShell";
import { ROLES, useRole } from "@/shared/lib/role";
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUsers,
} from "@/shared/queries/useUsers";
import type { AdminUser, ServerRole } from "@/shared/api";

export const Route = createFileRoute("/app/admin/user-management")({
  component: UserManagementPage,
});

const SERVER_ROLES: ServerRole[] = ["ADMIN", "MANGAKA", "EDITOR", "ASSISTANT", "BOARD"];

function UserManagementPage() {
  const { user: me } = useRole();
  const { data: users, isLoading, error } = useUsers();
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<ServerRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const list: AdminUser[] = users ?? [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return list.filter((user) => {
      const matchesSearch =
        !needle ||
        [user.name, user.displayName, user.email, user.team, user.notes]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" || (statusFilter === "ACTIVE" ? user.isActive : !user.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [list, query, roleFilter, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of ROLES) c[r.id] = 0;
    for (const u of list) {
      const k = (u.role || "").toLowerCase();
      if (k in c) c[k]++;
    }
    return c;
  }, [list]);

  if (error) {
    return (
      <div>
        <PageHeader title="Users" jp="User admin" />
        <EmptyState
          title="Could not load users"
          hint={(error as Error).message + " - make sure you are signed in as ADMIN."}
        />
      </div>
    );
  }

  return (
    <div className="admin-console admin-page space-y-5">
      <PageHeader
        title="Users"
        jp="User admin"
        description="View users, search and filter accounts, inspect detail, change role, and change status."
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            New user
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {ROLES.map((r) => (
          <StatCard key={r.id} label={r.label} value={String(counts[r.id] ?? 0)} hint={r.jp} />
        ))}
      </div>

      <div className="grid gap-3 rounded-md border border-foreground/10 bg-card p-4 lg:grid-cols-[1fr_180px_180px]">
        <label className="flex h-9 items-center gap-2 rounded-md border border-foreground/15 bg-foreground/5 px-3">
          <Search className="h-3.5 w-3.5 text-foreground/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, team, notes"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/35"
          />
        </label>
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value as ServerRole | "ALL")}
          className="h-9 rounded-md border border-foreground/15 bg-background px-2 text-sm"
        >
          <option value="ALL">All roles</option>
          {SERVER_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "SUSPENDED")
          }
          className="h-9 rounded-md border border-foreground/15 bg-background px-2 text-sm"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-3 border-b border-foreground/10 bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground/55">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-foreground/50">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12">
              <EmptyState title="No users matched" hint="Try another search or filter." />
            </div>
          ) : (
            filtered.map((u) => {
              const isMe = me?.id === u.id;
              return (
                <div
                  key={u.id}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] items-center gap-3 border-b border-foreground/5 px-4 py-3 text-[13px] last:border-b-0"
                >
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="flex min-w-0 items-center gap-3 text-left"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {initials(u.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {u.name}{" "}
                        {isMe && <span className="text-[10px] text-foreground/40">(you)</span>}
                      </div>
                      {u.displayName && (
                        <div className="truncate text-[11px] text-foreground/50">
                          {u.displayName}
                        </div>
                      )}
                    </div>
                  </button>
                  <span className="truncate text-foreground/70">{u.email}</span>
                  <select
                    value={u.role}
                    disabled={isMe || updateRole.isPending}
                    onChange={(event) =>
                      updateRole.mutate({ userId: u.id, role: event.target.value as ServerRole })
                    }
                    className="h-8 rounded-md border border-foreground/15 bg-foreground/5 px-2 text-xs disabled:opacity-50"
                  >
                    {SERVER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <StatusLabel active={u.isActive} />
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setSelectedUser(u)}
                      title="View detail"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground/10 text-foreground/60 hover:text-foreground"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => updateStatus.mutate({ userId: u.id, isActive: !u.isActive })}
                      disabled={isMe || updateStatus.isPending}
                      title={u.isActive ? "Suspend" : "Activate"}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground/10 text-foreground/60 hover:text-foreground disabled:opacity-40"
                    >
                      {u.isActive ? (
                        <PowerOff className="h-3.5 w-3.5" />
                      ) : (
                        <Power className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteUser.mutate(u.id)}
                      disabled={isMe || deleteUser.isPending}
                      title="Delete"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground/10 text-destructive/70 hover:text-destructive disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <aside className="rounded-md border border-foreground/10 bg-card p-4">
          <div className="text-sm font-semibold">User detail</div>
          {selectedUser ? (
            <div className="mt-4 space-y-3 text-sm">
              <Detail label="Name" value={selectedUser.name} />
              <Detail label="Email" value={selectedUser.email} />
              <Detail label="Role" value={selectedUser.role} />
              <Detail label="Status" value={selectedUser.isActive ? "Active" : "Suspended"} />
              <Detail label="Team" value={selectedUser.team || "-"} />
              <Detail label="Notes" value={selectedUser.notes || "-"} />
              <Detail label="Created" value={formatDate(selectedUser.createdAt)} />
              <Detail label="Updated" value={formatDate(selectedUser.updatedAt)} />
            </div>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-foreground/55">
              Select a user to inspect account metadata before changing role or status.
            </p>
          )}
        </aside>
      </div>

      {showCreate && <CreateUserDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function StatusLabel({ active }: { active: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 text-xs " +
        (active ? "text-emerald-500" : "text-foreground/40")
      }
    >
      <span
        className={"h-1.5 w-1.5 rounded-full " + (active ? "bg-emerald-500" : "bg-foreground/30")}
      />
      {active ? "Active" : "Suspended"}
    </span>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-foreground/45">{label}</div>
      <div className="mt-0.5 break-words text-foreground/80">{value || "-"}</div>
    </div>
  );
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const createUser = useCreateUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<ServerRole>("ASSISTANT");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    createUser.mutate({ email, password, name, role }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-lg border border-foreground/10 bg-background p-5"
      >
        <h2 className="text-lg font-semibold">New user</h2>
        <p className="text-xs text-foreground/55">Create a new account.</p>
        <div className="mt-4 space-y-3 text-sm">
          <DialogField label="Name" value={name} onChange={setName} />
          <DialogField label="Email" type="email" value={email} onChange={setEmail} />
          <DialogField label="Password" type="password" value={password} onChange={setPassword} />
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-foreground/70">Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as ServerRole)}
              className="input"
            >
              {SERVER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-md border border-foreground/15 px-3 text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createUser.isPending}
            className="h-8 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {createUser.isPending ? "Creating..." : "Create user"}
          </button>
        </div>
      </form>
      <style>{`
        .input {
          width: 100%;
          height: 36px;
          padding: 0 10px;
          border-radius: 6px;
          border: 1px solid rgba(127, 127, 127, 0.22);
          background: rgba(127, 127, 127, 0.05);
          font-size: 13px;
          outline: none;
        }
      `}</style>
    </div>
  );
}

function DialogField({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-foreground/70">{label}</span>
      <input
        required
        type={type}
        minLength={type === "password" ? 8 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input"
      />
    </label>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
