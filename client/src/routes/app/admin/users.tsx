import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2, Power, PowerOff } from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/layouts/AppShell";
import { ROLES, useRole } from "@/shared/lib/role";
import {
  useUsers,
  useCreateUser,
  useUpdateUserRole,
  useUpdateUserStatus,
  useDeleteUser,
} from "@/shared/queries/useUsers";
import type { AdminUser, ServerRole } from "@/shared/api";
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

export const Route = createFileRoute("/app/admin/users")({
  component: UsersPage,
});

const SERVER_ROLES: ServerRole[] = ["ADMIN", "MANGAKA", "EDITOR", "ASSISTANT", "BOARD"];

function UsersPage() {
  const { user: me } = useRole();
  const canAccessAdmin = me?.role === "ADMIN";
  const { data: users, isLoading, error } = useUsers({ enabled: canAccessAdmin });
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    userId: string | null;
    email: string;
  }>({
    open: false,
    userId: null,
    email: "",
  });

  const list: AdminUser[] = useMemo(() => users ?? [], [users]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of ROLES) c[r.id] = 0;
    for (const u of list) {
      const k = (u.role || "").toLowerCase();
      if (k in c) c[k]++;
    }
    return c;
  }, [list]);

  if (!canAccessAdmin) {
    return (
      <div>
        <PageHeader title="Users" jp="User admin" />
        <EmptyState
          title="Admin permission required"
          hint="Sign in as Admin to load and manage user accounts."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Users" jp="ユーザー管理" />
        <EmptyState
          title="Could not load users"
          hint={(error as Error).message + " — make sure you are signed in as ADMIN."}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Users"
        jp="ユーザー管理"
        description="Editorial staff and accounts. Admin only."
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

      <div className="mb-4 grid grid-cols-5 gap-3">
        {ROLES.map((r) => (
          <StatCard key={r.id} label={r.label} value={String(counts[r.id] ?? 0)} hint={r.jp} />
        ))}
      </div>

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
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : list.length === 0 ? (
          <div className="py-12">
            <EmptyState title="No users yet" hint="Click 'New user' to create one." />
          </div>
        ) : (
          list.map((u) => {
            const isMe = me?.id === u.id;
            return (
              <div
                key={u.id}
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] items-center gap-3 border-b border-foreground/5 px-4 py-3 text-[13px] last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {initials(u.name)}
                  </div>
                  <div>
                    <div className="font-medium">
                      {u.name}{" "}
                      {isMe && <span className="text-[10px] text-foreground/40">(you)</span>}
                    </div>
                    {u.displayName && (
                      <div className="text-[11px] text-foreground/50">{u.displayName}</div>
                    )}
                  </div>
                </div>
                <span className="truncate text-foreground/70">{u.email}</span>
                <select
                  value={u.role}
                  disabled={isMe || updateRole.isPending}
                  onChange={(e) =>
                    updateRole.mutate({ userId: u.id, role: e.target.value as ServerRole })
                  }
                  className="h-8 rounded-md border border-foreground/15 bg-foreground/5 px-2 text-xs disabled:opacity-50"
                >
                  {SERVER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <span
                  className={
                    "inline-flex items-center gap-1.5 text-xs " +
                    (u.isActive ? "text-emerald-500" : "text-foreground/40")
                  }
                >
                  <span
                    className={
                      "h-1.5 w-1.5 rounded-full " +
                      (u.isActive ? "bg-emerald-500" : "bg-foreground/30")
                    }
                  />
                  {u.isActive ? "Active" : "Suspended"}
                </span>
                <div className="flex items-center gap-1.5">
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
                    onClick={() => {
                      setDeleteDialog({ open: true, userId: u.id, email: u.email });
                    }}
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

      {showCreate && <CreateUserDialog onClose={() => setShowCreate(false)} />}

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user {deleteDialog.email}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog.userId) deleteUser.mutate(deleteDialog.userId);
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const createUser = useCreateUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<ServerRole>("ASSISTANT");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(
      { email, password, name, role },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
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
          <Field label="Name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ServerRole)}
              className="input"
            >
              {SERVER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-md border border-foreground/15 bg-foreground/5 px-3 text-xs text-foreground/70 hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createUser.isPending}
            className="h-8 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {createUser.isPending ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>

      <style>{`
        .input {
          width: 100%;
          height: 36px;
          padding: 0 10px;
          border-radius: 6px;
          border: 1px solid hsl(var(--border, 240 5% 90%) / 0.6);
          background: rgba(127,127,127,0.05);
          font-size: 13px;
          outline: none;
        }
        .input:focus { box-shadow: 0 0 0 2px hsl(var(--primary) / 0.4); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-foreground/70">{label}</span>
      {children}
    </label>
  );
}
