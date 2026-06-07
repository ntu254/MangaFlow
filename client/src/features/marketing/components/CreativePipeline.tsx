import { MFCard } from "@/shared/components/ui/MFCard"
import { MFIconCircle } from "@/shared/components/ui/MFIconCircle"

const steps = [
  { icon: "📄", label: "Series Proposal", desc: "Mangaka creates series profile and uploads initial manuscript", color: "primary" as const },
  { icon: "✎", label: "Chapter Production", desc: "Mangaka creates chapters, uploads pages, and assigns tasks", color: "secondary" as const },
  { icon: "✓", label: "Review & Approve", desc: "Editor reviews submissions and manages the approval chain", color: "tertiary" as const },
  { icon: "△", label: "Board Vote", desc: "Board votes on approval and publication readiness", color: "primary" as const },
  { icon: "◆", label: "Publish", desc: "Chapter passes readiness check and is published", color: "secondary" as const },
]

export function CreativePipeline() {
  return (
    <section className="bg-surface-low py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-4 text-center text-headline-lg text-on-surface">Production Pipeline</h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-body-lg text-on-surface-muted">
          From proposal to publication — every step tracked in one place.
        </p>
        <div className="grid gap-4 md:grid-cols-5">
          {steps.map((step, i) => (
            <div key={step.label} className="relative">
              <MFCard padding="lg" className="h-full text-center">
                <MFIconCircle variant={step.color} size="lg" className="mx-auto mb-4">
                  <span className="text-[20px]">{step.icon}</span>
                </MFIconCircle>
                <h3 className="mb-2 text-title-lg text-on-surface">{step.label}</h3>
                <p className="text-body-md text-on-surface-muted">{step.desc}</p>
              </MFCard>
              {i < steps.length - 1 && (
                <div className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-headline-lg text-outline-variant md:block">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
