import { MFBadge } from "@/shared/components/ui/MFBadge"
import { HeroCTAGroup } from "./HeroCTAGroup"
import { HeroWorkspacePreview } from "./HeroWorkspacePreview"

export function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 text-center">
      <MFBadge tone="primary" size="md" className="mb-4">
        Manga Production Workflow
      </MFBadge>
      <h1 className="mb-6 text-display-lg text-on-surface">Create Manga Together</h1>
      <p className="mx-auto mb-10 max-w-2xl text-body-lg text-on-surface-muted">
        MangaFlow helps manga teams manage series, chapters, pages, production tasks,
        assistant work, editor review, board approval, and publishing readiness.
      </p>
      <HeroCTAGroup />
      <HeroWorkspacePreview />
    </section>
  )
}
