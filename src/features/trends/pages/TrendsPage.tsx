import trendsHeroBg from "@/assets/trends-hero-bg.jpg";
import AITrendInsights from "@/features/trends/components/AITrendInsights";
import NextTrendPrediction from "@/features/trends/components/NextTrendPrediction";
import PersonalizedTrends from "@/features/trends/components/PersonalizedTrends";
import RegionalTrends from "@/features/trends/components/RegionalTrends";
import SeasonalTrends from "@/features/trends/components/SeasonalTrends";
import TrendSearch from "@/features/trends/components/TrendSearch";
import TrendingColors from "@/features/trends/components/TrendingColors";
import TrendingItems from "@/features/trends/components/TrendingItems";
import TrendingSearches from "@/features/trends/components/TrendingSearches";
import TrendingStyles from "@/features/trends/components/TrendingStyles";
import TrendInspirationGrid from "@/features/trends/components/TrendInspirationGrid";
import WardrobeTrendMatch from "@/features/trends/components/WardrobeTrendMatch";
import { Footer, Navbar } from "@/shared/layout";
import { motion } from "framer-motion";
import { Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TrendsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={trendsHeroBg}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
          </div>

          <div className="relative px-6 py-24 md:py-36">
            <div className="container mx-auto max-w-5xl text-center">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="editorial-label mb-5"
              >
                Redo tuyển chọn
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-heading text-5xl md:text-7xl font-light text-foreground mb-6"
              >
                Xu hướng <span className="italic">Thời trang</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="font-body text-sm md:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed"
              >
                Khám phá những gì mọi người đang tìm kiếm, mặc và bàn luận trong
                thời trang ngay lúc này. Từ khóa, màu sắc, sản phẩm và phong
                cách xu hướng được Redo tuyển chọn.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="mt-8"
              >
                <button
                  onClick={() => navigate("/recommender")}
                  className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 text-[10px] font-body font-medium uppercase tracking-[0.2em] shadow-[0_18px_34px_-18px_hsl(var(--accent)/0.55)] hover:bg-accent/92 transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Tạo outfit từ xu hướng
                </button>
              </motion.div>
            </div>
          </div>
          <div className="border-b border-border" />
        </section>

        <TrendSearch onSearch={() => {}} />
        <TrendingSearches />
        <TrendingColors />
        <TrendingItems />
        <SeasonalTrends />
        <TrendingStyles />
        <PersonalizedTrends />
        <WardrobeTrendMatch />
        <RegionalTrends />
        <AITrendInsights />
        <NextTrendPrediction />
        <TrendInspirationGrid />
      </div>

      <Footer />
    </div>
  );
};

export default TrendsPage;
