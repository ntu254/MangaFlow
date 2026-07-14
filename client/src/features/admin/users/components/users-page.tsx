import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SeparationOfDutiesWarning } from "@/entities/access";
import { ROLE_LABEL, type Role } from "@/shared/auth";
import {
  ActionButton,
  ConfirmationReasonDialog,
  MetricCard,
  MetricGrid,
  PageFrame,
  PageHeader,
  SearchToolbar,
  StateBlock,
  TextButton,
  DataPagination,
} from "@/shared/ui";
import {
  parseTableStateFromSearchParams,
  resetTableState,
  setTableFilter,
  tableStateToSearchParams,
  type TableState,
} from "@/shared/table";
import { Download, Lock, Plus, RotateCcw, Shield, User, Users } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AccessDenied, mapAdminError, useAdminAccess } from "../../_shared";
import { ALL_ROLES } from "../../_shared/model/admin-constants";
import {
  type AdminUser,
  useAdminUserMutation,
  useAdminUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
} from "../../api/admin-queries";
import { CreateUserDialog } from "./create-user-dialog";
import { RoleChangeDialog } from "./role-change-dialog";
import { UserInspector } from "./user-inspector";
import { UsersTable } from "./users-table";

type RoleFilter = "ALL" | Role;
type StatusFilter = "ALL" | "ACTIVE" | "DEACTIVATED";
type PrivilegeFilter = "ALL" | "CHAIR" | "EDITOR";

const ROWS_PER_PAGE = 10;
const DEFAULT_USERS_TABLE_STATE: Partial<TableState> = {
  pageSize: ROWS_PER_PAGE,
  sortBy: "createdAt",
  sortDir: "desc",
};

const EMPTY_SUMMARY = {
  total: 0,
  active: 0,
  locked: 0,
  adminCount: 0,
};

export function AdminUsersPage() {
  const { user: currentUser, canQueryAdmin, denial } = useAdminAccess();
  const [tableState, setTableState] = useState(() =>
    parseTableStateFromSearchParams(
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search),
      DEFAULT_USERS_TABLE_STATE,
    ),
  );
  const {
    data: usersList,
    isLoading,
    error,
  } = useAdminUsersQuery({ enabled: canQueryAdmin, tableState });
  const updateUserMutation = useAdminUserMutation();
  const createUserMutation = useCreateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();

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

  const users = usersList?.data ?? [];
  const pagination = usersList?.pagination ?? {
    page: tableState.page,
    pageSize: tableState.pageSize,
    total: 0,
  };
  const summary = usersList?.meta.summary ?? EMPTY_SUMMARY;
  const roleFilter =
    tableState.filters.role?.type === "select"
      ? (String(tableState.filters.role.value).toLowerCase() as RoleFilter)
      : "ALL";
  const statusFilter =
    tableState.filters.active?.type === "boolean"
      ? tableState.filters.active.value
        ? "ACTIVE"
        : "DEACTIVATED"
      : "ALL";
  const privilegeFilter =
    tableState.filters.isChair?.type === "boolean"
      ? "CHAIR"
      : tableState.filters.isEditorInChief?.type === "boolean"
        ? "EDITOR"
        : "ALL";
  const filtersActive =
    tableState.q.trim().length > 0 || Object.keys(tableState.filters).length > 0;

  useEffect(() => {
    const params = tableStateToSearchParams(tableState);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", nextUrl);
  }, [tableState]);

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
    setTableState(resetTableState(DEFAULT_USERS_TABLE_STATE));
  };

  const exportUsers = () => {
    const csv = [
      ["Name", "Email", "Role", "Status"],
      ...users.map((user) => [
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

        <div className="mt-6">
          <SeparationOfDutiesWarning>
            User role, activation, and deletion changes require a separate admin confirmation reason
            before they are applied.
          </SeparationOfDutiesWarning>
        </div>

        <MetricGrid className="mt-6 md:grid-cols-2 2xl:grid-cols-4">
          <MetricCard
            icon={<Users className="size-5" />}
            label="Total Users"
            value={summary.total}
            hint="All platform accounts"
          />
          <MetricCard
            icon={<User className="size-5" />}
            label="Active"
            value={summary.active}
            hint={`${
              summary.total ? Math.round((summary.active / summary.total) * 100) : 0
            }% of all accounts`}
            tone="success"
          />
          <MetricCard
            icon={<Lock className="size-5" />}
            label="Deactivated"
            value={summary.locked}
            hint="Require attention"
            tone={summary.locked > 0 ? "warning" : "default"}
          />
          <MetricCard
            icon={<Shield className="size-5" />}
            label="Admins"
            value={summary.adminCount}
            hint="Full access accounts"
          />
        </MetricGrid>

        <SearchToolbar
          className="mt-7"
          query={tableState.q}
          onQueryChange={(q) => setTableState((state) => ({ ...state, q, page: 1 }))}
          placeholder="Search by name or email"
          filters={
            <>
              <FilterSelect
                value={roleFilter}
                onValueChange={(value) =>
                  setTableState((state) =>
                    setTableFilter(
                      state,
                      "role",
                      value === "ALL" ? undefined : { type: "select", value: value.toUpperCase() },
                    ),
                  )
                }
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
                onValueChange={(value) =>
                  setTableState((state) =>
                    setTableFilter(
                      state,
                      "active",
                      value === "ALL" ? undefined : { type: "boolean", value: value === "ACTIVE" },
                    ),
                  )
                }
              >
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
              </FilterSelect>
              <FilterSelect
                value={privilegeFilter}
                onValueChange={(value) =>
                  setTableState((state) => {
                    let next = setTableFilter(state, "isChair", undefined);
                    next = setTableFilter(next, "isEditorInChief", undefined);
                    if (value === "CHAIR") {
                      return setTableFilter(next, "isChair", { type: "boolean", value: true });
                    }
                    if (value === "EDITOR") {
                      return setTableFilter(next, "isEditorInChief", {
                        type: "boolean",
                        value: true,
                      });
                    }
                    return next;
                  })
                }
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
          rows={users}
          selectedId={selectedId}
          currentUser={currentUser}
          isLoading={isLoading}
          updateSucceeded={updateUserMutation.isSuccess}
          activeAdminCount={summary.adminCount}
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
          total={pagination.total}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={(page) => setTableState((state) => ({ ...state, page }))}
          itemName="users"
        />
      </section>

      <UserInspector
        user={selected}
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        updatePending={updateUserMutation.isPending}
        onSave={(userId, patch) => updateUserMutation.mutate({ userId, patch })}
        onResetPassword={(password) => {
          toast.info("Password reset is not yet available. Backend endpoint pending.");
        }}
      />

      <ConfirmationReasonDialog
        trigger={<span />}
        open={!!deactivateTarget}
        onOpenChange={(next) => !next && setDeactivateTarget(null)}
        actionLabel={deactivateTarget?.active !== false ? "Deactivate" : "Activate"}
        targetLabel={deactivateTarget ? `${deactivateTarget.name} (${deactivateTarget.email})` : ""}
        auditImpact="Records the actor, target user id, confirmation reason, and request id."
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

      <ConfirmationReasonDialog
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
