import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const personalized = [
  { prompt: "outfit minimal hè 2026", label: "Minimal mùa hè", reason: "Phù hợp Style DNA Minimal · 70%" },
  { prompt: "streetwear cá tính hè", label: "Streetwear hè", reason: "Kết hợp Streetwear 15% + Casual 10%" },
  { prompt: "athleisure hiện đại", label: "Athleisure 2026", reason: "Gợi ý mở rộng phong cách" },
  { prompt: "office minimal thu", label: "Công sở thu", reason: "Office 28% — style hiện có" },
];

const PersonalizedTrends = () => {
  const navigate = useNavigate();

  return (
    <section className="py-14 md:py-20 border-t border-border bg-muted/30">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="editorial-label mb-3 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-accent" /> Phù hợp với bạn
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground">
              Xu hướng <span className="italic">cá nhân hóa</span>
            </h2>
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-body mb-8 max-w-lg">
          Dựa trên Style Profile và tủ đồ của bạn, AI đề xuất những xu hướng phù hợp nhất.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
          {personalized.map((p, i) => (
            <motion.button
              key={p.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              onClick={() => navigate(`/recommender?prompt=${encodeURIComponent(p.prompt)}`)}
              className="bg-background p-6 text-left group hover:bg-muted/30 transition-colors"
            >
              <Sparkles className="w-5 h-5 text-accent mb-3" />
              <h3 className="font-heading text-sm md:text-base italic text-foreground mb-1">{p.label}</h3>
              <p className="text-[10px] font-body text-muted-foreground leading-relaxed">{p.reason}</p>
              <div className="mt-3 flex items-center gap-1 text-[9px] font-body font-medium uppercase tracking-wider text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                Khám phá <ArrowRight className="w-2.5 h-2.5" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PersonalizedTrends;
