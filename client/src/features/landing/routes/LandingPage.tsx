import { LandingHeader } from "../components/LandingHeader";
import { LandingHero } from "../components/LandingHero";
import { LandingFeatures } from "../components/LandingFeatures";
import { LandingWorkflow } from "../components/LandingWorkflow";
import { LandingCTA } from "../components/LandingCTA";
import { LandingFooter } from "../components/LandingFooter";

interface LandingPageProps {
  clerkConfigured: boolean;
}

export function LandingPage({ clerkConfigured }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9fb] via-[#f8f1ff] to-[#fff7ec]">
      <LandingHeader clerkConfigured={clerkConfigured} />
      <LandingHero clerkConfigured={clerkConfigured} />
      <LandingFeatures />
      <LandingWorkflow />
      <LandingCTA clerkConfigured={clerkConfigured} />
      <LandingFooter />
    </div>
  );
}
