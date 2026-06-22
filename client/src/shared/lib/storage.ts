type StorageArea = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type JsonEnvelope<T> = {
  __version: number;
  value: T;
};

type JsonStorageOptions<T> = {
  fallback: T;
  version?: number;
  validate?: (value: unknown) => value is T;
};

function getLocalStorage(): StorageArea | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  return window.localStorage;
}

export function readStorageString(key: string, fallback: string | null = null) {
  const storage = getLocalStorage();
  if (!storage) return fallback;
  try {
    return storage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStorageString(key: string, value: string) {
  const storage = getLocalStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorageItem(key: string) {
  const storage = getLocalStorage();
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readJsonStorage<T>(key: string, options: JsonStorageOptions<T>): T {
  const raw = readStorageString(key);
  if (!raw) return options.fallback;

  try {
    const parsed = JSON.parse(raw) as unknown;
    const value = resolveVersionedValue(parsed, options.version);
    if (value === undefined) return options.fallback;
    if (options.validate && !options.validate(value)) return options.fallback;
    return value as T;
  } catch {
    return options.fallback;
  }
}

export function writeJsonStorage<T>(key: string, value: T, options: { version?: number } = {}) {
  const payload: T | JsonEnvelope<T> =
    typeof options.version === "number" ? { __version: options.version, value } : value;
  try {
    return writeStorageString(key, JSON.stringify(payload));
  } catch {
    return false;
  }
}

function resolveVersionedValue(parsed: unknown, version: number | undefined) {
  if (typeof version !== "number") return parsed;
  if (!parsed || typeof parsed !== "object") return undefined;

  const envelope = parsed as Partial<JsonEnvelope<unknown>>;
  if (envelope.__version !== version) return undefined;
  return envelope.value;
}
