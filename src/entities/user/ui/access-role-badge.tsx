import { RoleBadge as ExistingRoleBadge } from "./role-badge";
import type { Role } from "@/shared/auth";
import { ROLE_BUSINESS_LABEL } from "@/entities/access/model/access-labels";

export function AccessRoleBadge({ role }: { role: Role }) {
  return (
    <span className="inline-flex items-center gap-2">
      <ExistingRoleBadge role={role} />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {ROLE_BUSINESS_LABEL[role]}
      </span>
    </span>
  );
}
