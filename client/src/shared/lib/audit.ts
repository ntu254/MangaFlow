import { useSyncExternalStore } from "react";
import { seedAudit, type AuditEvent, type AuditEntity } from "@/entities/audit/model";

const KEY = "mangaflow.audit";

function load(): AuditEvent[] {
  if (typeof window === "undefined") return seedAudit;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedAudit;
    return JSON.parse(raw) as AuditEvent[];
  } catch {
    return seedAudit;
  }
}

let store: AuditEvent[] = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
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
