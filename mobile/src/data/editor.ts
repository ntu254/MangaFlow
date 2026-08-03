import type {
  ActivityItem,
  CommentItem,
  CommentStatus,
  EditorProposalReviewItem,
  EditorReadinessResult,
  EditorSubmissionReviewItem,
  MetricItem,
  QueueItem,
  SeriesCard,
} from "@/domain/workflow";

export const editorActions: MetricItem[] = [
  {
    id: "proposals",
    label: "Review proposals",
    value: "3",
    tone: "primary",
    icon: "file-text",
    subtitle: "Proposal decisions before Board",
    actionLabel: "Review now",
  },
  {
    id: "approvals",
    label: "Final approve submissions",
    value: "5",
    tone: "success",
    icon: "check-circle",
    subtitle: "Mangaka-approved work",
    actionLabel: "Approve now",
  },
  {
    id: "comments",
    label: "Resolve comments",
    value: "4",
    tone: "warning",
    icon: "message-circle",
    subtitle: "Blocking publication",
    actionLabel: "Resolve now",
  },
  {
    id: "blocked",
    label: "Check blocked chapters",
    value: "2",
    tone: "danger",
    icon: "lock",
    subtitle: "Require readiness attention",
    actionLabel: "Check now",
  },
];

export const editorQueues: QueueItem[] = [
  {
    id: "proposals",
    title: "Proposals Waiting",
    subtitle: "Initial proposals awaiting editor decision",
    value: "3",
    tone: "primary",
    icon: "file-text",
  },
  {
    id: "final",
    title: "Final Approval Queue",
    subtitle: "Submissions already approved by Mangaka",
    value: "5",
    tone: "success",
    icon: "shield-check",
  },
  {
    id: "comments",
    title: "Comments Blocking Publication",
    subtitle: "Unresolved editor-owned blockers",
    value: "4",
    tone: "warning",
    icon: "message-square",
  },
  {
    id: "readiness",
    title: "Readiness Alerts",
    subtitle: "Backend checklist returned blockers",
    value: "2",
    tone: "danger",
    icon: "alert-triangle",
  },
];

export const proposals: EditorProposalReviewItem[] = [
  {
    id: "eclipse",
    title: "Eclipse of Eternity",
    subtitle: "Fantasy / Dark / Action",
    meta: "Version 1.4, submitted 18m ago",
    status: "Waiting Review",
    tone: "primary",
    coverTone: "dark",
    tags: ["Fantasy", "Dark", "Action"],
    seriesStatus: "EDITOR_REVIEW",
    version: "1.4",
    requestedPublicationType: "MONTHLY",
    editorRecommendation: "Check opening pacing before forwarding to Board.",
    decisionActions: ["request-revision", "reject", "forward-to-board"],
  },
  {
    id: "neon-manuscript",
    title: "Neon Reverie",
    subtitle: "Sci-Fi / Psychological / Drama",
    meta: "Version 2.1, submitted 1h ago",
    status: "Revision Uploaded",
    tone: "warning",
    coverTone: "violet",
    tags: ["Sci-Fi", "Psychological", "Drama"],
    seriesStatus: "REVISION_REQUESTED",
    version: "2.1",
    requestedPublicationType: "MONTHLY",
    editorRecommendation: "Revision returned with stronger character motivation.",
    decisionActions: ["request-revision", "forward-to-board"],
  },
  {
    id: "lotus",
    title: "Crimson Lotus",
    subtitle: "Historical / Romance / Drama",
    meta: "Version 3.0, submitted 3h ago",
    status: "Needs Editor Decision",
    tone: "danger",
    coverTone: "red",
    tags: ["Historical", "Romance", "Drama"],
    seriesStatus: "EDITOR_REVIEW",
    version: "3.0",
    requestedPublicationType: "WEEKLY",
    editorRecommendation: "World premise is strong; manuscript clarity is still risky.",
    decisionActions: ["request-revision", "reject"],
  },
  {
    id: "flavors",
    title: "Flavors of Youth",
    subtitle: "Slice of Life / Romance / Food",
    meta: "Version 1.2, submitted 5h ago",
    status: "Ready to Forward",
    tone: "success",
    coverTone: "warm",
    tags: ["Slice of Life", "Romance", "Food"],
    seriesStatus: "EDITOR_REVIEW",
    version: "1.2",
    requestedPublicationType: "MONTHLY",
    editorRecommendation: "Ready for Board review as a monthly proposal.",
    decisionActions: ["forward-to-board"],
  },
];

export const finalApprovals: EditorSubmissionReviewItem[] = [
  {
    id: "inking",
    title: "Page 12 Inking",
    subtitle: "Eclipse of Eternity / Ch. 12",
    meta: "Assistant: Yuki Tanaka",
    status: "Urgent",
    tone: "danger",
    coverTone: "mono",
    taskStatus: "MANGAKA_APPROVED",
    submissionStatus: "MANGAKA_APPROVED",
    assistantName: "Yuki Tanaka",
    mangakaNote: "Line work approved internally; Tantou reviews the consolidated chapter snapshot.",
    linkedCommentCount: 2,
    decisionActions: ["add-comment"],
  },
  {
    id: "lettering",
    title: "Bubble lettering",
    subtitle: "Neon Reverie / Ch. 8",
    meta: "Assistant: Haru K.",
    status: "Waiting",
    tone: "warning",
    coverTone: "mono",
    taskStatus: "MANGAKA_APPROVED",
    submissionStatus: "MANGAKA_APPROVED",
    assistantName: "Haru K.",
    mangakaNote: "Looks good; add a chapter/page comment if spacing still needs work.",
    linkedCommentCount: 1,
    decisionActions: ["add-comment"],
  },
  {
    id: "cleanup",
    title: "Cleanup pass",
    subtitle: "Crimson Lotus / Ch. 7",
    meta: "Assistant: Mei Lin",
    status: "Blocked",
    tone: "danger",
    coverTone: "mono",
    taskStatus: "MANGAKA_APPROVED",
    submissionStatus: "MANGAKA_APPROVED",
    assistantName: "Mei Lin",
    mangakaNote: "Approved after fix, but one blocking comment remains.",
    linkedCommentCount: 3,
    decisionActions: ["add-comment"],
  },
  {
    id: "tone",
    title: "Tone shading",
    subtitle: "Aurora Pulse / Ch. 3",
    meta: "Assistant: Sora Aoki",
    status: "Ready for Tantou",
    tone: "success",
    coverTone: "mono",
    taskStatus: "MANGAKA_APPROVED",
    submissionStatus: "MANGAKA_APPROVED",
    assistantName: "Sora Aoki",
    mangakaNote: "Mangaka approved; Tantou reviews the consolidated chapter snapshot.",
    linkedCommentCount: 0,
    decisionActions: ["add-comment"],
  },
];

export const editorReadinessResult: EditorReadinessResult = {
  chapterTitle: "Eclipse of Eternity / Chapter 12",
  overallPassed: false,
  source: "PublicationReadinessService",
  checks: [
    {
      id: "allPagesUploaded",
      title: "All pages uploaded",
      passed: true,
      reason: "Page files are present.",
    },
    {
      id: "allTasksApproved",
      title: "All tasks approved",
      passed: true,
      reason: "Every required task has a Mangaka-approved current submission.",
    },
    {
      id: "allSubmissionsApproved",
      title: "Current submissions approved",
      passed: true,
      reason: "Every required task points to a Mangaka-approved current submission.",
    },
    {
      id: "allCommentsResolved",
      title: "All comments resolved",
      passed: false,
      reason: "2 blocking comments are still unresolved.",
    },
    {
      id: "tantouReviewSnapshot",
      title: "Tantou review snapshot",
      passed: true,
      reason: "Chapter/page snapshot is frozen for review.",
    },
    {
      id: "publicationDateExists",
      title: "Publication date exists",
      passed: false,
      reason: "Schedule has not been selected.",
    },
  ],
};

export const readinessChecks: QueueItem[] = editorReadinessResult.checks.map((check) => ({
  id: check.id,
  title: check.title,
  subtitle: check.reason,
  value: check.passed ? "Passed" : "Failed",
  tone: check.passed ? "success" : "danger",
  icon: check.passed
    ? "check-circle"
    : check.id === "publicationDateExists"
      ? "calendar"
      : "alert-triangle",
}));

export const commentMetrics: MetricItem[] = [
  { id: "open", label: "Open", value: "6", tone: "primary", icon: "message-square" },
  {
    id: "addressed",
    label: "Addressed by Mangaka",
    value: "4",
    tone: "success",
    icon: "check-circle",
  },
  { id: "blocking", label: "Blocking", value: "2", tone: "danger", icon: "alert-triangle" },
  { id: "resolved", label: "Resolved Today", value: "3", tone: "neutral", icon: "calendar" },
];

export type EditorCommentItem = CommentItem & {
  canonicalStatus: CommentStatus;
  isBlocking: boolean;
};

export const productionComments: EditorCommentItem[] = [
  {
    id: "eclipse-p18",
    title: "Eclipse of Eternity / Ch.12 / Page 18",
    body: "Please soften texture around the speech bubble before final approval.",
    owner: "Mangaka",
    status: "Open",
    canonicalStatus: "OPEN",
    tone: "danger",
    action: "Review",
    page: "18",
    coverTone: "mono",
    isBlocking: true,
  },
  {
    id: "neon-p12",
    title: "Neon Reverie / Ch.8 / Page 12",
    body: "Check letter spacing consistency in the upper-right bubble.",
    owner: "Editor",
    status: "Reopened",
    canonicalStatus: "REOPENED",
    tone: "warning",
    action: "Resolve",
    page: "12",
    coverTone: "mono",
    isBlocking: true,
  },
  {
    id: "lotus-p05",
    title: "Crimson Lotus / Ch.7 / Page 05",
    body: "Background cleanup needs one remaining edge checked.",
    owner: "Editor",
    status: "Open",
    canonicalStatus: "OPEN",
    tone: "danger",
    action: "Resolve",
    page: "05",
    coverTone: "mono",
    isBlocking: true,
  },
  {
    id: "dawn-p03",
    title: "Dawn of Ashes / Ch.10 / Page 03",
    body: "Panel rhythm approved. Keep lighting direction consistent with previous page.",
    owner: "Editor",
    status: "Resolved",
    canonicalStatus: "RESOLVED",
    tone: "neutral",
    action: "Reopen",
    page: "03",
    coverTone: "mono",
    isBlocking: false,
  },
];

export const commentActivity: ActivityItem[] = [
  {
    id: "addressed",
    title: "Mangaka addressed comment / Crimson Lotus Ch.7 Pg05",
    time: "20m ago",
    tone: "success",
    icon: "check-circle",
  },
  {
    id: "resolved",
    title: "You resolved 1 comment / Dawn of Ashes Ch.10 Pg03",
    time: "1h ago",
    tone: "primary",
    icon: "message-circle",
  },
];

export const editorActivity: ActivityItem[] = [
  {
    id: "approve",
    title: "You approved Ch.11 of Eclipse of Eternity",
    time: "18m ago",
    tone: "success",
    icon: "check-circle",
  },
  {
    id: "comments",
    title: "2 new comments on Ch.10 - Dawn of Ashes",
    time: "1h ago",
    tone: "warning",
    icon: "message-circle",
  },
  {
    id: "submission",
    title: "New submission: Shikkoku no Tenshi / Ch.7",
    time: "2h ago",
    tone: "primary",
    icon: "file-text",
  },
  {
    id: "blocked",
    title: "Ch.8 of Crimson Lotus is blocked",
    time: "3h ago",
    tone: "danger",
    icon: "lock",
  },
];

export const editorHome = {
  actions: editorActions,
  queues: editorQueues,
  activity: editorActivity,
  priorityProposal: proposals[0],
  readiness: editorReadinessResult,
};

export function toneCount(
  items: Array<{ tone: import("@/domain/workflow").Tone }>,
  tone: import("@/domain/workflow").Tone,
): number {
  return items.filter((item) => item.tone === tone).length;
}
