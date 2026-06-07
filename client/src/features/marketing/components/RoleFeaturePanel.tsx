import { MFCard } from "@/shared/components/ui/MFCard"
import { MFIconCircle } from "@/shared/components/ui/MFIconCircle"
import type { RoleTabId } from "./RoleTabSelector"

const roleData: Record<RoleTabId, { features: { icon: string; title: string; desc: string }[] }> = {
  mangaka: {
    features: [
      { icon: "📄", title: "Create Series", desc: "Submit series proposals and manuscripts for board approval." },
      { icon: "✎", title: "Manage Chapters", desc: "Upload chapter drafts, manage pages, and track versions." },
      { icon: "✓", title: "Assign Assistant Tasks", desc: "Assign specific page regions, task types, and deadlines." },
      { icon: "☆", title: "Verify Fixes", desc: "Review assistant submissions before sending to editor." },
    ],
  },
  assistant: {
    features: [
      { icon: "✓", title: "Task Workspace", desc: "See only your assigned tasks with context pages." },
      { icon: "✎", title: "Submit Work", desc: "Upload files and text results for mangaka review." },
      { icon: "◆", title: "Track Progress", desc: "See which tasks are done and what needs attention." },
      { icon: "△", title: "Revisions", desc: "Receive revision requests and resubmit updated work." },
    ],
  },
  editor: {
    features: [
      { icon: "☆", title: "Review Queue", desc: "See all submissions pending your review decision." },
      { icon: "✓", title: "Approve & Reject", desc: "Make approval decisions with revision comments." },
      { icon: "✎", title: "Comment Threads", desc: "Discuss pages and regions with the production team." },
      { icon: "◆", title: "Publication Ready", desc: "Final approval gate before publication." },
    ],
  },
  board: {
    features: [
      { icon: "△", title: "Vote on Series", desc: "Review proposals and vote on series approval." },
      { icon: "◆", title: "Readiness Check", desc: "Review chapter readiness before publication." },
      { icon: "📊", title: "Ranking Data", desc: "Import and evaluate ranking and reader scores." },
      { icon: "☆", title: "At-Risk Decisions", desc: "Flag series at risk and make continuation decisions." },
    ],
  },
}

interface RoleFeaturePanelProps {
  activeRole: RoleTabId
}

export function RoleFeaturePanel({ activeRole }: RoleFeaturePanelProps) {
  const data = roleData[activeRole]
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.features.map((feature) => (
        <MFCard key={feature.title} padding="md" className="flex items-start gap-4">
          <MFIconCircle variant="primary" size="md" className="shrink-0">
            <span className="text-[16px]">{feature.icon}</span>
          </MFIconCircle>
          <div>
            <h3 className="text-title-lg text-on-surface">{feature.title}</h3>
            <p className="mt-1 text-body-md text-on-surface-muted">{feature.desc}</p>
          </div>
        </MFCard>
      ))}
    </div>
  )
}
