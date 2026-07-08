import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/shared/layout";
import { ChatSidebar } from "../components";
import DetailedOutfitSetCard from "../components/DetailedOutfitSetCard";
import MiniSetCard from "../components/MiniSetCard";
import { recommenderService } from "../services/recommender.service";
import { useSurveyTrigger } from "@/shared/hooks/useSurveyTrigger";
import { markFeatureCompleted } from "@/shared/survey/surveyConfig";
import SurveyModal from "@/shared/components/SurveyModal";
import type { Outfit } from "../types";

const LOADING_STEPS = [
  "Phân tích style của bạn.",
  "Kết hợp màu sắc.",
  "Đang phối đồ.",
  "Tạo bản xem trước.",
];

const FILTER_CHIPS = ["Sang trọng", "Nữ tính", "Dưới 3 triệu", "Shopee", "TikTok Shop"];

const RecommenderPage = () => {
  const [chatOpen, setChatOpen] = useState(true);
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeOutfitIndex, setActiveOutfitIndex] = useState(0);
  const [generationCount, setGenerationCount] = useState(0);
  const cancelledRef = useRef(false);
  const survey = useSurveyTrigger();


  useEffect(() => {
    if (!isLoading && !isGenerating) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isLoading, isGenerating]);

  const handleOutfitsGenerated = useCallback(
    (newOutfits: Outfit[], message: string) => {
      setOutfits(newOutfits);
      setActivePrompt(message);
      setIsLoading(false);
      setActiveOutfitIndex(0);
      setGenerationCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= 3) {
          markFeatureCompleted("recommender");
        }
        return newCount;
      });
    },
    [survey.checkTriggers]
  );

  const filtered = outfits.filter((o) => {
    if (o.userHidden) return false;

    if (activeChips.includes("Dưới 3 triệu")) {
      const priceNum = Number(o.totalPrice.replace(/[^0-9]/g, ""));
      if (priceNum > 0 && priceNum > 3000000) return false;
    }

    const hasShopee = activeChips.includes("Shopee");
    const hasTikTok = activeChips.includes("TikTok Shop");
    if (hasShopee && !hasTikTok) {
      return o.products.some((p) => p.platform === "Shopee");
    }
    if (hasTikTok && !hasShopee) {
      return o.products.some((p) => p.platform === "TikTok Shop");
    }

    return true;
  });

  const isLoadingAny = isLoading || isGenerating;
  const hasResults = activePrompt && outfits.length > 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden relative bg-background">
      <div 
        className="absolute inset-0 z-0 opacity-60 pointer-events-none"
        style={{ backgroundImage: "url('/fashion_background_theme.svg')", backgroundSize: "100% 100%", backgroundPosition: "center", backgroundRepeat: "no-repeat", filter: "blur(0.5px)" }}
      />
      <Navbar />

      <div className="flex flex-1 overflow-hidden pt-16 relative z-10">
        <ChatSidebar
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
          onOutfitsGenerated={handleOutfitsGenerated}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
        />

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] h-full">
          <div className={`p-6 md:p-8 lg:p-10 mx-auto space-y-6 transition-all duration-500 ease-in-out ${chatOpen ? "max-w-4xl" : "max-w-6xl"}`}>
            {/* Loading State */}
            {isLoadingAny && !hasResults ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1.5 mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-pulse" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-pulse"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-pulse"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <motion.p
                  key={loadingStep}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="text-xs font-body text-muted-foreground uppercase tracking-wider font-semibold animate-pulse"
                >
                  {LOADING_STEPS[loadingStep]}
                </motion.p>
              </div>
            ) : loadError ? (
              <div className="border-l-2 border-destructive pl-4 py-3 text-sm text-destructive">
                {loadError}
              </div>
            ) : hasResults ? (
              /* AI Generated Results */
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <span className="text-[10px] uppercase tracking-[0.18em] font-body text-muted-foreground/70 block mb-1">
                    Gợi ý outfit
                  </span>
                  <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
                    {filtered.length} set dành cho: "{activePrompt}"
                  </h1>
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-hide pb-2">
                  {FILTER_CHIPS.map((chip) => {
                    const isSelected = activeChips.includes(chip);
                    return (
                      <button
                        key={chip}
                        onClick={() => {
                          if (isSelected) {
                            setActiveChips(activeChips.filter((c) => c !== chip));
                          } else {
                            setActiveChips([...activeChips, chip]);
                          }
                        }}
                        className={`text-xs font-body px-3.5 py-1.5 rounded-full border whitespace-nowrap transition-all shrink-0 ${isSelected
                            ? "bg-foreground text-background border-foreground font-medium"
                            : "border-border/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground bg-background/30"
                          }`}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>

                {/* Set Tabs */}
                <div className="flex gap-1 border-b border-border/40 pb-0 overflow-x-auto scrollbar-hide">
                  {filtered.map((outfit, i) => {
                    const isActive = activeOutfitIndex === i;
                    return (
                      <button
                        key={outfit.id}
                        onClick={() => setActiveOutfitIndex(i)}
                        className={`px-4 py-2.5 text-xs font-body font-semibold border-b-2 whitespace-nowrap transition-all ${isActive
                            ? "border-foreground text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        Set {i + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Active Detailed Set Card */}
                {filtered[activeOutfitIndex] && (
                  <DetailedOutfitSetCard
                    outfit={filtered[activeOutfitIndex]}
                    index={activeOutfitIndex}
                  />
                )}

                {/* Mini Cards for Other Sets */}
                {filtered.length > 1 && (
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-body font-bold text-muted-foreground/60 uppercase tracking-wider">
                      Các set khác
                    </h3>
                    {filtered.map((outfit, i) => {
                      if (i === activeOutfitIndex) return null;
                      return (
                        <MiniSetCard
                          key={outfit.id}
                          outfit={outfit}
                          index={i}
                          isActive={false}
                          onClick={() => setActiveOutfitIndex(i)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Empty State: Video Loop */
              <div className="w-full h-full flex flex-col items-center justify-center pt-8 md:pt-12">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full max-w-3xl rounded-[24px] object-cover"
                >
                  <source src="/animo-column-drift-720p.webm" type="video/webm" />
                </video>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default RecommenderPage;
