import type { LucideIcon } from "lucide-react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock3, 
  FileEdit, 
  Send, 
  XCircle,
  Eye,
  ShieldAlert,
  Wallet,
  FileText
} from "lucide-react";

export type StatusTone = 'slate' | 'violet' | 'purple' | 'amber' | 'emerald' | 'red' | 'blue' | 'fuchsia';

export interface StatusUiConfig {
  label: string;
  tone: StatusTone;
  className: string;
  icon: LucideIcon;
}

// Helper to generate static Tailwind classes based on tone
// We use static strings so Tailwind's compiler doesn't miss them.
const getToneClasses = (tone: StatusTone): string => {
  switch (tone) {
    case 'slate': return "bg-slate-50 text-slate-700 border-slate-200";
    case 'violet': return "bg-violet-50 text-violet-700 border-violet-200";
    case 'purple': return "bg-purple-50 text-purple-700 border-purple-200";
    case 'amber': return "bg-amber-50 text-amber-700 border-amber-200";
    case 'emerald': return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case 'red': return "bg-rose-50 text-rose-700 border-rose-200";
    case 'blue': return "bg-blue-50 text-blue-700 border-blue-200";
    case 'fuchsia': return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

// ==========================================
// Domain-Specific Status Mappings
// ==========================================

export const genericStatusUi: Record<string, StatusUiConfig> = {
  DRAFT: {
    label: "Draft",
    tone: "slate",
    className: getToneClasses("slate"),
    icon: FileEdit,
  },
  IN_PROGRESS: {
    label: "In Progress",
    tone: "blue",
    className: getToneClasses("blue"),
    icon: Clock3,
  },
  REVIEW: {
    label: "Review",
    tone: "amber",
    className: getToneClasses("amber"),
    icon: Eye,
  },
  COMPLETED: {
    label: "Completed",
    tone: "emerald",
    className: getToneClasses("emerald"),
    icon: CheckCircle2,
  },
  BLOCKED: {
    label: "Blocked",
    tone: "red",
    className: getToneClasses("red"),
    icon: XCircle,
  },
};

export const seriesStatusUi: Record<string, StatusUiConfig> = {
  DRAFT: {
    label: "Draft",
    tone: "slate",
    className: getToneClasses("slate"),
    icon: FileEdit,
  },
  EDITOR_REVIEW: {
    label: "Editor Review",
    tone: "purple",
    className: getToneClasses("purple"),
    icon: Eye,
  },
  BOARD_REVIEW: {
    label: "Board Review",
    tone: "amber",
    className: getToneClasses("amber"),
    icon: ShieldAlert,
  },
  ONGOING: {
    label: "Ongoing",
    tone: "emerald",
    className: getToneClasses("emerald"),
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "red",
    className: getToneClasses("red"),
    icon: XCircle,
  },
};

export const taskStatusUi: Record<string, StatusUiConfig> = {
  TODO: {
    label: "To Do",
    tone: "slate",
    className: getToneClasses("slate"),
    icon: FileText,
  },
  IN_PROGRESS: {
    label: "In Progress",
    tone: "blue",
    className: getToneClasses("blue"),
    icon: Clock3,
  },
  SUBMITTED: {
    label: "Submitted",
    tone: "purple",
    className: getToneClasses("purple"),
    icon: Send,
  },
  REVISION_REQUESTED: {
    label: "Revision Requested",
    tone: "amber",
    className: getToneClasses("amber"),
    icon: AlertTriangle,
  },
  APPROVED: {
    label: "Approved",
    tone: "emerald",
    className: getToneClasses("emerald"),
    icon: CheckCircle2,
  },
};

export const publicationStatusUi: Record<string, StatusUiConfig> = {
  SCHEDULED: {
    label: "Scheduled",
    tone: "amber",
    className: getToneClasses("amber"),
    icon: Clock3,
  },
  PUBLISHED: {
    label: "Published",
    tone: "emerald",
    className: getToneClasses("emerald"),
    icon: CheckCircle2,
  },
  ARCHIVED: {
    label: "Archived",
    tone: "slate",
    className: getToneClasses("slate"),
    icon: FileText,
  },
};

export const earningStatusUi: Record<string, StatusUiConfig> = {
  PENDING: {
    label: "Pending",
    tone: "amber",
    className: getToneClasses("amber"),
    icon: Clock3,
  },
  CONFIRMED: {
    label: "Confirmed",
    tone: "blue",
    className: getToneClasses("blue"),
    icon: CheckCircle2,
  },
  PAID: {
    label: "Paid",
    tone: "emerald",
    className: getToneClasses("emerald"),
    icon: Wallet,
  },
  VOIDED: {
    label: "Voided",
    tone: "slate",
    className: getToneClasses("slate"),
    icon: XCircle,
  },
};
