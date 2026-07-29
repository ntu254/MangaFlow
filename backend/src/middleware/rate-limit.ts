import type { RequestHandler } from "express";
import { env } from "../config/env.js";

export type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type RateLimiterRuntimeOptions = {
  skipInTest?: boolean;
};

type RateBucket = {
  startedAt: number;
  count: number;
};

export function createRateLimiter(
  options: RateLimitOptions,
  runtime: RateLimiterRuntimeOptions = {},
): RequestHandler {
  const buckets = new Map<string, RateBucket>();

  return (req, res, next) => {
    if (runtime.skipInTest && env.NODE_ENV === "test") {
      next();
      return;
    }

    const now = Date.now();
    const key = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const previous = buckets.get(key);
    const bucket =
      previous && now - previous.startedAt < options.windowMs
        ? previous
        : { startedAt: now, count: 0 };

    bucket.count += 1;
    buckets.set(key, bucket);

    if (buckets.size > 10_000) {
      for (const [bucketKey, candidate] of buckets) {
        if (now - candidate.startedAt >= options.windowMs) buckets.delete(bucketKey);
      }
    }

    if (bucket.count > options.max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((options.windowMs - (now - bucket.startedAt)) / 1000),
      );
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({
        success: false,
        message: "Too many authentication requests. Try again later.",
        code: "RATE_LIMITED",
      });
      return;
    }

    next();
  };
}

export const authRateLimit = createRateLimiter(
  {
    windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX,
  },
  { skipInTest: true },
);
