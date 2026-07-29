import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABEL, type Role } from "@/shared/auth";
import {
  ActionButton,
  MetricCard,
  MetricGrid,
  OverrideDialog,
  PageFrame,
  PageHeader,
  SearchToolbar,
  StateBlock,
  TextButton,
  DataPagination,
} from "@/shared/ui";
import { useSortableData } from "@/shared/lib/use-sortable-data";
import { Download, Lock, Plus, RotateCcw, Shield, User, Users } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AccessDenied, mapAdminError, useAdminAccess } from "../../_shared";
import { ALL_ROLES } from "../../_shared/model/admin-constants";
import {
  type AdminUser,
  useAdminUserMutation,
  useAdminUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useResetAdminPasswordMutation,
} from "../../api/admin-queries";
import { CreateUserDialog } from "./create-user-dialog";
import { RoleChangeDialog } from "./role-change-dialog";
import { UserInspector } from "./user-inspector";
import { UsersTable } from "./users-table";

type RoleFilter = "ALL" | Role;
type StatusFilter = "ALL" | "ACTIVE" | "DEACTIVATED";
type PrivilegeFilter = "ALL" | "CHAIR" | "EDITOR";

const ROWS_PER_PAGE = 10;

export function AdminUsersPage() {
  const { user: currentUser, canQueryAdmin, denial } = useAdminAccess();
  const { data: users = [], isLoading, error } = useAdminUsersQuery({ enabled: canQueryAdmin });
  const updateUserMutation = useAdminUserMutation();
  const createUserMutation = useCreateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();
  const resetPasswordMutation = useResetAdminPasswordMutation();

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [privilegeFilter, setPrivilegeFilter] = useState<PrivilegeFilter>("ALL");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState<AdminUser | null>(null);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>("mangaka");
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const locked = users.filter((user) => user.active === false).length;
  const active = users.length - locked;
  const adminCount = users.filter((user) => user.role.toUpperCase() === "ADMIN").length;
  const filtersActive =
    query.trim().length > 0 ||
    roleFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    privilegeFilter !== "ALL";

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users
      .filter(
        (user) => roleFilter === "ALL" || user.role.toLowerCase() === roleFilter.toLowerCase(),
      )
      .filter((user) => {
        if (statusFilter === "ALL") return true;
        return statusFilter === "ACTIVE" ? user.active !== false : user.active === false;
      })
      .filter((user) => {
        if (privilegeFilter === "ALL") return true;
        return privilegeFilter === "CHAIR" ? user.isChair === true : user.isEditorInChief === true;
      })
      .filter((user) => !needle || `${user.name} ${user.email}`.toLowerCase().includes(needle));
  }, [users, query, roleFilter, statusFilter, privilegeFilter]);

  const { sorted, sortKey, sortDirection, toggleSort } = useSortableData(
    filtered,
    {
      name: (user) => user.name,
      role: (user) => user.role,
      status: (user) => (user.active === false ? "deactivated" : "active"),
      createdAt: (user) => (user.createdAt ? new Date(user.createdAt) : undefined),
      updatedAt: (user) => (user.updatedAt ? new Date(user.updatedAt) : undefined),
    },
    { key: "createdAt", direction: "desc" },
  );

  useEffect(() => setPage(1), [query, roleFilter, statusFilter, privilegeFilter]);
  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
    setPage((currentPage) => Math.min(currentPage, lastPage));
  }, [filtered.length]);

  const visibleRows = sorted.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  const selected = selectedId ? users.find((user) => user.id === selectedId) : undefined;

  if (denial) {
    return (
      <AccessDenied
        title="Users"
        description="Manage platform accounts, roles, permissions, and access status."
        denial={denial}
      />
    );
  }

  if (error) {
    return (
      <PageFrame>
        <StateBlock tone="danger" title="Could not load users" description={mapAdminError(error)} />
      </PageFrame>
    );
  }

  const clearFilters = () => {
    setQuery("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setPrivilegeFilter("ALL");
  };

  const exportUsers = () => {
    const csv = [
      ["Name", "Email", "Role", "Status"],
      ...filtered.map((user) => [
        user.name,
        user.email,
        user.role,
        user.active === false ? "Deactivated" : "Active",
      ]),
    ]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "users.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageFrame className="p-0">
      <section className="min-h-[calc(100vh-4rem)] px-5 py-6 lg:px-8">
        <PageHeader
          title="Users"
          description="Manage platform accounts, roles, permissions, and access status."
        >
          <TextButton onClick={exportUsers}>
            <Download className="size-4" />
            Export
          </TextButton>
          <ActionButton tone="primary" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="size-4" />
            Create User
          </ActionButton>
        </PageHeader>

        <MetricGrid className="mt-6 md:grid-cols-2 2xl:grid-cols-4">
          <MetricCard
            icon={<Users className="size-5" />}
            label="Total Users"
            value={users.length}
            hint="All platform accounts"
          />
          <MetricCard
            icon={<User className="size-5" />}
            label="Active"
            value={active}
            hint={`${users.length ? Math.round((active / users.length) * 100) : 0}% of all accounts`}
            tone="success"
          />
          <MetricCard
            icon={<Lock className="size-5" />}
            label="Deactivated"
            value={locked}
            hint="Require attention"
            tone={locked > 0 ? "warning" : "default"}
          />
          <MetricCard
            icon={<Shield className="size-5" />}
            label="Admins"
            value={adminCount}
            hint="Full access accounts"
          />
        </MetricGrid>

        <SearchToolbar
          className="mt-7"
          query={query}
          onQueryChange={setQuery}
          placeholder="Search by name or email"
          filters={
            <>
              <FilterSelect
                value={roleFilter}
                onValueChange={(value) => setRoleFilter(value as RoleFilter)}
              >
                <SelectItem value="ALL">All Roles</SelectItem>
                {ALL_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABEL[role]}
                  </SelectItem>
                ))}
              </FilterSelect>
              <FilterSelect
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
              </FilterSelect>
              <FilterSelect
                value={privilegeFilter}
                onValueChange={(value) => setPrivilegeFilter(value as PrivilegeFilter)}
              >
                <SelectItem value="ALL">All Privileges</SelectItem>
                <SelectItem value="CHAIR">Chair</SelectItem>
                <SelectItem value="EDITOR">Editor-in-Chief</SelectItem>
              </FilterSelect>
            </>
          }
          actions={
            <Button
              type="button"
              variant="outline"
              disabled={!filtersActive}
              onClick={clearFilters}
              className="h-10 gap-2 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-[13px] shadow-sm"
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          }
        />

        <UsersTable
          users={users}
          rows={visibleRows}
          selectedId={selectedId}
          currentUser={currentUser}
          isLoading={isLoading}
          updateSucceeded={updateUserMutation.isSuccess}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={toggleSort}
          onSelect={(user) => {
            setSelectedId(user.id);
            setInspectorOpen(true);
          }}
          onRoleChange={(user, role) => {
            setRoleChangeTarget(user);
            setPendingRole(role);
          }}
          onToggleActive={setDeactivateTarget}
          onDelete={setDeleteTarget}
        />
        <DataPagination
          total={filtered.length}
          page={page}
          pageSize={ROWS_PER_PAGE}
          onPageChange={setPage}
          itemName="users"
        />
      </section>

      <UserInspector
        user={selected}
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        updatePending={updateUserMutation.isPending}
        resetPending={resetPasswordMutation.isPending}
        onSave={(userId, patch) => updateUserMutation.mutate({ userId, patch })}
        onResetPassword={(password) => {
          if (!selected) return;
          resetPasswordMutation.mutate(
            { userId: selected.id, password },
            {
              onSuccess: () => toast.success("Password reset successfully."),
              onError: (err) => toast.error(err.message || "Failed to reset password."),
            },
          );
        }}
      />

      <OverrideDialog
        trigger={<span />}
        open={!!deactivateTarget}
        onOpenChange={(next) => !next && setDeactivateTarget(null)}
        actionLabel={deactivateTarget?.active !== false ? "Deactivate" : "Activate"}
        targetLabel={deactivateTarget ? `${deactivateTarget.name} (${deactivateTarget.email})` : ""}
        auditImpact="Creates an internal governance record for account status changes with actor, target user id, reason, and request id."
        onConfirm={(reason) => {
          if (!deactivateTarget) return;
          updateUserMutation.mutate(
            {
              userId: deactivateTarget.id,
              patch: { active: deactivateTarget.active === false, reason },
            },
            { onError: (err) => toast.error(err.message || "Failed to update user.") },
          );
          setDeactivateTarget(null);
        }}
      />

      <OverrideDialog
        trigger={<span />}
        open={!!deleteTarget}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        actionLabel="Delete User"
        targetLabel={deleteTarget ? `${deleteTarget.name} (${deleteTarget.email})` : ""}
        auditImpact="Soft-deletes the user account. The user will be deactivated and removed from active listings."
        onConfirm={(reason) => {
          if (!deleteTarget) return;
          deleteUserMutation.mutate(
            { userId: deleteTarget.id, reason },
            { onError: (err) => toast.error(err.message || "Failed to delete user.") },
          );
          setDeleteTarget(null);
        }}
      />

      <RoleChangeDialog
        target={roleChangeTarget}
        newRole={pendingRole}
        open={!!roleChangeTarget && !!pendingRole}
        onOpenChange={(open) => {
          if (!open) {
            setRoleChangeTarget(null);
            setPendingRole(null);
          }
        }}
        onConfirm={() => {
          if (!roleChangeTarget || !pendingRole) return;
          updateUserMutation.mutate(
            {
              userId: roleChangeTarget.id,
              patch: { role: pendingRole.toUpperCase() },
            },
            { onError: (err) => toast.error(err.message || "Failed to update role.") },
          );
          setRoleChangeTarget(null);
          setPendingRole(null);
        }}
        isMutating={updateUserMutation.isPending}
      />

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={(data) => {
          createUserMutation.mutate(data, {
            onSuccess: () => {
              setCreateDialogOpen(false);
              setNewUserName("");
              setNewUserEmail("");
              setNewUserPassword("");
              setNewUserRole("mangaka");
            },
            onError: (err) => toast.error(err.message || "Failed to create user."),
          });
        }}
        isMutating={createUserMutation.isPending}
        name={newUserName}
        onNameChange={setNewUserName}
        email={newUserEmail}
        onEmailChange={setNewUserEmail}
        password={newUserPassword}
        onPasswordChange={setNewUserPassword}
        role={newUserRole}
        onRoleChange={setNewUserRole}
      />
    </PageFrame>
  );
}

function FilterSelect({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-10 w-[154px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px] shadow-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}
