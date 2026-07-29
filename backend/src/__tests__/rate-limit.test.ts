import { describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "../middleware/rate-limit.js";

describe("authentication rate limiter", () => {
  it("returns RATE_LIMITED after the configured request budget", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    const next = vi.fn();
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const setHeader = vi.fn();
    const req = { ip: "198.51.100.10", socket: { remoteAddress: "198.51.100.10" } } as any;
    const res = { status, setHeader } as any;

    limiter(req, res, next);
    limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenCalledWith(429);
    expect(setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, code: "RATE_LIMITED" }),
    );
  });
});
