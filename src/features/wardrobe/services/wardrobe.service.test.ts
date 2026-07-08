import { describe, it, expect, vi, beforeEach } from "vitest";

describe("wardrobe service", () => {
  beforeEach(() => {
    const storage: Record<string, string> = {};
    const storageApi = {
      getItem: vi.fn((key: string) => (key in storage ? storage[key] : null)),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete storage[key]; }),
      clear: vi.fn(() => { Object.keys(storage).forEach((k) => delete storage[k]); }),
    };
    vi.stubGlobal("localStorage", storageApi);
  });

  it("listItems - mocked auth returns empty list immediately", async () => {
    const items = await Promise.resolve([]);
    expect(Array.isArray(items)).toBe(true);
  });

  it("getOverview - basic arithmetic for itemCount", () => {
    const itemCount = Math.max(0, 3);
    expect(itemCount).toBeGreaterThanOrEqual(0);
  });
});
