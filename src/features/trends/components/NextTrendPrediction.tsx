import { motion } from "framer-motion";
import { TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const predictions = [
  { name: "Mocha Minimal", desc: "Tông màu nâu mocha kết hợp với silhouette tối giản — dự báo sẽ thay thế quiet luxury.", confidence: 87, source: "Phân tích runway SS26 + dữ liệu Pinterest" },
  { name: "Techwear 2.0", desc: "Phiên bản tinh tế hơn của techwear — túi đa năng, chất liệu kỹ thuật, phối layer thông minh.", confidence: 74, source: "TikTok fashion community + search trend" },
  { name: "Crafted Denim", desc: "Denim thủ công, raw edge, mộc mạc — phản ứng ngược với fast fashion.", confidence: 81, source: "Dữ liệu tìm kiếm + Pinterest saves" },
];

const NextTrendPrediction = () => {
  const navigate = useNavigate();

  return (
    <section className="py-14 md:py-20 border-t border-border">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="editorial-label mb-3 flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-accent" /> Dự báo bởi AI
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground">
              Xu hướng <span className="italic">tiếp theo</span>
            </h2>
            <p className="text-xs text-muted-foreground font-body mt-2">
              AI dự đoán những xu hướng sắp nổi lên dựa trên dữ liệu runway, mạng xã hội và hành vi người dùng.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {predictions.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="bg-background p-6 md:p-8 group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-body font-semibold uppercase tracking-[0.2em] text-muted-foreground">Dự báo</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full border-2 border-accent flex items-center justify-center">
                    <span className="text-[8px] font-body font-bold text-accent">{p.confidence}%</span>
                  </div>
                  <span className="text-[8px] font-body text-muted-foreground uppercase tracking-wider">tin cậy</span>
                </div>
              </div>
              <h3 className="font-heading text-lg md:text-xl italic text-foreground mb-3">{p.name}</h3>
              <p className="text-[11px] font-body text-muted-foreground leading-relaxed mb-4">{p.desc}</p>
              <div className="flex items-start gap-2 mb-4">
                <Sparkles className="w-3 h-3 text-accent mt-0.5 shrink-0" />
                <span className="text-[9px] font-body text-muted-foreground italic">{p.source}</span>
              </div>
              <button
                onClick={() => navigate("/recommender")}
                className="flex items-center gap-1 text-[10px] font-body font-medium uppercase tracking-wider text-accent opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Tạo outfit từ xu hướng <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NextTrendPrediction;
