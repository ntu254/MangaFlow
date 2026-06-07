import { MFCard } from "@/shared/components/ui/MFCard"
import { MFIconCircle } from "@/shared/components/ui/MFIconCircle"

const features = [
  {
    icon: "📄",
    title: "Page & Version Management",
    desc: "Store original files, previews, thumbnails, and major versions.",
  },
  {
    icon: "✓",
    title: "Assistant Task Assignment",
    desc: "Assign task type, page region, deadline, and rate.",
  },
  {
    icon: "⭐",
    title: "Editor Review Flow",
    desc: "Track comments from open to resolved.",
  },
  {
    icon: "🗳️",
    title: "Board Voting System",
    desc: "Majority approval with board chair tie-break.",
  },
  {
    icon: "🔒",
    title: "Secure File Access",
    desc: "Private signed URLs and controlled preview access.",
  },
  {
    icon: "🚀",
    title: "Release Planning",
    desc: "Approve chapters and schedule publication dates.",
  },
]

export function CoreFeaturesSection() {
  return (
    <section className="py-xl mb-xxl bg-surface-low">
      <div className="mx-auto max-w-7xl px-container-padding">
        <div className="text-center mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Built for Manga Studio Operations</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
            Everything you need to run a professional manga production team.
          </p>
        </div>
        <div className="grid gap-md md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <MFCard key={feature.title} padding="md" className="flex items-start gap-md">
              <MFIconCircle variant="primary" size="md" className="shrink-0 mt-xs">
                <span className="text-[18px]">{feature.icon}</span>
              </MFIconCircle>
              <div>
                <h3 className="font-title-lg text-title-lg text-on-surface">{feature.title}</h3>
                <p className="mt-xs font-body-md text-body-md text-on-surface-muted">{feature.desc}</p>
              </div>
            </MFCard>
          ))}
        </div>
      </div>
    </section>
  )
}
