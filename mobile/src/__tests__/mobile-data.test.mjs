import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const dataSource = readFileSync(new URL("../data/mobile-data.ts", import.meta.url), "utf8")
const appSource = readFileSync(new URL("../MangaFlowMobileApp.tsx", import.meta.url), "utf8")
const iconSource = readFileSync(new URL("../design/icons.tsx", import.meta.url), "utf8")

test("mobile mock data covers board and editor reference screens", () => {
  for (const symbol of [
    "boardMetrics",
    "boardDecisionCards",
    "boardQueues",
    "boardSeries",
    "atRiskTitles",
    "editorActions",
    "editorQueues",
    "commentMetrics",
    "productionComments",
    "commentActivity",
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
  assert.match(appSource, /EditorCommentsScreen/)
  assert.match(appSource, /EditorReadinessScreen/)
})

test("mobile icon system follows the requirement mapping", () => {
  for (const iconName of [
    "bell",
    "chevron-right",
    "home",
    "file-text",
    "message-circle",
    "shield-check",
    "circle-user",
    "check-circle",
    "scale-balance",
    "alert-triangle",
    "lock",
    "bar-chart-2",
    "refresh-cw",
    "calendar",
  ]) {
    assert.match(iconSource, new RegExp(`"${iconName}"`))
  }

  assert.match(iconSource, /lucide-react-native/)
  assert.match(iconSource, /MaterialCommunityIcons/)
})

