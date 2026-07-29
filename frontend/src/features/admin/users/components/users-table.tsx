import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RestrictedActionTooltip } from "@/entities/access";
import { canShowAction } from "@/entities/access/model/permission-guard";
import { RoleBadge } from "@/entities/user";
import { ROLE_LABEL, type Role } from "@/shared/auth";
import { cn } from "@/shared/lib/cn";
import { AvatarInitials, DataTable, SortableHeader, StateBlock, StatusPill } from "@/shared/ui";
import type { SortDirection } from "@/shared/lib/use-sortable-data";
import { Check, ChevronDown, MoreHorizontal } from "lucide-react";
import type { AdminUser } from "../../api/admin-queries";
import { ALL_ROLES } from "../../_shared/model/admin-constants";
import { EmptyUserFilters } from "./empty-user-filters";
import { formatUserDate, isLastAdmin, privilegeLabel } from "./user-utils";

export function UsersTable({
  users,
  rows,
  selectedId,
  currentUser,
  isLoading,
  updateSucceeded,
  sortKey,
  sortDirection,
  onSort,
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
  sortKey: string | null;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
  onSelect: (user: AdminUser) => void;
  onRoleChange: (user: AdminUser, role: Role) => void;
  onToggleActive: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}) {
  return (
    <DataTable className="mt-5" isLoading={isLoading} skeletonRows={5} skeletonColumns={7}>
      {updateSucceeded ? (
        <div className="p-4">
          <StateBlock
            tone="success"
            title="User update recorded"
            description="The backend user record was updated and the admin directory is refreshing."
          />
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <Table>
          <caption className="sr-only">User accounts</caption>
          <TableHeader>
            <TableRow className="border-[var(--admin-border)] hover:bg-transparent">
              <TableHead
                scope="col"
                className="h-12 pl-5 font-serif text-[14px] font-semibold text-[var(--admin-ink)]"
              >
                <SortableHeader
                  label="User"
                  sortKey="name"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead
                scope="col"
                className="font-serif text-[14px] font-semibold text-[var(--admin-ink)]"
              >
                <SortableHeader
                  label="Role"
                  sortKey="role"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead
                scope="col"
                className="font-serif text-[14px] font-semibold text-[var(--admin-ink)]"
              >
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead
                scope="col"
                className="font-serif text-[14px] font-semibold text-[var(--admin-ink)]"
              >
                Privileges
              </TableHead>
              <TableHead
                scope="col"
                className="font-serif text-[14px] font-semibold text-[var(--admin-ink)]"
              >
                <SortableHeader
                  label="Created"
                  sortKey="createdAt"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead
                scope="col"
                className="font-serif text-[14px] font-semibold text-[var(--admin-ink)]"
              >
                <SortableHeader
                  label="Updated"
                  sortKey="updatedAt"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead
                scope="col"
                className="pr-5 text-center font-serif text-[14px] font-semibold text-[var(--admin-ink)]"
              >
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((user) => {
              const active = user.active !== false;
              const lastAdmin = isLastAdmin(user, users);
              return (
                <TableRow
                  key={user.id}
                  className={cn(
                    "border-[var(--admin-border)] hover:bg-[var(--admin-hover)]",
                    selectedId === user.id &&
                      "bg-[var(--admin-hover)] shadow-[inset_3px_0_0_var(--admin-navy)]",
                  )}
                >
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <AvatarInitials name={user.name} />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold leading-tight text-[var(--admin-ink)]">
                          {user.name}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-[var(--admin-faint)]">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadgeDropdown
                      user={user}
                      currentUser={currentUser}
                      lastAdmin={lastAdmin}
                      onRoleChange={onRoleChange}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      status={active ? "active" : "locked"}
                      className="border border-current/20 bg-opacity-70"
                    />
                  </TableCell>
                  <TableCell className="text-[14px] text-[var(--admin-muted)]">
                    {privilegeLabel(user)}
                  </TableCell>
                  <TableCell className="text-[14px] text-[var(--admin-muted)]">
                    {formatUserDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-[14px] text-[var(--admin-muted)]">
                    {formatUserDate(user.updatedAt)}
                  </TableCell>
                  <TableCell className="pr-5 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9 rounded-[5px] border-[var(--admin-border)] bg-[var(--admin-surface)]"
                          aria-label={`Open actions for ${user.name}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onSelect(user)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onToggleActive(user)}>
                          {active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-rose-600 focus:text-rose-700"
                          onSelect={() => onDelete(user)}
                          disabled={lastAdmin}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-[var(--admin-faint)]"
                >
                  <EmptyUserFilters />
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </DataTable>
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
