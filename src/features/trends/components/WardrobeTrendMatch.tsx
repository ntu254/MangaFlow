import { motion } from "framer-motion";
import { Shirt, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const matches = [
  { trend: "Quiet Luxury", match: "Áo blazer đen + quần tây", note: "Bạn đã có blazer đen trong tủ. Kết hợp với quần tây để tạo quiet luxury look." },
  { trend: "Gorpcore", match: "Hoodie xám + cargo pants", note: "Bạn có thể thử Gorpcore với hoodie xám và cargo pants hiện có." },
  { trend: "K-Fashion", match: "Áo thun trắng + quần ống rộng", note: "Layer thêm blazer oversized — bạn đã có sẵn áo thun trắng basic." },
];

const WardrobeTrendMatch = () => {
  const navigate = useNavigate();

  return (
    <section className="py-14 md:py-20 border-t border-border">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="editorial-label mb-3 flex items-center gap-2">
              <Shirt className="w-3 h-3 text-accent" /> Kết hợp tủ đồ
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground">
              Xu hướng <span className="italic">từ tủ đồ của bạn</span>
            </h2>
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-body mb-8 max-w-lg">
          AI đối chiếu items trong tủ đồ với các xu hướng hiện tại — bạn đã sẵn sàng diện trend mà không cần mua mới.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {matches.map((m, i) => (
            <motion.button
              key={m.trend}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              onClick={() => navigate("/wardrobe")}
              className="bg-background p-6 text-left group hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] font-body font-semibold uppercase tracking-[0.2em] text-accent">{m.trend}</span>
                <Sparkles className="w-3 h-3 text-accent" />
              </div>
              <h3 className="font-heading text-base italic text-foreground mb-2">{m.match}</h3>
              <p className="text-[11px] font-body text-muted-foreground leading-relaxed">{m.note}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WardrobeTrendMatch;
