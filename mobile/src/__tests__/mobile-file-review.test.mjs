import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  resolveDisplayUrl,
  shouldRefreshLease,
} from "../domain/review-files.ts";

const domainSource = readFileSync(new URL("../domain/review-files.ts", import.meta.url), "utf8");
const serviceSource = readFileSync(
  new URL("../services/mobile-file-review.ts", import.meta.url),
  "utf8",
);

test("review-file lease refreshes before a 900-second URL expires", () => {
  const lease = { url: "https://signed.example/file", expiresAtMs: 900_000 };
  assert.equal(shouldRefreshLease(lease, 869_999), false);
  assert.equal(shouldRefreshLease(lease, 870_000), true);
});

test("relative display URLs resolve against the API origin while absolute URLs are preserved", () => {
  assert.equal(
    resolveDisplayUrl("/api/files/display/signed-token", "http://localhost:3001/api"),
    "http://localhost:3001/api/files/display/signed-token",
  );
  assert.equal(
    resolveDisplayUrl("https://cdn.example/files/signed-token", "http://localhost:3001/api"),
    "https://cdn.example/files/signed-token",
  );
});

test("file URLs are acquired only when a user opens a file", () => {
  assert.match(serviceSource, /openReviewFile\(file/);
  assert.doesNotMatch(serviceSource, /Promise\.all\(.*display-url/s);
});

test("review-file requests use scoped metadata and an on-demand display URL", () => {
  assert.match(serviceSource, /\/review-files\/\$\{context\}\/\$\{encodeURIComponent\(id\)\}/);
  assert.match(serviceSource, /method:\s*"POST"/);
  assert.match(serviceSource, /\/files\/display-url/);
  assert.match(serviceSource, /key:\s*file\.key/);
  assert.match(serviceSource, /name:\s*file\.name/);
  assert.match(serviceSource, /fileName:\s*file\.name/);
});

test("review-file URLs use server expiry or an eight-minute in-memory fallback", () => {
  assert.match(serviceSource, /Date\.parse\(payload\.expiresAt\)/);
  assert.match(serviceSource, /Date\.now\(\)\s*\+\s*DEFAULT_LEASE_MS/);
  assert.doesNotMatch(`${domainSource}\n${serviceSource}`, /AsyncStorage|localStorage|mock.*url/i);
});

test("review-file failures preserve authorization and missing-file HTTP status", () => {
  assert.match(serviceSource, /class MobileFileReviewHttpError/);
  assert.match(serviceSource, /readonly status: number/);
  assert.match(serviceSource, /throw new MobileFileReviewHttpError\(response\.status/);
});
