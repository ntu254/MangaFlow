import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const keywords = [
  "outfit linen", "cargo pants streetwear", "váy vàng bơ",
  "outfit công sở Hàn Quốc", "quiet luxury", "phối blazer oversized",
  "váy maxi mùa hè", "gorpcore aesthetic", "tủ đồ tối giản",
  "chunky sneaker phối đồ", "thời trang xanh sage", "xu hướng đỏ cherry",
];

const TrendingSearches = () => {
  const navigate = useNavigate();

  return (
    <section className="py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="editorial-label mb-3">Mọi người đang tìm kiếm</p>
            <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground">
              Tìm kiếm <span className="italic">thịnh hành</span>
            </h2>
          </div>
          <Search className="w-5 h-5 text-muted-foreground hidden md:block" />
        </div>

        <div className="flex flex-wrap gap-2.5">
          {keywords.map((kw, i) => (
            <motion.button key={kw} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => navigate("/recommender")}
              className="group flex items-center gap-2 px-5 py-2.5 border border-border bg-background text-foreground text-xs font-body tracking-wide hover:bg-foreground hover:text-background transition-all duration-300">
              <span>{kw}</span>
              <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingSearches;
