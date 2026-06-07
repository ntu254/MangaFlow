import { HeroCTAGroup } from "./HeroCTAGroup"
import { HeroWorkspacePreview } from "./HeroWorkspacePreview"

export function HeroSection() {
  return (
    <section className="py-xxl mt-xl grid grid-cols-1 md:grid-cols-2 gap-xxl items-center">
      <div className="flex flex-col items-start gap-lg">
        <div className="inline-flex items-center gap-sm bg-primary-fixed text-on-primary-fixed px-md py-xs rounded-full font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[16px]">stars</span>
          MangaFlow V2.0 is Live
        </div>
        <h1 className="font-display text-display font-bold md:text-[56px] md:leading-[64px] text-on-surface text-balance">
          Create, review, and publish manga in one creative workflow.
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant text-balance max-w-lg">
          Manage scripts, manga pages, assistant tasks, editor reviews, board votes, and release planning in one studio workspace.
        </p>
        <HeroCTAGroup />
      </div>
      <HeroWorkspacePreview />
    </section>
  )
}
