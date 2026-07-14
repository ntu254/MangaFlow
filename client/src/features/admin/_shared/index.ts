export {
  ActionButton,
  AvatarInitials,
  DataTable,
  Divider,
  InfoRow,
  InspectorSection,
  MetricCard,
  MetricGrid,
  Notice,
  OverrideDialog,
  PageFrame,
  PageGuard,
  PageHeader,
  Panel,
  SearchToolbar,
  StateBlock,
  Surface,
  SURFACE_CLASSES,
  TextButton,
} from "@/shared/ui";

export { TableSkeleton as AdminTableSkeleton } from "@/shared/layout/page-layout";

export { AccessDenied } from "./components/admin-access";
export { useAdminAccess } from "./components/admin-access-hooks";
export type { AdminAccessDenial } from "./components/admin-access-hooks";

export {
  ActionButton as AdminActionButton,
  AvatarInitials as AdminAvatarInitials,
  Divider as AdminDivider,
  InfoRow as AdminInfoRow,
  InspectorSection as AdminInspectorSection,
  MetricCard as AdminMetricCard,
  Notice as AdminNotice,
  OverrideDialog as AdminOverrideDialog,
  PageFrame as AdminPageFrame,
  PageHeader as AdminPageHeader,
  Panel as AdminPanel,
  StateBlock as AdminStateBlock,
  Surface as AdminSurface,
  TextButton as AdminTextButton,
} from "@/shared/ui";

export { AccessDenied as AdminAccessDenied } from "./components/admin-access";

export { adminKeys, mapAdminError } from "./api/admin-queries";
export type { AdminUser } from "./api/admin-queries";
