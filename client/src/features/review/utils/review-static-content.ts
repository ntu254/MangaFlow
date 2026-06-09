import type { CommentThreadItem, PublicationReadinessItem } from "@/shared/components/domain"

export const reviewComments: CommentThreadItem[] = [
  {
    id: "comment-1",
    authorName: "Mika Tan",
    authorRole: "Mangaka",
    body: "Please soften the texture around the speech bubble before final approval.",
    status: "OPEN",
    createdAt: "Today 09:20",
    targetLabel: "Page 12 - upper panel",
    isUnresolved: true,
  },
  {
    id: "comment-2",
    authorName: "Rin Sato",
    authorRole: "Tantou Editor",
    body: "Panel rhythm is approved. Keep light direction consistent with the previous page.",
    status: "RESOLVED_BY_EDITOR",
    createdAt: "Yesterday 16:45",
    targetLabel: "Page 12 - full page",
  },
]

export const reviewReadinessItems: PublicationReadinessItem[] = [
  {
    id: "pages-uploaded",
    label: "All pages uploaded",
    passed: true,
    description: "Local readiness sample only.",
  },
  {
    id: "tasks-approved",
    label: "All tasks approved",
    passed: false,
    description: "The selected review still has a submitted task awaiting approval.",
  },
  {
    id: "comments-resolved",
    label: "All comments resolved",
    passed: false,
    description: "Unresolved comments must be resolved by Editor before publication.",
  },
  {
    id: "publication-date",
    label: "Publication date exists",
    passed: true,
    description: "Sample schedule has a draft date.",
  },
]
