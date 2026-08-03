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
const panelSource = readFileSync(
  new URL("../components/submitted-files-panel.tsx", import.meta.url),
  "utf8",
);
const viewerSource = readFileSync(
  new URL("../components/review-file-viewer.tsx", import.meta.url),
  "utf8",
);
const boardHookSource = readFileSync(
  new URL("../hooks/use-board-mobile-flow.ts", import.meta.url),
  "utf8",
);
const editorHookSource = readFileSync(
  new URL("../hooks/use-editor-mobile-flow.ts", import.meta.url),
  "utf8",
);
const proposalPanelSource = readFileSync(
  new URL("../screens/series-proposal-summary-panel.tsx", import.meta.url),
  "utf8",
);
const editorScreenSource = readFileSync(
  new URL("../screens/editor-screens.tsx", import.meta.url),
  "utf8",
);
const readmeSource = readFileSync(new URL("../../README.md", import.meta.url), "utf8");
const contextSource = readFileSync(new URL("../../MOBILE_AGENT_CONTEXT.md", import.meta.url), "utf8");
const fileFlowSource = readFileSync(
  new URL("../../../docs/business-flows/11-file-management.md", import.meta.url),
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

test("submitted file UI renders metadata and an explicit empty state", () => {
  assert.match(panelSource, /No submitted files are available for this review/);
  assert.match(panelSource, /submittedBy/);
  assert.match(panelSource, /submittedAt/);
});

test("viewer refreshes one expired URL before showing Retry", () => {
  assert.match(viewerSource, /hasRetriedRef/);
  assert.match(viewerSource, /shouldRefreshLease/);
  assert.match(viewerSource, /Retry/);
});

test("viewer ignores stale leases and opens an externally refreshed URL", () => {
  assert.match(viewerSource, /requestVersionRef/);
  assert.match(viewerSource, /requestVersion !== requestVersionRef\.current/);
  assert.match(viewerSource, /let activeLease = lease/);
  assert.match(viewerSource, /await Linking\.openURL\(activeLease\.url\)/);
});

test("Board proposal detail loads proposal files only", () => {
  assert.match(boardHookSource, /getReviewFiles\("proposal", selectedSeries\.id, "board"\)/);
  assert.doesNotMatch(boardHookSource, /getReviewFiles\("chapter"/);
  assert.match(proposalPanelSource, /SubmittedFilesPanel/);
});

test("Editor mounts proposal and chapter submitted-file panels", () => {
  assert.match(editorHookSource, /getReviewFiles\("proposal", selectedManuscript\.id, "editor"\)/);
  assert.match(editorHookSource, /getReviewFiles\("chapter", chapterId, "editor"\)/);
  assert.match(editorScreenSource, /SubmittedFilesPanel/);
});

test("mobile documentation records file renewal and role boundaries", () => {
  assert.match(readmeSource, /900-second/);
  assert.match(contextSource, /Board.*proposal.*only/is);
  assert.match(fileFlowSource, /Mobile submitted-file review/);
});
