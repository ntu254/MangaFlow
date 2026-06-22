import { useSyncExternalStore } from "react";
import { seedAudit, type AuditEvent, type AuditEntity } from "@/entities/audit/model";
import { readJsonStorage, writeJsonStorage } from "./storage";

const KEY = "mangaflow.audit";

function load(): AuditEvent[] {
  return readJsonStorage(KEY, {
    fallback: seedAudit,
    validate: Array.isArray,
  });
}

let store: AuditEvent[] = load();
const listeners = new Set<() => void>();

function persist() {
  writeJsonStorage(KEY, store);
  listeners.forEach((l) => l());
}

export function logAudit(input: Omit<AuditEvent, "id" | "at"> & { at?: string }) {
  const event: AuditEvent = {
    id: `au_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    at: input.at ?? new Date().toLocaleString(),
    ...input,
  };
  store = [event, ...store];
  persist();
  return event;
}

export function useAuditLog(entity?: AuditEntity, entityId?: string) {
  const snapshot = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => store,
    () => store,
  );
  if (!entity) return snapshot;
  return snapshot.filter((e) => e.entity === entity && (entityId ? e.entityId === entityId : true));
}

export function resetAudit() {
  store = seedAudit;
  persist();
}
