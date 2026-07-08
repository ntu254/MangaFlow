import { motion } from "framer-motion";
import { Sun, Cloud, Snowflake } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const seasons = [
  {
    id: "summer",
    label: "Hè 2026",
    icon: Sun,
    trends: [
      { name: "Linen mọi thứ", desc: "Từ blazer đến quần ống rộng — linen thống trị mùa hè.", growth: "+64%" },
      { name: "Váy maxi hoa", desc: "Maxi trở lại với xếp ly và họa tiết hoa tinh tế.", growth: "+42%" },
      { name: "Màu pastel", desc: "Vàng bơ, xanh sage, hồng baby — palette của mùa.", growth: "+38%" },
    ],
  },
  {
    id: "autumn",
    label: "Thu 2026",
    icon: Cloud,
    trends: [
      { name: "Lớp layer tối giản", desc: "Phối layer tinh tế với tông màu đất.", growth: "+35%" },
      { name: "Blazer oversized", desc: "Blazer dáng rộng — món đồ trung tâm cho thu.", growth: "+47%" },
      { name: "Tông màu mocha", desc: "Nâu mocha và be đậm dẫn đầu xu hướng thu.", growth: "+31%" },
    ],
  },
  {
    id: "winter",
    label: "Đông 2026",
    icon: Snowflake,
    trends: [
      { name: "Quiet Luxury", desc: "Chất liệu cao cấp, len cashmere, dáng suông.", growth: "+55%" },
      { name: "Bốt cao cổ", desc: "Knee-high boots cho phong cách thanh lịch.", growth: "+29%" },
      { name: "Áo khoác lông", desc: "Faux fur làm điểm nhấn cho mùa đông.", growth: "+33%" },
    ],
  },
];

const SeasonalTrends = () => {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const season = seasons[active];

  return (
    <section className="py-14 md:py-20 border-t border-border">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="text-center mb-10">
          <p className="editorial-label mb-3">Xu hướng theo mùa</p>
          <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground">
            Trends <span className="italic">theo mùa</span>
          </h2>
        </div>

        <div className="flex justify-center gap-2 mb-10">
          {seasons.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                className={`flex items-center gap-2 px-6 py-3 text-[10px] font-body font-medium tracking-[0.15em] uppercase transition-all ${
                  i === active
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>

        <motion.div
          key={season.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border"
        >
          {season.trends.map((t, i) => (
            <motion.button
              key={t.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              onClick={() => navigate("/recommender")}
              className="bg-background p-6 md:p-8 text-left group hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-body font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {season.label}
                </span>
                <span className="text-lg font-heading font-light text-accent">{t.growth}</span>
              </div>
              <h3 className="font-heading text-lg md:text-xl italic text-foreground mb-2">{t.name}</h3>
              <p className="text-[11px] font-body text-muted-foreground leading-relaxed">{t.desc}</p>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SeasonalTrends;
