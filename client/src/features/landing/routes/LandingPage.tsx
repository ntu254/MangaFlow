import { LandingHeader } from "../components/LandingHeader";
import { LandingHero } from "../components/LandingHero";
import { LandingFeatures } from "../components/LandingFeatures";
import { LandingWorkflow } from "../components/LandingWorkflow";
import { LandingCTA } from "../components/LandingCTA";
import { LandingFooter } from "../components/LandingFooter";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9fb] via-[#f8f1ff] to-[#fff7ec]">
      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
      <LandingWorkflow />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
