import type { Role } from "@/shared/auth";

export type AccessScope =
  | "OWNER"
  | "FULL_SERIES"
  | "ASSIGNED_SERIES"
  | "EDITORIAL_QUEUE"
  | "CHAPTER_SCOPE"
  | "TASK_ONLY"
  | "BOARD_REVIEW_ONLY"
  | "READ_ONLY"
  | "GLOBAL";

export const ROLE_BUSINESS_LABEL: Record<Role, string> = {
  admin: "System operator",
  mangaka: "Production owner",
  assistant: "Task executor",
  editor: "Editorial reviewer",
  board: "Governance",
};

export const SCOPE_LABEL: Record<AccessScope, string> = {
  OWNER: "Owner",
  FULL_SERIES: "Full series",
  ASSIGNED_SERIES: "Assigned series",
  EDITORIAL_QUEUE: "Editorial queue",
  CHAPTER_SCOPE: "Chapter scope",
  TASK_ONLY: "Task only",
  BOARD_REVIEW_ONLY: "Board review only",
  READ_ONLY: "Read-only",
  GLOBAL: "Global",
};

export type RestrictionCode =
  | "TASK_ONLY_SCOPE"
  | "NOT_ASSIGNED_EDITOR"
  | "BOARD_REVIEW_ONLY"
  | "SELF_APPROVAL_BLOCKED"
  | "LAST_ADMIN_BLOCKED"
  | "CALLBACK_MISSING"
  | "ADMIN_OVERRIDE_REQUIRED"
  | "ROLE_FORBIDDEN"
  | "ONLY_BOARD_MEMBERS_CAN_VOTE"
  | "NO_ACTIVE_VOTING_SESSION";

export const RESTRICTION_LABEL: Record<RestrictionCode, string> = {
  TASK_ONLY_SCOPE: "You can only access tasks assigned to you.",
  NOT_ASSIGNED_EDITOR: "You are not the assigned Editor for this series.",
  BOARD_REVIEW_ONLY: "Board members can only review decision packages and read-only materials.",
  SELF_APPROVAL_BLOCKED: "You cannot approve a submission you created.",
  LAST_ADMIN_BLOCKED: "The final active Admin account cannot be removed.",
  CALLBACK_MISSING: "This action is not supported in the MVP backend yet.",
  ADMIN_OVERRIDE_REQUIRED: "This action requires an Admin override.",
  ROLE_FORBIDDEN: "You do not have permission to perform this action.",
  ONLY_BOARD_MEMBERS_CAN_VOTE: "Only Board members can vote in an open session.",
  NO_ACTIVE_VOTING_SESSION: "No VotingSession is open yet — ask the Board chair to open one first.",
};

export const DEFAULT_ALLOWED_ACTIONS: Record<Role, string[]> = {
  admin: ["View operational summaries", "Manage users", "Configure RateTable"],
  mangaka: [
    "Create proposals and chapters",
    "Manage owned chapters",
    "Review assistant submissions",
    "Manage materials",
  ],
  assistant: ["View assigned task", "Submit work", "Read feedback", "View own earnings"],
  editor: ["Review proposals", "Annotate reviews", "Request revision", "Monitor deadlines"],
  board: ["Review decision package", "Vote proposals", "View rankings", "Handle at-risk reviews"],
};

export const DEFAULT_RESTRICTED_ACTIONS: Record<Role, string[]> = {
  admin: [
    "Submit assistant work",
    "Vote as Board by default",
    "Approve content as Editor by default",
  ],
  mangaka: ["Board voting", "Admin operations", "System internals"],
  assistant: ["Board decisions", "Ranking import", "Team management", "Other assistant earnings"],
  editor: [
    "Modify Chapter or Page evidence",
    "Assistant earnings adjustments",
    "Admin user management",
    "Board final vote",
  ],
  board: [
    "Creative file editing",
    "Assistant task creation",
    "Earnings Tracking",
    "Admin user management",
  ],
};
