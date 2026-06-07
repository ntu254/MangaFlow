import { useState } from "react"
import { RoleTabSelector, type RoleTabId } from "./RoleTabSelector"
import { RoleFeaturePanel } from "./RoleFeaturePanel"

const roleContent: Record<RoleTabId, { title: string; desc: string; features: string[] }> = {
  mangaka: {
    title: "The Mangaka Canvas",
    desc: "Focus entirely on storytelling. Upload raw drafts, assign specific panels to assistants, and view editorial feedback directly layered over your artwork without switching tabs.",
    features: [
      "Distraction-free upload zones",
      "One-click assistant task delegation",
      "Consolidated script-to-page view",
    ],
  },
  assistant: {
    title: "Assistant Workspace",
    desc: "See only your assigned tasks with full page context. Submit work and receive revision requests directly from the mangaka.",
    features: [
      "Task queue filtered by assignment",
      "Direct page-level submission",
      "Revision tracking and history",
    ],
  },
  editor: {
    title: "Editor Review Console",
    desc: "Manage the entire review pipeline. See all submissions, leave layered comments, and approve or request revisions.",
    features: [
      "Centralized review queue",
      "Page-level comment threads",
      "Publication readiness gate",
    ],
  },
  board: {
    title: "Board Member Portal",
    desc: "Review series proposals, vote on approvals, and make continuation decisions with full ranking data.",
    features: [
      "Series approval voting",
      "Publication readiness checks",
      "At-risk series flagging",
    ],
  },
}

export function RoleViewSection() {
  const [activeRole, setActiveRole] = useState<RoleTabId>("mangaka")
  const content = roleContent[activeRole]

  return (
    <section className="py-xl bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-ambient mb-xxl p-lg">
      <div className="text-center mb-xl">
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">A View for Every Role</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-sm">Tailored interfaces that surface the tools you need, when you need them.</p>
      </div>
      <div className="mb-lg flex justify-center">
        <RoleTabSelector activeRole={activeRole} onRoleChange={(id) => setActiveRole(id as RoleTabId)} />
      </div>
      <div className="mt-lg grid grid-cols-1 md:grid-cols-2 gap-xl items-center p-md mb-xl">
        <div>
          <h3 className="font-headline-md text-headline-md font-semibold text-on-surface mb-sm">{content.title}</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">{content.desc}</p>
          <ul className="space-y-sm">
            {content.features.map((feature) => (
              <li key={feature} className="flex items-center gap-sm font-label-md text-label-md text-on-surface">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-surface-container rounded-lg p-lg border border-outline-variant/20 flex items-center justify-center min-h-[240px]">
          <div className="flex flex-col items-center gap-sm text-on-surface-muted">
            <span className="material-symbols-outlined text-[48px]">{activeRole === "mangaka" ? "brush" : activeRole === "assistant" ? "engineering" : activeRole === "editor" ? "rate_review" : "gavel"}</span>
            <span className="font-label-md text-label-md">{content.title}</span>
          </div>
        </div>
      </div>
      <RoleFeaturePanel activeRole={activeRole} />
    </section>
  )
}
