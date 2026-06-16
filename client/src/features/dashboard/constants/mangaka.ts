export const nextActionsData = [
  {
    id: 1,
    title: "Review 2 submissions",
    description: "2 chapters waiting for your review.",
    actionText: "Go to Review Queue →",
    icon: "FileCheck",
    color: "purple"
  },
  {
    id: 2,
    title: "Resolve 3 comments",
    description: "Comments need your attention.",
    actionText: "Open Comments →",
    icon: "MessageSquare",
    color: "blue"
  },
  {
    id: 3,
    title: "Upload revised manuscript",
    description: "Ch. 11 revised files are ready to upload.",
    actionText: "Upload Now →",
    icon: "UploadCloud",
    color: "purple"
  },
  {
    id: 4,
    title: "Open Chapter 12",
    description: "Continue working on Chapter 12.",
    actionText: "Open Chapter →",
    icon: "BookOpen",
    color: "indigo"
  },
  {
    id: 5,
    title: "Confirm payroll",
    description: "Payroll for May is ready to confirm.",
    actionText: "Review Payroll →",
    icon: "Wallet",
    color: "teal"
  }
];

export const activeSeriesData = [
  {
    id: 1,
    name: "Eclipse of Eternity",
    genre: "Fantasy - Action",
    stage: "Editor Review",
    stageColor: "bg-purple-50 text-purple-700",
    milestoneIcon: "MessageSquare",
    milestoneIconColor: "text-purple-600",
    milestoneTitle: "Editor decision on Ch. 11",
    milestoneDate: "Due May 29, 2025",
    chapters: "11 / 20",
    progressStage: 2 // 1: Draft, 2: Review, 3: Revisions, 4: Approved
  },
  {
    id: 2,
    name: "Neon Reverie",
    genre: "Sci-Fi - Drama",
    stage: "In Production",
    stageColor: "bg-blue-50 text-blue-700",
    milestoneIcon: "PenTool",
    milestoneIconColor: "text-blue-600",
    milestoneTitle: "Submit Chapter 8",
    milestoneDate: "Due May 30, 2025",
    chapters: "7 / 12",
    progressStage: 1
  },
  {
    id: 3,
    name: "Starlight Days",
    genre: "Romance - School",
    stage: "At Risk",
    stageColor: "bg-red-50 text-red-700",
    milestoneIcon: "AlertTriangle",
    milestoneIconColor: "text-red-500",
    milestoneTitle: "Revise Chapter 5",
    milestoneDate: "Due May 25, 2025 (Late)",
    chapters: "5 / 10",
    progressStage: 3
  },
  {
    id: 4,
    name: "Blade of the Void",
    genre: "Action - Supernatural",
    stage: "Approved",
    stageColor: "bg-emerald-50 text-emerald-700",
    milestoneIcon: "CheckCircle2",
    milestoneIconColor: "text-emerald-500",
    milestoneTitle: "Ready for Publication",
    milestoneDate: "Target Jun 3, 2025",
    chapters: "10 / 10",
    progressStage: 4
  }
];

export const dueSoonData = [
  {
    id: 1,
    status: "Late",
    statusColor: "text-red-500",
    icon: "AlertTriangle",
    title: "Revise Chapter 5",
    subtitle: "Starlight Days",
    action: "Revise"
  },
  {
    id: 2,
    status: "Blocking",
    statusColor: "text-red-500",
    icon: "MessageSquare",
    title: "Editor feedback on Ch. 11",
    subtitle: "Eclipse of Eternity",
    action: "Respond"
  },
  {
    id: 3,
    status: "At Risk",
    statusColor: "text-orange-500",
    icon: "AlertCircle",
    title: "Submit Chapter 8",
    subtitle: "Neon Reverie",
    action: "Prepare"
  },
  {
    id: 4,
    status: "Due Soon",
    statusColor: "text-amber-500",
    icon: "Clock",
    title: "Upload revised pages",
    subtitle: "Blade of the Void Ch. 10",
    action: "Upload"
  },
  {
    id: 5,
    status: "Due Soon",
    statusColor: "text-blue-500",
    icon: "Clock",
    title: "Confirm color settings",
    subtitle: "Eclipse of Eternity Ch. 12",
    action: "Review"
  }
];

export const recentActivityData = [
  {
    id: 1,
    icon: "Upload",
    iconColor: "text-purple-600 bg-purple-50",
    title: "You submitted Chapter 11",
    subtitle: "Eclipse of Eternity",
    time: "2h ago"
  },
  {
    id: 2,
    icon: "MessageSquare",
    iconColor: "text-blue-600 bg-blue-50",
    title: "Editor comment added",
    subtitle: "Neon Reverie - Chapter 7",
    time: "4h ago"
  },
  {
    id: 3,
    icon: "CheckCircle2",
    iconColor: "text-emerald-600 bg-emerald-50",
    title: "Chapter 10 approved",
    subtitle: "Blade of the Void",
    time: "Yesterday"
  },
  {
    id: 4,
    icon: "ShieldCheck",
    iconColor: "text-indigo-600 bg-indigo-50",
    title: "Board review completed",
    subtitle: "Starlight Days - Chapter 4",
    time: "Yesterday"
  },
  {
    id: 5,
    icon: "User",
    iconColor: "text-amber-600 bg-amber-50",
    title: "Assistant uploaded revised pages",
    subtitle: "Eclipse of Eternity - Chapter 10",
    time: "2 days ago"
  }
];

export const actionInboxData = [
  { id: 1, title: "Submissions Waiting", count: 2, icon: "FileText", color: "text-purple-600 bg-purple-50" },
  { id: 2, title: "Blocking Comments", count: 3, icon: "MessageSquare", color: "text-purple-600 bg-purple-50" },
  { id: 3, title: "Manuscript Revision Requests", count: 1, icon: "Edit3", color: "text-purple-600 bg-purple-50" },
  { id: 4, title: "Payroll Confirmations", count: 1, icon: "Wallet", color: "text-purple-600 bg-purple-50" }
];
