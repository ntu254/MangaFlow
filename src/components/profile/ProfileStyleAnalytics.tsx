import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const styleDna = [
  { style: "Minimal", value: 70 },
  { style: "Streetwear", value: 15 },
  { style: "Casual", value: 10 },
  { style: "Elegant", value: 5 },
  { style: "Athleisure", value: 8 },
  { style: "Classic", value: 12 },
];

const favoriteColors = [
  { name: "Trắng", hex: "#FFFFFF", pct: 35 },
  { name: "Be", hex: "#F5F0E8", pct: 25 },
  { name: "Đen", hex: "#1C1C1C", pct: 20 },
  { name: "Navy", hex: "#1B2A4A", pct: 12 },
  { name: "Sage Green", hex: "#9CAF88", pct: 8 },
];

const outfitTypes = [
  { name: "Casual", value: 42, color: "hsl(0 0% 75%)" },
  { name: "Office", value: 28, color: "hsl(0 0% 45%)" },
  { name: "Streetwear", value: 15, color: "hsl(0 100% 70%)" },
  { name: "Tiệc tùng", value: 10, color: "hsl(0 0% 25%)" },
  { name: "Thể thao", value: 5, color: "hsl(166 65% 50%)" },
];

const insights = [
  "Bạn thường chọn tông màu trung tính — phong cách minimal rất rõ nét.",
  "Bạn ưa chuộng silhouette tối giản và đường cắt sạch.",
  "Rất hiếm khi bạn mặc màu sắc rực rỡ — thử thêm pastel nhé!",
];

const Fade = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.45, delay }}
  >
    {children}
  </motion.div>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`border border-border bg-card p-6 ${className}`}>{children}</div>
);

const CardLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="editorial-label mb-3">{children}</p>
);

const ProfileStyleAnalytics = () => (
  <Fade>
    <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border">
      {/* Style DNA */}
      <Card className="border-b md:border-b-0 md:border-r">
        <CardLabel>Style DNA</CardLabel>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={styleDna} outerRadius="72%">
            <PolarGrid stroke="hsl(0 0% 90%)" />
            <PolarAngleAxis dataKey="style" tick={{ fontSize: 10, fill: "hsl(0 0% 45%)", fontFamily: "'Be Vietnam Pro'" }} />
            <Radar dataKey="value" stroke="hsl(0 100% 70%)" fill="hsl(0 100% 70%)" fillOpacity={0.15} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
        <p className="text-center text-[11px] text-muted-foreground font-body mt-2">
          Chủ đạo: <span className="text-foreground font-medium">Minimal · 70%</span>
        </p>
      </Card>

      {/* Favorite Colors */}
      <Card className="border-b md:border-b-0">
        <CardLabel>Bảng màu yêu thích</CardLabel>
        <div className="flex flex-col gap-3 mt-4">
          {favoriteColors.map((c) => (
            <div key={c.name} className="flex items-center gap-3">
              <div className="w-8 h-8 shrink-0 border border-border" style={{ backgroundColor: c.hex }} />
              <span className="text-sm font-body text-foreground flex-1">{c.name}</span>
              <div className="flex-1 h-1.5 bg-secondary max-w-[120px]">
                <div className="h-full bg-accent" style={{ width: `${c.pct}%`, opacity: 0.4 + c.pct / 100 }} />
              </div>
              <span className="text-xs text-muted-foreground font-body w-10 text-right">{c.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Outfit Types */}
      <Card className="border-b md:border-b-0 md:border-r">
        <CardLabel>Loại trang phục</CardLabel>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie data={outfitTypes} dataKey="value" innerRadius={45} outerRadius={72} paddingAngle={2} strokeWidth={0}>
                {outfitTypes.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 flex-1">
            {outfitTypes.map((t) => (
              <div key={t.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-xs font-body text-foreground w-20">{t.name}</span>
                <span className="text-xs text-muted-foreground font-body">{t.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* AI Insight */}
      <Card className="flex flex-col justify-between">
        <div>
          <CardLabel>AI Phân tích phong cách</CardLabel>
          <div className="mt-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent mb-3" />
            <p className="font-heading text-lg md:text-xl text-foreground leading-relaxed">
              "Phong cách của bạn là modern minimal với ảnh hưởng streetwear nhẹ nhàng."
            </p>
            <p className="text-xs text-muted-foreground font-body mt-3 leading-relaxed">
              Bạn ưa chuộng outfit trung tính, linh hoạt cho cả casual lẫn office.
            </p>
          </div>
        </div>
        <div className="border-t border-border pt-4 space-y-2">
          {insights.map((text, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-accent shrink-0 mt-1.5" />
              <p className="text-[11px] text-muted-foreground font-body leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </Fade>
);

export default ProfileStyleAnalytics;
