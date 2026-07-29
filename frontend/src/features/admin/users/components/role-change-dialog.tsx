import { RoleBadge } from "@/entities/user";
import { ROLE_DESCRIPTION, type Role } from "@/shared/auth";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import type { AdminUser } from "../../api/admin-queries";

export function RoleChangeDialog({
  target,
  newRole,
  open,
  onOpenChange,
  onConfirm,
  isMutating,
}: {
  target: AdminUser | null;
  newRole: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isMutating: boolean;
}) {
  if (!target || !newRole) return null;

  const currentRole = target.role.toLowerCase() as Role;
  const isAdminChange = currentRole === "admin" || newRole === "admin";

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Confirm role change"
      description={
        <div className="space-y-4">
          <p>This action will update the user&apos;s workspace permissions.</p>
          <div className="flex items-center gap-3">
            <RoleCompare label="Current" role={currentRole} />
            <span className="text-lg text-[var(--admin-faint)]">-&gt;</span>
            <RoleCompare label="New" role={newRole} />
          </div>
          <div className="rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)]/60 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-faint)]">
              New role permissions
            </p>
            <p className="mt-1 text-xs text-[var(--admin-faint)]">{ROLE_DESCRIPTION[newRole]}</p>
          </div>
        </div>
      }
      impactExplanation={
        isAdminChange
          ? currentRole === "admin"
            ? "Removing admin privileges is irreversible for the current session. Ensure another admin account exists."
            : "Granting admin privileges gives full system access including user management, settings, and earnings tracking."
          : "Role changes affect what the user can see and do across the workspace. Some permissions may require re-authentication."
      }
      variant={isAdminChange ? "danger" : "default"}
      onConfirm={onConfirm}
      isLoading={isMutating}
    />
  );
}

function RoleCompare({ label, role }: { label: string; role: Role }) {
  return (
    <div className="flex-1 rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)]/60 p-2 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-faint)]">
        {label}
      </p>
      <div className="mt-1 flex justify-center">
        <RoleBadge role={role} />
      </div>
    </div>
  );
}
