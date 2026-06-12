import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const dataSource = readFileSync(new URL("../data/mobile-data.ts", import.meta.url), "utf8")
const appSource = readFileSync(new URL("../MangaFlowMobileApp.tsx", import.meta.url), "utf8")
const iconSource = readFileSync(new URL("../design/icons.tsx", import.meta.url), "utf8")
const tokenSource = readFileSync(new URL("../design/tokens.ts", import.meta.url), "utf8")
const mfSource = readFileSync(new URL("../components/mf.tsx", import.meta.url), "utf8")
const headerBackgroundSource = readFileSync(new URL("../components/header-background.tsx", import.meta.url), "utf8")
const boardSource = readFileSync(new URL("../screens/board-screens.tsx", import.meta.url), "utf8")

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

test("mobile header background uses the shared manga wash treatment", () => {
  assert.match(tokenSource, /headerWash/)
  assert.match(mfSource, /MFHeaderBackground/)
  assert.match(headerBackgroundSource, /expo-image/)
  assert.match(headerBackgroundSource, /header-editor-wash\.png/)
  assert.match(headerBackgroundSource, /header-board-wash\.png/)
  assert.match(headerBackgroundSource, /useWindowDimensions/)
  assert.match(headerBackgroundSource, /contentPosition="right top"/)
  assert.ok(existsSync(new URL("../../assets/backgrounds/header-editor-wash.png", import.meta.url)))
  assert.ok(existsSync(new URL("../../assets/backgrounds/header-board-wash.png", import.meta.url)))
})

test("mobile UI requirement polish is represented in shared components", () => {
  for (const tokenValue of ["#5d38f5", "#4f26e9", "#10b981", "#ef4444", "#f59e0b"]) {
    assert.match(tokenSource, new RegExp(tokenValue))
  }

  assert.match(appSource, /role=\{role\}/)
  assert.match(mfSource, /actionSubtitle/)
  assert.match(mfSource, /seriesTag/)
  assert.match(mfSource, /seriesActionPill/)
  assert.match(dataSource, /actionLabel/)
  assert.match(dataSource, /tags:/)
})

test("board vote split shows semantic icons and centered labels", () => {
  assert.match(boardSource, /function VoteCount/)
  assert.match(boardSource, /MFIcon name=\{icon\}/)
  assert.match(boardSource, /"alert-triangle"/)
  assert.match(boardSource, /numberOfLines=\{2\}/)
  assert.match(boardSource, /textAlign: "center"/)
})

test("mobile action cards use responsive centered layout", () => {
  assert.match(mfSource, /useWindowDimensions/)
  assert.match(mfSource, /compactCards/)
  assert.match(mfSource, /actionGridCompact/)
  assert.match(mfSource, /numberOfLines=\{2\}/)
})

