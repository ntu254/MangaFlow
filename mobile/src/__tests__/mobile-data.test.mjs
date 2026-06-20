import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const dataSource = readFileSync(new URL("../data/mobile-data.ts", import.meta.url), "utf8")
const editorDataSource = readFileSync(new URL("../data/editor.ts", import.meta.url), "utf8")
const boardDataSource = readFileSync(new URL("../data/board.ts", import.meta.url), "utf8")
const domainSource = readFileSync(new URL("../domain/workflow.ts", import.meta.url), "utf8")
const dataBoundarySource = readFileSync(new URL("../services/mobile-workflow-data-source.ts", import.meta.url), "utf8")
const authSource = readFileSync(new URL("../services/mobile-auth.ts", import.meta.url), "utf8")
const apiConfigSource = readFileSync(new URL("../services/mobile-api-config.ts", import.meta.url), "utf8")
const editorHookSource = readFileSync(new URL("../hooks/use-editor-mobile-flow.ts", import.meta.url), "utf8")
const boardHookSource = readFileSync(new URL("../hooks/use-board-mobile-flow.ts", import.meta.url), "utf8")
const appSource = readFileSync(new URL("../MangaFlowMobileApp.tsx", import.meta.url), "utf8")
const iconSource = readFileSync(new URL("../design/icons.tsx", import.meta.url), "utf8")
const tokenSource = readFileSync(new URL("../design/tokens.ts", import.meta.url), "utf8")
const mfSource = readFileSync(new URL("../components/mf.tsx", import.meta.url), "utf8")
const headerBackgroundSource = readFileSync(new URL("../components/header-background.tsx", import.meta.url), "utf8")
const boardSource = readFileSync(new URL("../screens/board-screens.tsx", import.meta.url), "utf8")
const editorSource = readFileSync(new URL("../screens/editor-screens.tsx", import.meta.url), "utf8")
const boardPanelsSource = readFileSync(new URL("../screens/board-panels.tsx", import.meta.url), "utf8")
const editorPanelsSource = readFileSync(new URL("../screens/editor-panels.tsx", import.meta.url), "utf8")
const boardActionPanelsSource = readFileSync(new URL("../screens/board-action-panels.tsx", import.meta.url), "utf8")
const editorActionPanelsSource = readFileSync(new URL("../screens/editor-action-panels.tsx", import.meta.url), "utf8")

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
  assert.match(dataBoundarySource, /\/comments\/task\/\$\{firstTaskId\}/)
  assert.match(dataBoundarySource, /\/chapters\/\$\{context\.chapterId\}\/readiness/)
  assert.match(dataBoundarySource, /resolveEditorComment/)
  assert.match(editorHookSource, /resolveSelectedComment/)
})

test("mobile auth flow calls live auth API before role screens", () => {
  assert.match(authSource, /auth\/login/)
  assert.match(authSource, /auth\/me/)
  assert.match(authSource, /auth\/logout/)
  assert.match(authSource, /refreshToken/)
  assert.match(authSource, /Session verification failed/)
  assert.match(authSource, /setMobileWorkflowAuthToken/)
  assert.match(authSource, /getMobileApiBaseUrl/)
  assert.match(authSource, /mobileDemoAccounts/)
  assert.match(apiConfigSource, /localhost:3001/)
  assert.match(apiConfigSource, /10\.0\.2\.2/)
  assert.doesNotMatch(`${authSource}\n${dataBoundarySource}`, /localhost:3002/)
  assert.match(dataBoundarySource, /setMobileWorkflowAuthToken/)
  assert.match(appSource, /MobileAuthScreen/)
  assert.match(appSource, /onAuthenticated/)
  assert.match(appSource, /"Logout"/)
  assert.doesNotMatch(appSource, /Logout from mobile/)
  assert.doesNotMatch(appSource, /Logout Board session/)
  assert.doesNotMatch(appSource, /Logout Editor session/)
  assert.match(appSource, /Live API login/)
  assert.match(appSource, /Mobile registration is disabled/)
  assert.doesNotMatch(appSource, /Sign up/)
  assert.doesNotMatch(appSource, /Register/)
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
  assert.match(dataBoundarySource, /PublicationReadinessService/)
  assert.match(domainSource, /chapterId\?: string/)
  assert.match(domainSource, /taskPriority\?: string/)
  assert.match(domainSource, /taskDueDate\?: string/)
  assert.match(domainSource, /chapterStatus\?: string/)
  assert.match(editorSource, /UI does not duplicate readiness logic/)
})

test("board mock covers ranking and manual at-risk decisions", () => {
  assert.match(boardDataSource, /readerScore: 6\.1/)
  assert.match(boardDataSource, /readerScore: 6\.3/)
  assert.match(boardDataSource, /readerScore: 6\.4/)
  assert.match(boardDataSource, /"REQUEST_IMPROVEMENT_PLAN"/)
  assert.match(boardDataSource, /requiresConfirmation: true/)
  assert.match(boardActionPanelsSource, /Series is not auto-cancelled/)
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
  assert.match(boardActionPanelsSource, /function BoardVoteCount/)
  assert.match(boardActionPanelsSource, /MFIcon name=\{icon\}/)
  assert.match(boardActionPanelsSource, /"alert-triangle"/)
  assert.match(boardActionPanelsSource, /numberOfLines=\{2\}/)
  assert.match(boardActionPanelsSource, /textAlign: "center"/)
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
  assert.match(mfSource, /noteValue/)
  assert.match(mfSource, /confirmationNoteInput/)
  assert.match(mfSource, /buttonDisabled/)
  assert.match(editorHookSource, /pendingProposalAction/)
  assert.match(editorHookSource, /confirmProposalAction/)
  assert.match(editorHookSource, /pendingFinalApprovalAction/)
  assert.match(editorHookSource, /requestEditorProposalRevision/)
  assert.match(editorHookSource, /startEditorProposalReview/)
  assert.match(editorHookSource, /createEditorComment/)
  assert.match(editorHookSource, /editorApproveSubmission/)
  assert.match(editorHookSource, /reopenSelectedComment/)
  assert.match(editorActionPanelsSource, /Live endpoint: POST \/api\/editor\/series\/:seriesId\/start-review/)
  assert.match(editorActionPanelsSource, /Live endpoint: POST \/api\/editor\/series\/:seriesId\/forward-to-board/)
  assert.match(editorActionPanelsSource, /Live endpoint: POST \/api\/submissions\/:submissionId\/editor-approve/)
  assert.match(editorActionPanelsSource, /Live endpoint: POST \/api\/comments/)
  assert.match(editorActionPanelsSource, /Backend validation, permissions, notification, and audit stay server-owned/)
  assert.match(boardHookSource, /pendingVote/)
  assert.match(boardHookSource, /confirmVote/)
  assert.match(boardHookSource, /pendingAtRiskDecision/)
  assert.match(dataBoundarySource, /castBoardVote/)
  assert.match(dataBoundarySource, /finalizeBoardDecision/)
  assert.match(dataBoundarySource, /tieBreakBoardDecision/)
  assert.match(dataBoundarySource, /createBoardAtRiskDecision/)
  assert.match(boardHookSource, /startTieBreakVote/)
  assert.match(boardHookSource, /confirmFinalizeDecision/)
  assert.match(boardHookSource, /actionBusy/)
  assert.match(boardActionPanelsSource, /Live endpoint: POST \/api\/board\/series\/:seriesId\/votes/)
  assert.match(boardActionPanelsSource, /Live endpoint: POST \/api\/board\/series\/:seriesId\/decisions\/finalize/)
  assert.match(boardActionPanelsSource, /Live endpoint: POST \/api\/board\/series\/:seriesId\/decisions\/tie-break/)
  assert.match(boardActionPanelsSource, /Live endpoint: POST \/api\/board\/series\/:seriesId\/at-risk-decisions/)
  assert.match(boardActionPanelsSource, /Backend verifies quorum and vote result/)
  assert.match(boardActionPanelsSource, /Board action remains auditable on the backend/)
  assert.match(boardActionPanelsSource, /Series is never auto-cancelled/)
})

test("mobile queues expose selectable rows that drive detail panels", () => {
  assert.match(mfSource, /selected = false/)
  assert.match(mfSource, /accessibilityState=\{\{ selected \}\}/)
  assert.match(mfSource, /seriesRowSelected/)
  assert.match(mfSource, /Selected/)
  assert.match(editorSource, /setSelectedManuscriptId\(item\.id\)/)
  assert.match(editorSource, /selected=\{flow\.selectedManuscriptId === item\.id\}/)
  assert.match(editorSource, /setSelectedSubmissionId\(item\.id\)/)
  assert.match(editorSource, /EditorSubmissionReviewDetail flow=\{flow\}/)
  assert.match(boardSource, /setSelectedSeriesId\(item\.id\)/)
  assert.match(boardSource, /selected=\{flow\.selectedSeriesId === item\.id\}/)
  assert.match(boardSource, /setSelectedAtRiskId\(risk\.id\)/)
  assert.match(boardSource, /selected=\{flow\.selectedAtRiskId === risk\.id\}/)
})

test("mobile screens expose reusable loading error and empty states", () => {
  assert.match(mfSource, /MFStateNotice/)
  assert.match(mfSource, /MFEmptyState/)
  assert.match(mfSource, /Could not load this mock flow/)
  assert.match(mfSource, /Reading through the async mobile data-source boundary/)
  assert.match(editorSource, /No manuscripts waiting/)
  assert.match(editorSource, /No production comments/)
  assert.match(editorSource, /No final approvals/)
  assert.match(editorSource, /No selected submission/)
  assert.match(boardSource, /No Board reviews/)
  assert.match(boardSource, /No tie-break decisions/)
  assert.match(boardSource, /No ranking import/)
  assert.match(boardSource, /No at-risk cases/)
  assert.doesNotMatch(editorSource, /function StateBanner/)
  assert.doesNotMatch(boardSource, /function StateBanner/)
})

test("mobile rich detail previews preserve backend-owned workflow boundaries", () => {
  assert.match(mfSource, /MFDetailList/)
  assert.match(mfSource, /MFTimeline/)
  assert.match(editorHookSource, /selectedCommentId/)
  assert.match(editorHookSource, /selectedComment/)
  assert.match(dataBoundarySource, /\/tasks\/\$\{taskId\}/)
  assert.match(dataBoundarySource, /\/chapters\/\$\{chapterId\}/)
  assert.match(dataBoundarySource, /\/chapters\/\$\{chapterId\}\/pages/)
  assert.match(dataBoundarySource, /\/comments\/\$\{commentId\}\/reopen/)
  assert.match(editorSource, /Task detail/)
  assert.match(editorSource, /Chapter detail/)
  assert.match(editorSource, /Page metadata/)
  assert.match(editorPanelsSource, /Comment detail/)
  assert.match(editorPanelsSource, /Resolve comment/)
  assert.match(editorPanelsSource, /Reopen comment/)
  assert.match(editorSource, /resolveSelectedComment/)
  assert.match(editorSource, /reopenSelectedComment/)
  assert.match(editorPanelsSource, /Mobile preview does not grant signed file access/)
  assert.match(editorPanelsSource, /Only this status clears the publication blocker/)
  assert.match(editorPanelsSource, /Readiness evidence/)
  assert.match(editorPanelsSource, /backend-owned result/)
  assert.match(boardHookSource, /selectedRankingId/)
  assert.match(boardHookSource, /selectedRanking/)
  assert.match(boardPanelsSource, /Ranking insight/)
  assert.match(boardPanelsSource, /Ranking formula remains backend-owned/)
  assert.match(boardPanelsSource, /Manual Board attention is required; cancellation is not automatic/)
  assert.match(boardPanelsSource, /immutable record/)
})

test("mobile detail panels are componentized out of role screen files", () => {
  assert.match(editorSource, /EditorCommentDetailPanel/)
  assert.match(editorSource, /EditorReadinessEvidencePanel/)
  assert.match(boardSource, /BoardRankingInsightPanel/)
  assert.match(boardSource, /BoardDecisionHistoryPanel/)
  assert.match(editorPanelsSource, /export function EditorCommentDetailPanel/)
  assert.match(editorPanelsSource, /export function EditorReadinessEvidencePanel/)
  assert.match(boardPanelsSource, /export function BoardRankingInsightPanel/)
  assert.match(boardPanelsSource, /export function BoardDecisionHistoryPanel/)
  assert.doesNotMatch(editorSource, /function EditorCommentDetail/)
  assert.doesNotMatch(boardSource, /function BoardRankingInsight/)
  assert.doesNotMatch(boardSource, /function DecisionHistory/)
})

test("mobile action panels are componentized out of role screen files", () => {
  assert.match(editorSource, /EditorProposalDecisionPanel/)
  assert.match(editorSource, /EditorFinalApprovalDecisionPanel/)
  assert.match(boardSource, /BoardVotePanel/)
  assert.match(boardSource, /BoardFinalizeConfirmationPanel/)
  assert.match(boardSource, /BoardVoteConfirmationPanel/)
  assert.match(boardSource, /BoardTieBreakActionsPanel/)
  assert.match(boardSource, /BoardAtRiskDecisionPanel/)
  assert.match(editorActionPanelsSource, /export function EditorProposalDecisionPanel/)
  assert.match(editorActionPanelsSource, /export function EditorFinalApprovalDecisionPanel/)
  assert.match(boardActionPanelsSource, /export function BoardVotePanel/)
  assert.match(boardActionPanelsSource, /export function BoardFinalizeConfirmationPanel/)
  assert.match(boardActionPanelsSource, /export function BoardVoteConfirmationPanel/)
  assert.match(boardActionPanelsSource, /export function BoardTieBreakActionsPanel/)
  assert.match(boardActionPanelsSource, /export function BoardAtRiskDecisionPanel/)
  assert.doesNotMatch(editorSource, /function proposalActionTitle/)
  assert.doesNotMatch(editorSource, /function finalApprovalActionTitle/)
  assert.doesNotMatch(boardSource, /function voteActionTitle/)
  assert.doesNotMatch(boardSource, /function atRiskDecisionTitle/)
})

test("mobile role handoff and profile polish explains scope without adding roles", () => {
  assert.match(appSource, /RoleHandoffSummary/)
  assert.match(appSource, /Editor handoff to Board review/)
  assert.match(appSource, /Board handoff from Editor review/)
  assert.match(appSource, /Mobile handoff copy explains the next surface but does not call workflow endpoints/)
  assert.match(appSource, /Auth, permissions, signed URLs, workflow transitions, readiness, ranking, and payroll remain backend-owned/)
  assert.match(appSource, /mockMobileWorkflowDataSource/)
  assert.match(appSource, /Tantou Editor surfaces only/)
  assert.match(appSource, /Board and Board Chair surfaces only/)
  assert.match(appSource, /No Admin override is represented/)
  assert.doesNotMatch(appSource, /Mangaka companion/)
  assert.doesNotMatch(appSource, /Assistant companion/)
})

test("mobile visual edge cases guard long labels and empty queues", () => {
  assert.match(mfSource, /items\.length === 0/)
  assert.match(mfSource, /No queue items/)
  assert.match(mfSource, /numberOfLines=\{2\}>\{children\}/)
  assert.match(mfSource, /queueValuePill: \{[^}]*maxWidth: 108/)
  assert.match(mfSource, /seriesActionPill: \{[^}]*maxWidth: "100%"/)
  assert.match(mfSource, /tabButton: \{[^}]*minWidth: 0/)
  assert.match(boardActionPanelsSource, /buttonRow: \{[^}]*flexWrap: "wrap"/)
  assert.match(editorActionPanelsSource, /buttonRow: \{[^}]*flexWrap: "wrap"/)
  assert.match(boardSource, /rankingRow: \{[^}]*flexWrap: "wrap"/)
  assert.match(editorSource, /checkRow: \{[^}]*flexWrap: "wrap"/)
  assert.match(editorSource, /commentRow: \{[^}]*flexWrap: "wrap"/)
})

