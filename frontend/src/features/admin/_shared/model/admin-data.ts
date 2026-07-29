import type { Role, User } from "@/shared/auth";
import { ASSISTANTS, BOARD_MEMBERS, MANGAKAS } from "@/shared/auth";
import type { AccessScope } from "@/entities/access/model/access-labels";

export type AdminUserStatus = "ACTIVE" | "INVITED" | "LOCKED";

export type AdminUserRow = User & {
  scope: AccessScope;
  status: AdminUserStatus;
  lastActiveAt: string;
  assignedSeries: number;
};

export type AdminRoleRow = {
  role: Role;
  scope: AccessScope;
  businessOwner: string;
  allowed: string[];
  restricted: string[];
};

export type PayrollRow = {
  id: string;
  assistantId: string;
  assistantName: string;
  period: string;
  approvedTasks: number;
  grossJpy: number;
  status: "CALCULATED" | "READY" | "PAID";
};

export type StorageAssetRow = {
  id: string;
  title: string;
  owner: string;
  kind: string;
  sizeMb: number;
  status: "SIGNED_URL_ONLY" | "INDEXED" | "ORPHAN_CHECK";
  updatedAt: string;
};

const adminUser: AdminUserRow = {
  id: "u-admin",
  name: "Hayashi Admin",
  email: "admin@beachread.jp",
  role: "admin",
  scope: "GLOBAL",
  status: "ACTIVE",
  lastActiveAt: "2026-06-24T09:15:00.000Z",
  assignedSeries: 0,
};

const editorUser: AdminUserRow = {
  id: "u-editor",
  name: "Tanaka Akira",
  email: "tanaka@beachread.jp",
  role: "editor",
  isEditorInChief: true,
  scope: "FULL_SERIES",
  status: "ACTIVE",
  lastActiveAt: "2026-06-24T08:48:00.000Z",
  assignedSeries: 7,
};

export function getAdminUsers(): AdminUserRow[] {
  return [
    adminUser,
    editorUser,
    ...MANGAKAS.map((user, index) => ({
      ...user,
      scope: "OWNER" as AccessScope,
      status: "ACTIVE" as AdminUserStatus,
      lastActiveAt: index === 0 ? "2026-06-24T08:05:00.000Z" : "2026-06-21T11:20:00.000Z",
      assignedSeries: 3,
    })),
    ...ASSISTANTS.map((user, index) => ({
      ...user,
      scope: "TASK_ONLY" as AccessScope,
      status: (index === 2 ? "INVITED" : "ACTIVE") as AdminUserStatus,
      lastActiveAt: index === 2 ? "2026-06-20T03:40:00.000Z" : "2026-06-24T07:30:00.000Z",
      assignedSeries: index === 0 ? 2 : 1,
    })),
    ...BOARD_MEMBERS.map((user, index) => ({
      ...user,
      scope: "BOARD_REVIEW_ONLY" as AccessScope,
      status: "ACTIVE" as AdminUserStatus,
      lastActiveAt: index === 0 ? "2026-06-24T06:45:00.000Z" : "2026-06-23T12:00:00.000Z",
      assignedSeries: 0,
    })),
  ];
}

export const roleRows: AdminRoleRow[] = [
  {
    role: "admin",
    scope: "GLOBAL",
    businessOwner: "Studio Operations",
    allowed: [
      "Manage users",
      "Inspect every workflow",
      "Override with reason",
      "Earnings tracking",
    ],
    restricted: ["Creative approval requires override reason", "No silent destructive actions"],
  },
  {
    role: "mangaka",
    scope: "OWNER",
    businessOwner: "Series Creator",
    allowed: ["Create proposals", "Approve assistant submissions", "Manage owned series materials"],
    restricted: ["Cannot vote as Board", "Cannot run payment workflow"],
  },
  {
    role: "assistant",
    scope: "TASK_ONLY",
    businessOwner: "Production Support",
    allowed: ["View assigned tasks", "Submit work", "Track earnings"],
    restricted: ["No series-level edits", "No final approvals"],
  },
  {
    role: "editor",
    scope: "FULL_SERIES",
    businessOwner: "Editorial Desk",
    allowed: ["Review proposals", "Approve chapters", "Forward to board", "Prepare publication"],
    restricted: ["Cannot vote on board decisions", "Cannot self-approve own submission"],
  },
  {
    role: "board",
    scope: "BOARD_REVIEW_ONLY",
    businessOwner: "Governance Board",
    allowed: ["Read proposal packets", "Vote", "Finalize rankings", "At-risk decisions"],
    restricted: ["No creative file edits", "No task creation", "No earnings mutation"],
  },
];

export const payrollRows: PayrollRow[] = ASSISTANTS.map((assistant, index) => ({
  id: `pay-${index + 1}`,
  assistantId: assistant.id,
  assistantName: assistant.name,
  period: "2026-W26",
  approvedTasks: [12, 8, 3][index] ?? 4,
  grossJpy: [184000, 126000, 42000][index] ?? 64000,
  status: index === 2 ? "CALCULATED" : "READY",
}));

export const storageAssets: StorageAssetRow[] = [
  {
    id: "asset-1",
    title: "Vagabond Ch.328 storyboard packet",
    owner: "Inoue Takehiko",
    kind: "Storyboard",
    sizeMb: 148,
    status: "INDEXED",
    updatedAt: "2026-06-24T04:12:00.000Z",
  },
  {
    id: "asset-2",
    title: "Berserk proposal sample pages",
    owner: "Tanaka Akira",
    kind: "Manuscript",
    sizeMb: 96,
    status: "SIGNED_URL_ONLY",
    updatedAt: "2026-06-23T09:18:00.000Z",
  },
  {
    id: "asset-3",
    title: "Ranking import 2026-W26.csv",
    owner: "Board Office",
    kind: "CSV",
    sizeMb: 2,
    status: "ORPHAN_CHECK",
    updatedAt: "2026-06-24T02:01:00.000Z",
  },
];

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatJpy(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}
