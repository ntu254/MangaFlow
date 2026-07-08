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
  EDITORIAL_QUEUE: "Editorial Queue",
  CHAPTER_SCOPE: "Chapter scope",
  TASK_ONLY: "Task-only",
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
  | "ONLY_BOARD_MEMBERS_CAN_VOTE";

export const RESTRICTION_LABEL: Record<RestrictionCode, string> = {
  TASK_ONLY_SCOPE: "Bạn chỉ có quyền xem task được giao.",
  NOT_ASSIGNED_EDITOR: "Bạn không phải Editor phụ trách series này.",
  BOARD_REVIEW_ONLY: "Board chỉ xem gói quyết định và tài liệu read-only.",
  SELF_APPROVAL_BLOCKED: "Bạn không thể duyệt submission do chính mình nộp.",
  LAST_ADMIN_BLOCKED: "Không thể gỡ quyền Admin cuối cùng của hệ thống.",
  CALLBACK_MISSING: "Thao tác này chưa được backend hỗ trợ trong MVP.",
  ADMIN_OVERRIDE_REQUIRED: "Thao tác này yêu cầu Admin Override.",
  ROLE_FORBIDDEN: "Không có quyền thực hiện thao tác này.",
  ONLY_BOARD_MEMBERS_CAN_VOTE: "Chi thanh vien Board moi duoc vote trong phien dang mo.",
};

export const DEFAULT_ALLOWED_ACTIONS: Record<Role, string[]> = {
  admin: ["Inspect system data", "Manage users", "View audit logs", "Configure settings"],
  mangaka: [
    "Create series",
    "Manage owned chapters",
    "Review assistant submissions",
    "Manage materials",
  ],
  assistant: ["View assigned task", "Submit work", "Read feedback", "View own earnings"],
  editor: ["Review proposals", "Annotate pages", "Request revision", "Monitor deadlines"],
  board: ["Review decision package", "Vote proposals", "View rankings", "Handle at-risk reviews"],
};

export const DEFAULT_RESTRICTED_ACTIONS: Record<Role, string[]> = {
  admin: [
    "Submit assistant work",
    "Vote as Board by default",
    "Approve content as Editor by default",
  ],
  mangaka: ["Board voting", "Admin settings", "System audit logs"],
  assistant: ["Board decisions", "Ranking import", "Team management", "Other assistant earnings"],
  editor: ["Assistant payroll actions", "Admin user management", "Board final vote"],
  board: ["Creative file editing", "Assistant task creation", "Payroll", "Admin user management"],
};
