import { useSyncExternalStore } from "react";
import { seedNotifications, type NotificationItem } from "@/entities/notification/model";
import { readJsonStorage, writeJsonStorage } from "./storage";

const KEY = "mangaflow.notifications";

function load(): NotificationItem[] {
  const parsed = readJsonStorage<Array<NotificationItem & { read?: boolean }>>(KEY, {
    fallback: seedNotifications,
    validate: Array.isArray,
  });
  return parsed.map(({ read, ...item }) => ({
    ...item,
    status: item.status ?? (read ? "READ" : "UNREAD"),
  }));
}

let store: NotificationItem[] = load();
const listeners = new Set<() => void>();

function emit() {
  writeJsonStorage(KEY, store);
  listeners.forEach((l) => l());
}

export function notify(
  userId: string,
  input: Omit<NotificationItem, "id" | "userId" | "status" | "at"> & { at?: string },
) {
  const n: NotificationItem = {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    status: "UNREAD",
    at: input.at ?? new Date().toLocaleString(),
    ...input,
  };
  store = [n, ...store];
  emit();
}

export function markRead(id: string) {
  store = store.map((n) => (n.id === id ? { ...n, status: "READ" as const } : n));
  emit();
}

export function markAllRead(userId: string) {
  store = store.map((n) => (n.userId === userId ? { ...n, status: "READ" as const } : n));
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
  const visible = snap.filter((n) => n.status !== "ARCHIVED");
  return userId ? visible.filter((n) => n.userId === userId) : visible;
}
