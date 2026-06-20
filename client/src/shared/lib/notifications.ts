import { useSyncExternalStore } from "react";
import { seedNotifications, type NotificationItem } from "@/entities/notification/model";

const KEY = "mangaflow.notifications";

function load(): NotificationItem[] {
  if (typeof window === "undefined") return seedNotifications;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedNotifications;
    return JSON.parse(raw) as NotificationItem[];
  } catch {
    return seedNotifications;
  }
}

let store: NotificationItem[] = load();
const listeners = new Set<() => void>();

function emit() {
  try {
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function notify(
  userId: string,
  input: Omit<NotificationItem, "id" | "userId" | "read" | "at"> & { at?: string },
) {
  const n: NotificationItem = {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    read: false,
    at: input.at ?? new Date().toLocaleString(),
    ...input,
  };
  store = [n, ...store];
  emit();
}

export function markRead(id: string) {
  store = store.map((n) => (n.id === id ? { ...n, read: true } : n));
  emit();
}

export function markAllRead(userId: string) {
  store = store.map((n) => (n.userId === userId ? { ...n, read: true } : n));
  emit();
}

export function useNotifications(userId?: string) {
  const snap = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => store,
    () => store,
  );
  return userId ? snap.filter((n) => n.userId === userId) : snap;
}
