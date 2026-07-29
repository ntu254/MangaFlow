import type { Role } from "@/shared/auth";

export type AuditEntry = {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  entity: string;
  entityId: string;
  action: string;
  detail?: string;
  createdAt: string;
};
