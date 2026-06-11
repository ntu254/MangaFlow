import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const dataSource = readFileSync(new URL("../data/mobile-data.ts", import.meta.url), "utf8")
const appSource = readFileSync(new URL("../MangaFlowMobileApp.tsx", import.meta.url), "utf8")

test("mobile mock data covers board and editor reference screens", () => {
  for (const symbol of [
    "boardMetrics",
    "boardDecisionCards",
    "boardQueues",
    "boardSeries",
    "atRiskTitles",
    "editorActions",
    "editorQueues",
    "manuscripts",
    "finalApprovals",
    "readinessChecks",
  ]) {
    assert.match(dataSource, new RegExp(`export const ${symbol}`))
  }
})

test("mobile app exposes Board and Tantou Editor role shells", () => {
  assert.match(appSource, /BoardHomeScreen/)
  assert.match(appSource, /BoardReviewsScreen/)
  assert.match(appSource, /BoardTieBreakScreen/)
  assert.match(appSource, /BoardAtRiskScreen/)
  assert.match(appSource, /EditorHomeScreen/)
  assert.match(appSource, /EditorManuscriptsScreen/)
  assert.match(appSource, /EditorReadinessScreen/)
  assert.match(appSource, /EditorSubmissionReviewScreen/)
  assert.match(appSource, /EditorFinalApprovalsScreen/)
})

