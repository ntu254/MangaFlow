import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABEL, type Role } from "@/shared/auth";
import type { ReactNode } from "react";
import { ALL_ROLES } from "../../_shared/model/admin-constants";

export function CreateUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isMutating,
  name,
  onNameChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  role,
  onRoleChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; email: string; password: string; role: string }) => void;
  isMutating: boolean;
  name: string;
  onNameChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  role: Role;
  onRoleChange: (value: Role) => void;
}) {
  const isValid =
    name.trim().length >= 2 &&
    email.trim().length >= 3 &&
    email.includes("@") &&
    password.trim().length >= 8;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      role: role.toUpperCase(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[20px] text-[var(--admin-ink)]">
            Create New User
          </DialogTitle>
          <DialogDescription>
            Add a new user to the system. They will receive an email to set their password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <DialogField label="Name" htmlFor="create-user-name">
            <Input
              id="create-user-name"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Full name"
              disabled={isMutating}
            />
          </DialogField>
          <DialogField label="Email" htmlFor="create-user-email">
            <Input
              id="create-user-email"
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="user@example.com"
              disabled={isMutating}
            />
          </DialogField>
          <DialogField label="Password" htmlFor="create-user-password">
            <Input
              id="create-user-password"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="At least 8 characters"
              disabled={isMutating}
            />
          </DialogField>
          <DialogField label="Role" htmlFor="create-user-role">
            <Select
              value={role}
              onValueChange={(value) => onRoleChange(value as Role)}
              disabled={isMutating}
            >
              <SelectTrigger id="create-user-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {ROLE_LABEL[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DialogField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isMutating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isMutating}>
            {isMutating ? "Creating..." : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
