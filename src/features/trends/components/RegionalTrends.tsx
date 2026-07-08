import { motion } from "framer-motion";
import { Globe, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const regions = [
  { region: "Hàn Quốc", flag: "🇰🇷", trends: ["K-Fashion layer oversized", "Màu pastel Hàn", "Túi tote tối giản", "Silhouette rộng"] },
  { region: "Nhật Bản", flag: "🇯🇵", trends: ["Streetwear Nhật", "Denim raw", "Giày tabi", "Phong cách Ura-Harajuku"] },
  { region: "Mỹ", flag: "🇺🇸", trends: ["Gorpcore", "Old money", "Athleisure nâng cấp", "Sneaker culture"] },
  { region: "Việt Nam", flag: "🇻🇳", trends: ["Áo dài cách tân", "Streetwear Sài Gòn", "Phối đồ linen", "Túi cói"] },
];

const RegionalTrends = () => {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  return (
    <section className="py-14 md:py-20 border-t border-border bg-muted/30">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="editorial-label mb-3 flex items-center gap-2">
              <Globe className="w-3 h-3 text-accent" /> Khám phá toàn cầu
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground">
              Xu hướng <span className="italic">theo khu vực</span>
            </h2>
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {regions.map((r, i) => (
            <button
              key={r.region}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-body font-medium tracking-[0.15em] uppercase transition-all ${
                i === active
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{r.flag}</span> {r.region}
            </button>
          ))}
        </div>

        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="border border-border bg-background p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{regions[active].flag}</span>
              <h3 className="font-heading text-xl md:text-2xl italic text-foreground">{regions[active].region}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {regions[active].trends.map((t, i) => (
                <motion.button
                  key={t}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => navigate("/recommender")}
                  className="group flex items-center justify-between p-3 border border-border hover:border-foreground/20 transition-colors text-left"
                >
                  <span className="text-sm font-body text-foreground">{t}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RegionalTrends;
