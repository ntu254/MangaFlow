import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RoleBadge } from "@/entities/user";
import type { Role } from "@/shared/auth";
import { AvatarInitials, StatusPill } from "@/shared/ui";
import { ChevronDown, KeyRound, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { AdminUser } from "../../api/admin-queries";
import { formatUserDateTime } from "./user-utils";

export function UserInspector({
  user,
  open,
  onOpenChange,
  updatePending,
  resetPending,
  onSave,
  onResetPassword,
}: {
  user?: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  updatePending: boolean;
  resetPending: boolean;
  onSave: (userId: string, patch: Record<string, unknown>) => void;
  onResetPassword: (password: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  if (!user) return null;

  const active = user.active !== false;
  const role = user.role.toLowerCase() as Role;
  const canBeChair = active && role === "board";

  const cancelEdit = () => {
    setEditing(false);
    setEditName("");
    setEditEmail("");
  };

  const saveEdit = () => {
    const patch: Record<string, unknown> = {};
    if (editName.trim() !== user.name) patch.name = editName.trim();
    if (editEmail.trim() !== user.email) patch.email = editEmail.trim();
    if (Object.keys(patch).length > 0) onSave(user.id, patch);
    setEditing(false);
  };

  const editValid = editName.trim().length >= 2 && editEmail.trim().includes("@");

  return (
    <>
      <Modal
        open={open}
        onOpenChange={(next) => {
          if (!next) cancelEdit();
          onOpenChange(next);
        }}
      >
        <ModalContent className="max-w-lg gap-0 overflow-hidden border-[var(--admin-border)] bg-[var(--admin-surface)] p-0">
          <ModalTitle className="sr-only">User details for {user.name}</ModalTitle>
          <div className="relative px-6 pb-5 pt-6">
            <div className="absolute inset-0 bg-[var(--admin-hover)] opacity-60" />
            <div className="relative flex items-start gap-4">
              <AvatarInitials
                name={user.name}
                className="size-16 shrink-0 border-2 border-[var(--admin-border)] text-[20px] shadow-sm"
              />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="truncate font-serif text-[20px] font-semibold leading-tight text-[var(--admin-ink)]">
                  {user.name}
                </p>
                <p className="mt-1 truncate text-[13px] text-[var(--admin-muted)]">{user.email}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <StatusPill
                    status={active ? "active" : "locked"}
                    className="border border-current/15 text-[11px]"
                  />
                  <RoleBadge role={role} className="rounded-[5px] text-[10px]" />
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[56vh] overflow-y-auto">
            <SectionHeading>Account</SectionHeading>
            <div className="space-y-0 px-6 py-3">
              <FieldRow label="Name">
                {editing ? (
                  <Input value={editName} onChange={(event) => setEditName(event.target.value)} />
                ) : (
                  <span className="text-[12px] font-medium text-[var(--admin-ink)]">
                    {user.name}
                  </span>
                )}
              </FieldRow>
              <FieldRow label="Email">
                {editing ? (
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(event) => setEditEmail(event.target.value)}
                  />
                ) : (
                  <span className="text-[12px] font-medium text-[var(--admin-ink)]">
                    {user.email}
                  </span>
                )}
              </FieldRow>
              <FieldRow label="User ID">
                <span className="font-mono text-[12px] text-[var(--admin-muted)]">{user.id}</span>
              </FieldRow>
              <FieldRow label="Created">
                <span className="text-[12px] text-[var(--admin-muted)]">
                  {formatUserDateTime(user.createdAt)}
                </span>
              </FieldRow>
              <FieldRow label="Updated">
                <span className="text-[12px] text-[var(--admin-muted)]">
                  {formatUserDateTime(user.updatedAt)}
                </span>
              </FieldRow>
            </div>

            <SectionHeading>Privileges</SectionHeading>
            <div className="px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={user.isChair === true}
                    disabled={!canBeChair || updatePending}
                    onCheckedChange={(checked) => onSave(user.id, { isChair: checked })}
                    aria-label={`Set ${user.name} as Board Chair`}
                  />
                  <span className="text-[12px] text-[var(--admin-muted)]">Chair</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-[var(--admin-faint)]">
                Chair designation requires an active Board role.
              </p>
            </div>

            <SectionHeading>Security</SectionHeading>
            <div className="px-6 py-3">
              <button
                type="button"
                onClick={() => setResetOpen(true)}
                disabled={resetPending}
                className="group flex w-full items-center gap-3 rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3.5 py-2.5 text-left transition-colors hover:border-[var(--admin-navy)]/30 hover:bg-[var(--admin-hover)]"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-[var(--admin-hover)] transition-colors group-hover:bg-[var(--admin-navy)]/10">
                  <KeyRound className="size-3.5 text-[var(--admin-faint)] transition-colors group-hover:text-[var(--admin-navy)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-[var(--admin-ink)]">Reset password</p>
                  <p className="mt-0.5 text-[11px] text-[var(--admin-faint)]">
                    Set a new temporary password for this user
                  </p>
                </div>
                <ChevronDown className="size-3.5 shrink-0 -rotate-90 text-[var(--admin-faint)]" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--admin-border)] bg-[var(--admin-hover)]/30 px-6 py-3.5">
            {editing ? (
              <>
                <Button variant="outline" onClick={cancelEdit} disabled={updatePending}>
                  Cancel
                </Button>
                <Button onClick={saveEdit} disabled={!editValid || updatePending}>
                  {updatePending ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="size-3 animate-spin" />
                      Saving
                    </span>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setEditName(user.name);
                  setEditEmail(user.email);
                  setEditing(true);
                }}
              >
                Edit profile
              </Button>
            )}
          </div>
        </ModalContent>
      </Modal>

      <Modal open={resetOpen} onOpenChange={setResetOpen}>
        <ModalContent className="max-w-sm gap-0 border-[var(--admin-border)] bg-[var(--admin-surface)] p-0">
          <ModalHeader className="border-b border-[var(--admin-border)] px-6 py-4">
            <ModalTitle className="text-[14px] font-semibold text-[var(--admin-ink)]">
              Reset password for {user.name}
            </ModalTitle>
          </ModalHeader>
          <div className="px-6 py-4">
            <Label htmlFor="reset-password" className="text-[12px] text-[var(--admin-muted)]">
              New password
            </Label>
            <Input
              id="reset-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Min 8 characters"
              className="mt-1.5"
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-[var(--admin-border)] px-6 py-3">
            <Button
              variant="outline"
              onClick={() => {
                setResetOpen(false);
                setNewPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={newPassword.length < 8 || resetPending}
              onClick={() => {
                onResetPassword(newPassword);
                setResetOpen(false);
                setNewPassword("");
              }}
            >
              {resetPending ? "Resetting..." : "Reset"}
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-t border-[var(--admin-border)] px-6 pb-1 pt-4">
      <div className="size-1 rounded-full bg-[var(--admin-gold)]" />
      <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--admin-faint)]">
        {children}
      </h4>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--admin-border)]/50 py-2.5 last:border-b-0">
      <span className="shrink-0 text-[12px] text-[var(--admin-faint)]">{label}</span>
      <div className="min-w-0 flex-1 text-right">{children}</div>
    </div>
  );
}
