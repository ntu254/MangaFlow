import { Link } from "react-router-dom"
import { MFButton } from "@/shared/components/ui/MFButton"

export function CallToActionSection() {
  return (
    <section className="py-[80px]">
      <div className="mx-auto max-w-7xl px-container-padding">
        <div className="rounded-xl border border-outline-variant/20 bg-surface-lowest p-xxl shadow-ambient text-center">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-lg">
            Ready to run your manga studio workflow in one place?
          </h2>
          <Link to="/login">
            <MFButton variant="primary" size="lg" className="inline-flex items-center gap-sm shadow-lg px-xxl py-md font-bold">
              Start your workspace
              <span className="text-on-primary text-[20px] font-bold">→</span>
            </MFButton>
          </Link>
        </div>
      </div>
    </section>
  )
}
