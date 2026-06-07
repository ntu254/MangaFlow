import { HeroSection } from "@/features/marketing/components/HeroSection"
import { CreativePipeline } from "@/features/marketing/components/CreativePipeline"
import { RoleViewSection } from "@/features/marketing/components/RoleViewSection"
import { CoreFeaturesSection } from "@/features/marketing/components/CoreFeaturesSection"
import { CallToActionSection } from "@/features/marketing/components/CallToActionSection"

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <CreativePipeline />
      <RoleViewSection />
      <CoreFeaturesSection />
      <CallToActionSection />
    </>
  )
}
