import { HeroSection } from "@/features/marketing/components/HeroSection"
import { CreativePipeline } from "@/features/marketing/components/CreativePipeline"
import { RoleViewSection } from "@/features/marketing/components/RoleViewSection"

export function LandingPage() {
  return (
    <div>
      <HeroSection />
      <CreativePipeline />
      <RoleViewSection />
    </div>
  )
}
