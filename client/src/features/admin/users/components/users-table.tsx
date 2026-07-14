import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { RestrictedActionTooltip } from "@/entities/access";
import { canShowAction } from "@/entities/access/model/permission-guard";
import { RoleBadge } from "@/entities/user";
import { ROLE_LABEL, type Role } from "@/shared/auth";
import { cn } from "@/shared/lib/cn";
import { AvatarInitials, ServerDataTable, StateBlock, StatusPill } from "@/shared/ui";
import { ArrowDown, ArrowUp, Check, ChevronDown, MoreHorizontal } from "lucide-react";
import { useMemo } from "react";
import type { AdminUser } from "../../api/admin-queries";
import { ALL_ROLES } from "../../_shared/model/admin-constants";
import { formatUserDate, isLastAdmin, privilegeLabel } from "./user-utils";

export function UsersTable({
  users,
  rows,
  selectedId,
  currentUser,
  isLoading,
  updateSucceeded,
  activeAdminCount,
  onSelect,
  onRoleChange,
  onToggleActive,
  onDelete,
}: {
  users: AdminUser[];
  rows: AdminUser[];
  selectedId: string | null;
  currentUser: { id: string; role: string } | null;
  isLoading: boolean;
  updateSucceeded: boolean;
  activeAdminCount?: number;
  onSelect: (user: AdminUser) => void;
  onRoleChange: (user: AdminUser, role: Role) => void;
  onToggleActive: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}) {
  const columns = useMemo<ColumnDef<AdminUser, unknown>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 pl-2">
            <AvatarInitials name={row.original.name} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold leading-tight text-[var(--admin-ink)]">
                {row.original.name}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-[var(--admin-faint)]">
                {row.original.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => {
          const lastAdmin = isLastAdmin(row.original, users, activeAdminCount);
          return (
            <RoleBadgeDropdown
              user={row.original}
              currentUser={currentUser}
              lastAdmin={lastAdmin}
              onRoleChange={onRoleChange}
            />
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusPill
            status={row.original.active !== false ? "active" : "locked"}
            className="border border-current/20 bg-opacity-70"
          />
        ),
      },
      {
        id: "privileges",
        header: "Privileges",
        cell: ({ row }) => (
          <span className="text-[14px] text-[var(--admin-muted)]">
            {privilegeLabel(row.original)}
          </span>
        ),
      },
      {
        id: "createdAt",
        header: () => (
          <span className="inline-flex items-center gap-1">
            Created
            <ArrowUp className="size-3" />
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-[14px] text-[var(--admin-muted)]">
            {formatUserDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "updatedAt",
        header: () => (
          <span className="inline-flex items-center gap-1">
            Updated
            <ArrowDown className="size-3" />
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-[14px] text-[var(--admin-muted)]">
            {formatUserDate(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const active = row.original.active !== false;
          const lastAdmin = isLastAdmin(row.original, users, activeAdminCount);

          return (
            <div className="pr-2 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-[5px] border-[var(--admin-border)] bg-[var(--admin-surface)]"
                    aria-label={`Open actions for ${row.original.name}`}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onSelect(row.original)}>
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onToggleActive(row.original)}>
                    {active ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-rose-600 focus:text-rose-700"
                    onSelect={() => onDelete(row.original)}
                    disabled={lastAdmin}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [
      currentUser,
      onDelete,
      onRoleChange,
      onSelect,
      onToggleActive,
      users,
      activeAdminCount,
    ],
  );

  return (
    <div className="mt-5 space-y-3">
      {updateSucceeded ? (
        <StateBlock
          tone="success"
          title="User update recorded"
          description="The backend user record was updated and the admin directory is refreshing."
        />
      ) : null}

      <ServerDataTable
        data={rows}
        columns={columns}
        getRowId={(user) => user.id}
        getRowClassName={(user) =>
          cn(
            "border-[var(--admin-border)] hover:bg-[var(--admin-hover)]",
            selectedId === user.id &&
              "bg-[var(--admin-hover)] shadow-[inset_3px_0_0_var(--admin-navy)]",
          )
        }
        isLoading={isLoading}
        skeletonRows={5}
        emptyTitle="No users match these filters"
        emptyDescription="Reset filters or try a different name, email, role, status, or privilege."
      />
    </div>
  );
}

function RoleBadgeDropdown({
  user,
  currentUser,
  lastAdmin,
  onRoleChange,
}: {
  user: AdminUser;
  currentUser: { id: string; role: string } | null;
  lastAdmin: boolean;
  onRoleChange: (target: AdminUser, newRole: Role) => void;
}) {
  const changeGuard = canShowAction({
    role: (currentUser?.role ?? "assistant") as Role,
    action: "change_role",
    currentUserId: currentUser?.id,
    entity: { isLastAdmin: lastAdmin },
  });
  const currentRole = user.role.toLowerCase() as Role;

  if (!changeGuard.allowed) {
    return (
      <RestrictedActionTooltip reason={changeGuard.reason}>
        <span>
          <RoleBadge role={currentRole} className="rounded-[5px] opacity-60" />
        </span>
      </RestrictedActionTooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Change role for ${user.name}`}
          className="inline-flex cursor-pointer items-center gap-1 rounded-[5px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <RoleBadge role={currentRole} className="rounded-[5px]" />
          <ChevronDown className="size-3 text-[var(--admin-faint)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {ALL_ROLES.map((role) => {
          const current = role === currentRole;
          return (
            <DropdownMenuItem
              key={role}
              disabled={current}
              onSelect={(event) => {
                event.preventDefault();
                if (!current) onRoleChange(user, role);
              }}
              className="gap-2"
            >
              <RoleBadge
                role={role}
                className="pointer-events-none rounded-[4px] border-0 bg-transparent px-0 py-0 text-[9px]"
              />
              <span className="flex-1 text-xs">{ROLE_LABEL[role]}</span>
              {current ? <Check className="size-3.5 text-[var(--admin-faint)]" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
