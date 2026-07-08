import { motion } from "framer-motion";
import { TrendingUp, Sparkles } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const evolution = [
  { month: "Th1", Minimal: 30, Casual: 50, Office: 20 },
  { month: "Th2", Minimal: 35, Casual: 45, Office: 20 },
  { month: "Th3", Minimal: 50, Casual: 30, Office: 20 },
  { month: "Th4", Minimal: 55, Casual: 25, Office: 20 },
  { month: "Th5", Minimal: 60, Casual: 20, Office: 20 },
  { month: "Th6", Minimal: 70, Casual: 10, Office: 20 },
];

const ProfileStyleEvolution = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.5 }}
  >
    <div className="border-b border-border">
      <div className="px-6 py-6 border-b border-border">
        <p className="editorial-label mb-1">Sự thay đổi phong cách</p>
        <p className="text-xs text-muted-foreground font-body">
          Xem phong cách thời trang của bạn thay đổi theo thời gian.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
        <div className="p-6 lg:border-r border-border">
          <div className="mb-6 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-heading text-lg md:text-xl text-foreground">
                Phong cách đang trở nên <span className="text-accent font-semibold">Minimal</span> hơn
              </p>
              <p className="text-[11px] text-muted-foreground font-body mt-1">
                Minimal tăng từ 30% lên 70% trong 6 tháng qua.
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={evolution}>
              <defs>
                <linearGradient id="gradMinimal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0 100% 70%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(0 100% 70%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 94%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(0 0% 50%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(0 0% 50%)" }} width={28} axisLine={false} tickLine={false} domain={[0, 80]} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0 0% 100%)",
                  border: "1px solid hsl(0 0% 90%)",
                  fontSize: 11,
                  fontFamily: "'Be Vietnam Pro'",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                formatter={(value: number, name: string) => [`${value}%`, name]}
              />
              <Area type="monotone" dataKey="Minimal" stroke="hsl(0 100% 70%)" strokeWidth={2.5} fill="url(#gradMinimal)" />
              <Area type="monotone" dataKey="Casual" stroke="hsl(0 0% 78%)" strokeWidth={1.5} fill="transparent" strokeDasharray="4 3" />
              <Area type="monotone" dataKey="Office" stroke="hsl(0 0% 55%)" strokeWidth={1.5} fill="transparent" strokeDasharray="2 2" />
            </AreaChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-5 mt-4">
            {[
              { name: "Minimal", style: "w-5 h-[2.5px] bg-accent" },
              { name: "Casual", style: "w-5 h-0 border-t-[1.5px] border-dashed border-muted-foreground/40" },
              { name: "Office", style: "w-5 h-0 border-t-[1.5px] border-dotted border-muted-foreground/60" },
            ].map((l) => (
              <div key={l.name} className="flex items-center gap-1.5">
                <span className={l.style} />
                <span className="text-[9px] font-body text-muted-foreground uppercase tracking-wider">{l.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="editorial-label mb-3">Tổng quan</p>
            <div className="space-y-3">
              {[
                { label: "Minimal", change: "+40%", positive: true },
                { label: "Casual", change: "−40%", positive: false },
                { label: "Office", change: "Ổn định", positive: null },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm font-body text-foreground">{s.label}</span>
                  <span className={`text-sm font-body font-medium ${
                    s.positive === true ? "text-accent" : s.positive === false ? "text-muted-foreground" : "text-foreground/60"
                  }`}>{s.change}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="editorial-label mb-2">Mốc quan trọng</p>
            <div className="space-y-2.5">
              {[
                { month: "Tháng 3", text: "Minimal bắt đầu tăng mạnh" },
                { month: "Tháng 6", text: "Minimal trở thành phong cách chủ đạo" },
              ].map((m) => (
                <div key={m.month} className="flex gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent shrink-0 mt-1.5" />
                  <p className="text-[11px] text-muted-foreground font-body leading-relaxed">
                    <span className="text-foreground font-medium">{m.month}</span> — {m.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground font-body leading-relaxed">
                "Hoạt động tủ đồ cho thấy sự chuyển dịch dần sang outfit tối giản."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

export default ProfileStyleEvolution;
