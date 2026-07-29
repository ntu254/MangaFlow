// Re-export all generic UI components from shared/ui
export {
  PageFrame,
  PageHeader,
  MetricCard,
  Panel,
  Surface,
  SURFACE_CLASSES,
  Notice,
  StateBlock,
  ActionButton,
  TextButton,
  AvatarInitials,
  Divider,
  InspectorSection,
  InfoRow,
  OverrideDialog,
  PageGuard,
  MetricGrid,
  DataTable,
  SearchToolbar,
} from "@/shared/ui";

// Re-export TableSkeleton from shared layout (used by admin pages)
export { TableSkeleton as AdminTableSkeleton } from "@/shared/layout/page-layout";

// Admin-specific components (depend on entities — can't live in shared/ui)
export { AccessDenied } from "./components/admin-access";
export { useAdminAccess } from "./components/admin-access-hooks";
export type { AdminAccessDenial } from "./components/admin-access-hooks";

// Backward-compatible aliases (Admin* → new names)
export {
  PageFrame as AdminPageFrame,
  PageHeader as AdminPageHeader,
  MetricCard as AdminMetricCard,
  Panel as AdminPanel,
  Surface as AdminSurface,
  Notice as AdminNotice,
  StateBlock as AdminStateBlock,
  ActionButton as AdminActionButton,
  TextButton as AdminTextButton,
  AvatarInitials as AdminAvatarInitials,
  Divider as AdminDivider,
  InspectorSection as AdminInspectorSection,
  InfoRow as AdminInfoRow,
  OverrideDialog as AdminOverrideDialog,
} from "@/shared/ui";

export { AccessDenied as AdminAccessDenied } from "./components/admin-access";

// Re-export shared utilities
export { mapAdminError } from "./api/admin-queries";
export { adminKeys } from "./api/admin-queries";
export { useAdminWorkflowSummaryQuery } from "./api/admin-queries";
export { useDemoDataMutation } from "./api/admin-queries";
export type { AdminUser, Earning, EarningItem } from "./api/admin-queries";

// Model exports
export { formatDateTime, formatJpy, getAdminUsers } from "./model/admin-data";
export { formatStorageSize } from "./model/material-format";
