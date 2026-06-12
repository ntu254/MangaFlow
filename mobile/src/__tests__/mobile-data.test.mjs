import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const dataSource = readFileSync(new URL("../data/mobile-data.ts", import.meta.url), "utf8")
const editorDataSource = readFileSync(new URL("../data/editor.ts", import.meta.url), "utf8")
const boardDataSource = readFileSync(new URL("../data/board.ts", import.meta.url), "utf8")
const domainSource = readFileSync(new URL("../domain/workflow.ts", import.meta.url), "utf8")
const dataBoundarySource = readFileSync(new URL("../services/mobile-workflow-data-source.ts", import.meta.url), "utf8")
const editorHookSource = readFileSync(new URL("../hooks/use-editor-mobile-flow.ts", import.meta.url), "utf8")
const boardHookSource = readFileSync(new URL("../hooks/use-board-mobile-flow.ts", import.meta.url), "utf8")
const appSource = readFileSync(new URL("../MangaFlowMobileApp.tsx", import.meta.url), "utf8")
const iconSource = readFileSync(new URL("../design/icons.tsx", import.meta.url), "utf8")
const tokenSource = readFileSync(new URL("../design/tokens.ts", import.meta.url), "utf8")
const mfSource = readFileSync(new URL("../components/mf.tsx", import.meta.url), "utf8")
const headerBackgroundSource = readFileSync(new URL("../components/header-background.tsx", import.meta.url), "utf8")
const boardSource = readFileSync(new URL("../screens/board-screens.tsx", import.meta.url), "utf8")
const editorSource = readFileSync(new URL("../screens/editor-screens.tsx", import.meta.url), "utf8")

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
    assert.match(`${dataSource}\n${editorDataSource}\n${boardDataSource}`, new RegExp(`export const ${symbol}`))
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
  assert.match(appSource, /BoardRankingScreen/)
})

test("mobile data source exposes API-ready role methods", () => {
  for (const method of [
    "getEditorHome",
    "getEditorManuscripts",
    "getEditorSubmissions",
    "getEditorComments",
    "getEditorReadiness",
    "getBoardHome",
    "getBoardSeriesReviews",
    "getBoardTieBreaks",
    "getBoardRankings",
    "getBoardAtRiskCases",
    "getBoardDecisionHistory",
  ]) {
    assert.match(dataBoundarySource, new RegExp(`${method}\\(`))
  }

  assert.match(dataBoundarySource, /mockMobileWorkflowDataSource/)
  assert.match(editorHookSource, /useEditorMobileFlow/)
  assert.match(boardHookSource, /useBoardMobileFlow/)
})

test("mobile domain uses canonical workflow values from contracts", () => {
  for (const value of [
    "BOARD_REVIEW",
    "MANGAKA_APPROVED",
    "EDITOR_APPROVED",
    "OPEN",
    "FIXED_BY_ASSISTANT",
    "VERIFIED_BY_MANGAKA",
    "RESOLVED_BY_EDITOR",
    "APPROVE",
    "REJECT",
    "NEEDS_REVISION",
    "TIE_BREAK_REQUIRED",
    "CONTINUE",
    "WARNING",
    "REQUEST_IMPROVEMENT_PLAN",
    "CANCEL",
  ]) {
    assert.match(domainSource, new RegExp(`"${value}"`))
  }
})

test("readiness mock is backend-owned result shape, not UI calculation", () => {
  assert.match(editorDataSource, /source: "PublicationReadinessService"/)
  assert.match(editorDataSource, /passed: false/)
  assert.match(editorDataSource, /reason:/)
  assert.match(editorSource, /UI does not duplicate readiness logic/)
})

test("board mock covers ranking and manual at-risk decisions", () => {
  assert.match(boardDataSource, /readerScore: 6\.1/)
  assert.match(boardDataSource, /readerScore: 6\.3/)
  assert.match(boardDataSource, /readerScore: 6\.4/)
  assert.match(boardDataSource, /"REQUEST_IMPROVEMENT_PLAN"/)
  assert.match(boardDataSource, /requiresConfirmation: true/)
  assert.match(boardSource, /Series is not auto-cancelled/)
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
  assert.match(headerBackgroundSource, /nen\.jpg/)
  assert.match(headerBackgroundSource, /nen1\.jpg/)
  assert.match(headerBackgroundSource, /useWindowDimensions/)
  assert.match(headerBackgroundSource, /contentPosition="right top"/)
  assert.match(headerBackgroundSource, /contentFit="cover"/)
  assert.match(headerBackgroundSource, /bottomFadeStrong/)
  assert.doesNotMatch(mfSource, /MFHeaderBackground compact/)
  assert.ok(existsSync(new URL("../../assets/images/nen.jpg", import.meta.url)))
  assert.ok(existsSync(new URL("../../assets/images/nen1.jpg", import.meta.url)))
})

test("mobile UI requirement polish is represented in shared components", () => {
  for (const tokenValue of ["#5d38f5", "#4f26e9", "#10b981", "#ef4444", "#f59e0b"]) {
    assert.match(tokenSource, new RegExp(tokenValue))
  }

  assert.match(appSource, /role=\{role\}/)
  assert.match(mfSource, /actionSubtitle/)
  assert.match(mfSource, /seriesTag/)
  assert.match(mfSource, /seriesActionPill/)
  assert.match(`${editorDataSource}\n${boardDataSource}`, /actionLabel/)
  assert.match(`${editorDataSource}\n${boardDataSource}`, /tags:/)
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

test("recent activity lists use tone-mapped icons", () => {
  assert.match(boardDataSource, /boardActivity[\s\S]*icon: "check-circle"/)
  assert.match(boardDataSource, /boardActivity[\s\S]*icon: "scale-balance"/)
  assert.match(editorDataSource, /editorActivity[\s\S]*icon: "message-circle"/)
  assert.match(editorDataSource, /editorActivity[\s\S]*icon: "lock"/)
  assert.match(mfSource, /defaultActivityIcons/)
  assert.match(mfSource, /item\.icon \?\? defaultActivityIcons/)
  assert.match(mfSource, /activityIcon/)
  assert.doesNotMatch(mfSource, /activityDot/)
})

test("mobile series covers use provided manga artwork assets", () => {
  assert.match(mfSource, /biatruyen\.jpg/)
  assert.match(mfSource, /biatruyen1\.jpg/)
  assert.match(mfSource, /contentFit="cover"/)
  assert.match(editorSource, /commentPanelImage/)
  assert.match(editorSource, /biatruyen\.jpg/)
  assert.match(editorSource, /biatruyen1\.jpg/)
  assert.ok(existsSync(new URL("../../assets/images/biatruyen.jpg", import.meta.url)))
  assert.ok(existsSync(new URL("../../assets/images/biatruyen1.jpg", import.meta.url)))
})

test("mobile decision actions require confirmation detail before mock recording", () => {
  assert.match(mfSource, /MFConfirmationPanel/)
  assert.match(mfSource, /Confirmation required/)
  assert.match(editorHookSource, /pendingProposalAction/)
  assert.match(editorHookSource, /confirmProposalAction/)
  assert.match(editorHookSource, /pendingFinalApprovalAction/)
  assert.match(editorSource, /Future endpoint: POST \/api\/manuscripts\/:manuscriptId\/forward-to-board/)
  assert.match(editorSource, /Future endpoint: POST \/api\/submissions\/:submissionId\/editor-approve/)
  assert.match(boardHookSource, /pendingVote/)
  assert.match(boardHookSource, /confirmVote/)
  assert.match(boardHookSource, /pendingAtRiskDecision/)
  assert.match(boardSource, /Future endpoint: POST \/api\/board\/series\/:seriesId\/votes/)
  assert.match(boardSource, /Future endpoint: POST \/api\/board\/series\/:seriesId\/decisions\/tie-break/)
  assert.match(boardSource, /Future endpoint: POST \/api\/board\/series\/:seriesId\/at-risk-decisions/)
  assert.match(boardSource, /Series is never auto-cancelled/)
})

