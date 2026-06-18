export const seriesDetailStats = {
  header: {
    title: "Eclipse of Eternity",
    status: "Editor Review",
    type: "Web Manga",
    genres: ["Supernatural", "Dark Fantasy"],
    description: "The world ended once. He remembers.",
    chapters: 12,
    pages: { current: 234, total: 300 },
    created: "Jan 12, 2024",
    nextMilestone: "Chapter 14 Submission",
  },
  health: {
    schedule: { label: "Schedule", status: "Good", value: 85, color: "bg-emerald-500", iconText: "text-emerald-500" },
    quality: { label: "Quality", status: "Good", value: 80, color: "bg-emerald-500", iconText: "text-emerald-500" },
    workload: { label: "Workload", status: "Moderate", value: 60, color: "bg-amber-500", iconText: "text-amber-500" },
    risk: { label: "Risk", status: "Low", value: 20, color: "bg-emerald-500", iconText: "text-emerald-500" },
  },
  chapterSummary: {
    total: 12,
    distribution: [
      { status: "In Production", value: 5, color: "bg-purple-600" },
      { status: "Editor Review", value: 2, color: "bg-amber-500" },
      { status: "Approved", value: 2, color: "bg-emerald-500" },
      { status: "Draft", value: 2, color: "bg-blue-500" },
      { status: "Ready", value: 1, color: "bg-purple-300" },
    ]
  },
  nextActions: [
    { id: 1, title: "Review submission", description: "Chapter 12 - Page 18-22", due: "Due today", type: "review", iconColor: "text-purple-600 bg-purple-50" },
    { id: 2, title: "Editor comment reply", description: "Chapter 11 - Page 16", due: "Due today", type: "comment", iconColor: "text-purple-600 bg-purple-50" },
    { id: 3, title: "Approve manuscript", description: "Manuscript - Chapter 14", due: "Due tomorrow", type: "approve", iconColor: "text-emerald-600 bg-emerald-50" },
    { id: 4, title: "Board review", description: "Chapter 10", due: "Due in 2 days", type: "board", iconColor: "text-amber-600 bg-amber-50" },
    { id: 5, title: "Check comments", description: "2 new comments", due: "Due in 2 days", type: "comment", iconColor: "text-purple-600 bg-purple-50" },
  ],
  currentManuscript: {
    title: "Eclipse of Eternity - Chapter 12",
    chapter: "Chapter 12",
    status: "Editor Review",
    pages: { current: 18, total: 22 },
    lastUpdated: "Today, 10:24 AM",
    updatedBy: { name: "Rina Saito", avatar: "R" }
  },
  submissions: [
    { id: 1, title: "Chapter 12 · Pages 18-22", author: "Yuki Tanaka", avatar: "Y", status: "Under Review", time: "2 hours ago" },
    { id: 2, title: "Chapter 11 · Full Chapter", author: "Rina Saito", avatar: "R", status: "Approved", time: "Yesterday" },
    { id: 3, title: "Chapter 10 · Full Chapter", author: "Rina Saito", avatar: "R", status: "Approved", time: "Oct 12" }
  ],
  comments: [
    { id: 1, name: "Rina Saito", role: "Editor", avatar: "R", time: "Today, 10:24 AM", text: "Great pacing in these pages! Please adjust panel 4 for readability.", context: "Chapter 12 • Page 19", severity: "Blocking" },
    { id: 2, name: "Kenji Mori", role: "Board Member", avatar: "K", time: "Yesterday, 4:03 PM", text: "Love the emotion in page 16. Approved with minor notes.", context: "Chapter 11 • Page 16", severity: "Board Note" },
    { id: 3, name: "Yuki Tanaka", role: "Assistant Editor", avatar: "Y", time: "Apr 29, 9:14 AM", text: "Please check consistency of weapon design.", context: "Chapter 10 • Page 7", severity: "Needs Reply" },
    { id: 4, name: "Taro Fujimoto", role: "Letterer", avatar: "T", time: "Apr 28, 2:00 PM", text: "Text fits perfectly in bubbles.", context: "Chapter 10 • Page 5", severity: "Resolved" }
  ],
  team: [
    { id: 1, name: "Mika Tan", role: "Mangaka", avatar: "M", badge: "Owner", isOwner: true },
    { id: 2, name: "Rina Saito", role: "Lead Editor", avatar: "R", badge: "Lead", isOwner: false },
    { id: 3, name: "Yuki Tanaka", role: "Assistant Editor", avatar: "Y", isOwner: false },
    { id: 4, name: "Taro Fujimoto", role: "Letterer", avatar: "T", isOwner: false },
    { id: 5, name: "Hana Lee", role: "Storyboard Artist", avatar: "H", isOwner: false }
  ],
  recentActivity: [
    { id: 1, text: "Chapter 12 submitted for review", time: "Today, 10:24 AM", icon: "upload", color: "text-purple-600 bg-purple-100" },
    { id: 2, text: "Editor commented on Chapter 12", time: "Today, 10:30 AM", icon: "message", color: "text-blue-600 bg-blue-100" },
    { id: 3, text: "Chapter 11 approved", time: "Yesterday, 4:18 PM", icon: "check", color: "text-emerald-600 bg-emerald-100" },
    { id: 4, text: "Board review completed", time: "Yesterday, 2:00 PM", icon: "file", color: "text-amber-600 bg-amber-100" }
  ]
};
