import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readJsonStorage,
  readStorageString,
  removeStorageItem,
  writeJsonStorage,
  writeStorageString,
} from "./storage";

function installLocalStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  });
  return store;
}

describe("storage helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back safely when window is missing", () => {
    vi.stubGlobal("window", undefined);

    expect(readStorageString("missing", "fallback")).toBe("fallback");
    expect(writeStorageString("key", "value")).toBe(false);
    expect(removeStorageItem("key")).toBe(false);
  });

  it("handles invalid JSON without throwing", () => {
    installLocalStorage({ draft: "not-json" });

    expect(readJsonStorage("draft", { fallback: { ok: false } })).toEqual({ ok: false });
  });

  it("honors versioned JSON envelopes", () => {
    const store = installLocalStorage();

    expect(writeJsonStorage("draft", { title: "A" }, { version: 2 })).toBe(true);
    expect(JSON.parse(store.get("draft") ?? "{}")).toEqual({
      __version: 2,
      value: { title: "A" },
    });
    expect(readJsonStorage("draft", { fallback: null, version: 2 })).toEqual({ title: "A" });
    expect(readJsonStorage("draft", { fallback: null, version: 1 })).toBeNull();
  });
});
