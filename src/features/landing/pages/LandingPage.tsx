import {
  AIInput,
  CTABanner,
  Footer,
  HeroSection,
  HowItWorks,
  Navbar,
  OutfitGenerator,
  SocialProof,
  StyleExplorer,
  StyleProfilePreview,
} from "@/features/landing/components";

const LandingPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <HowItWorks />
    <StyleExplorer />
    <OutfitGenerator />
    <AIInput />
    <SocialProof />
    <StyleProfilePreview />
    <CTABanner />
    <Footer />
  </div>
);

export default LandingPage;
