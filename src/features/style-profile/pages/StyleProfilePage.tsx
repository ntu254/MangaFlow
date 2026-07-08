import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/shared/layout";
import { Badge, Button } from "@/shared/ui";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  Shirt,
  Sparkles,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { styleProfileService } from "../services/style-profile.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { StyleProfile, StyleRecommendation } from "../types";

import blackBlazer from "@/assets/wardrobe/black-blazer.jpg";
import blueJeans from "@/assets/wardrobe/blue-jeans.jpg";
import grayHoodie from "@/assets/wardrobe/gray-hoodie.jpg";
import pinkSilkShirt from "@/assets/wardrobe/pink-silk-shirt.jpg";
import whiteSneakers from "@/assets/wardrobe/white-sneakers.jpg";
import whiteTshirt from "@/assets/wardrobe/white-tshirt.jpg";

import kfashion from "@/assets/lookbook-kfashion.jpg";
import styleMinimal from "@/assets/style-minimal-new.jpg";
import styleOffice from "@/assets/style-office-new.jpg";
import styleStreet from "@/assets/style-streetwear-new.jpg";

// Map image names or use fallbacks for suggested styles if AI doesn't provide images
const styleImages: Record<string, string> = {
  "Quiet Luxury": styleMinimal,
  "Soft Minimal": styleOffice,
  "K-Fashion Casual": kfashion,
  "Modern Streetwear": styleStreet,
  "Minimal": styleMinimal,
  "Office": styleOffice,
  "Streetwear": styleStreet,
};

const Fade = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.45, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`border border-border bg-card p-6 ${className}`}>
    {children}
  </div>
);

const CardLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="editorial-label mb-3">{children}</p>
);

const StyleProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<StyleProfile | null>(null);
  const [recommendations, setRecommendations] = useState<StyleRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (forceRefresh = false) => {
    if (!user) return;
    try {
      if (forceRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      
      const [profileData, recsData] = await Promise.all([
        styleProfileService.getProfile(user.id, forceRefresh),
        styleProfileService.getRecommendations(user.id)
      ]);
      setProfile(profileData);
      setRecommendations(recsData);
    } catch (err) {
      console.error("Failed to load style profile:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Navbar />
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <RefreshCw className="w-8 h-8 animate-spin text-accent" />
          <div>
            <h2 className="font-heading text-2xl text-foreground mt-2">AI đang phân tích tủ đồ...</h2>
            <p className="text-muted-foreground font-body text-sm mt-1">Quá trình này có thể mất vài giây</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Navbar />
        <div className="text-center p-6">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-4" />
          <h2 className="font-heading text-xl text-foreground">Không thể tải hồ sơ phong cách</h2>
          <Button variant="outline" className="mt-4" onClick={() => loadData(true)}>Thử lại</Button>
        </div>
      </div>
    );
  }

  // Use provided evolution or fallback
  const evolution = profile.evolution?.length ? profile.evolution : [
    { month: "Jan", [profile.dominantStyles?.[0] || "Casual"]: 100 }
  ];

  const topStyle = profile.styleDna?.length > 0 ? profile.styleDna.sort((a,b) => b.value - a.value)[0] : {style: "Casual", value: 100};

  return (
  <div className="min-h-screen bg-background">
    <Navbar />

    <div className="pt-16 relative">
      <div className="absolute top-20 right-6 z-10 hidden md:block">
        <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => loadData(true)} disabled={isRefreshing}>
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
          Làm mới AI
        </Button>
      </div>
      <div className="border-b border-border px-6 py-12 md:py-16 text-center relative">
        <p className="editorial-label mb-3">AI-Powered Analytics</p>
        <h1 className="font-heading text-3xl md:text-5xl font-medium text-foreground blur-text-reveal">
          Your <span className="italic">Style Profile</span>
        </h1>
        <p className="text-muted-foreground font-body mt-3 text-sm max-w-md mx-auto blur-text-reveal blur-text-reveal-delay-1">
          AI insights về tủ đồ và xu hướng thời trang cá nhân của bạn.
        </p>
        <div className="mt-4 md:hidden">
          <Button variant="outline" size="sm" className="gap-2 text-xs mx-auto" onClick={() => loadData(true)} disabled={isRefreshing}>
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
            Làm mới phân tích
          </Button>
        </div>
      </div>
    </div>

    <Fade>
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border">
        <Card className="border-b md:border-b-0 md:border-r">
          <CardLabel>Style DNA</CardLabel>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={profile.styleDna} outerRadius="72%">
              <PolarGrid stroke="hsl(0 0% 90%)" />
              <PolarAngleAxis
                dataKey="style"
                tick={{
                  fontSize: 10,
                  fill: "hsl(0 0% 45%)",
                  fontFamily: "'DM Sans'",
                }}
              />
              <Radar
                dataKey="value"
                stroke="hsl(0 100% 70%)"
                fill="hsl(0 100% 70%)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-center text-[11px] text-muted-foreground font-body mt-2">
            Chủ đạo:{" "}
            <span className="text-foreground font-medium">{topStyle.style} · {topStyle.value}%</span>
          </p>
        </Card>

        <Card className="border-b md:border-b-0">
          <CardLabel>Favorite Colors</CardLabel>
          <div className="flex flex-col gap-3 mt-4">
            {profile.favoriteColors?.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 shrink-0 border border-border"
                  style={{ backgroundColor: c.hex || "#e5e5e5" }}
                />
                <span className="text-sm font-body text-foreground flex-1">
                  {c.name}
                </span>
                <div className="flex-1 h-1.5 bg-secondary max-w-[120px]">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${c.pct}%`, opacity: 0.4 + (c.pct || 0) / 100 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-body w-10 text-right">
                  {c.pct}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-b md:border-b-0 md:border-r">
          <CardLabel>Outfit Types</CardLabel>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={profile.outfitTypeDistribution || []}
                  dataKey="value"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {(profile.outfitTypeDistribution || []).map((e) => (
                    <Cell key={e.name} fill={e.color || "hsl(0 0% 75%)"} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {(profile.outfitTypeDistribution || []).map((t) => (
                <div key={t.name} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 shrink-0"
                    style={{ backgroundColor: t.color || "hsl(0 0% 75%)" }}
                  />
                  <span className="text-xs font-body text-foreground w-20">
                    {t.name}
                  </span>
                  <span className="text-xs text-muted-foreground font-body">
                    {t.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <CardLabel>AI Style Insight</CardLabel>
            <div className="mt-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent mb-3" />
              <p className="font-heading text-lg md:text-xl text-foreground italic leading-relaxed">
                "{profile.aiInsight?.summary || `Phong cách của bạn thiên hướng ${topStyle.style}`}"
              </p>
              <p className="text-xs text-muted-foreground font-body mt-3 leading-relaxed">
                {profile.aiInsight?.description}
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-4 space-y-2">
            {(profile.insights || []).slice(0, 3).map((text, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-accent shrink-0 mt-1.5" />
                <p className="text-[11px] text-muted-foreground font-body leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Fade>

    <Fade>
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border">
        <Card className="border-b md:border-b-0 md:border-r">
          <CardLabel>Style Consistency</CardLabel>
          <div className="flex flex-col items-center justify-center h-full py-4">
            <div className="relative w-28 h-28 mb-3">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(0 0% 92%)" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(0 100% 70%)" strokeWidth="8" strokeDasharray={`${2 * Math.PI * 52}`} strokeDashoffset={`${2 * Math.PI * 52 * (1 - (profile.consistencyScore || 50) / 100)}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-heading text-2xl text-foreground">{profile.consistencyScore || 50}%</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-body text-center max-w-[200px]">
              Style consistency dựa trên sự đồng bộ về màu sắc, kiểu dáng và chất liệu trong tủ đồ.
            </p>
          </div>
        </Card>

        <Card>
          <CardLabel>Cải thiện tủ đồ</CardLabel>
          <div className="space-y-3 mt-2">
            {(profile.missingEssentials || []).map((e) => (
              <div key={e.item} className="flex items-start gap-3">
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  e.priority === "high" ? "text-accent" : e.priority === "medium" ? "text-amber-400" : "text-muted-foreground"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-body text-foreground">{e.item}</span>
                    <Badge variant={e.priority === "high" ? "default" : "secondary"} className="text-[9px] px-1.5 py-0 leading-none">
                      {e.priority === "high" ? "Cần" : e.priority === "medium" ? "Nên" : "Có thể"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-body mt-0.5">{e.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Fade>

    <Fade>
      <div className="border-b border-border">
        <div className="px-6 py-6 border-b border-border">
          <p className="editorial-label mb-1">Style Evolution</p>
          <p className="text-xs text-muted-foreground font-body">
            Xem phong cách thời trang của bạn thay đổi theo thời gian dựa trên
            outfit và tủ đồ.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
          <div className="p-6 lg:border-r border-border">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={evolution}>
                <defs>
                  <linearGradient id="gradMinimal" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="hsl(0 100% 70%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(0 100% 70%)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(0 0% 94%)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "hsl(0 0% 50%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(0 0% 50%)" }}
                  width={28}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 80]}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(0 0% 90%)",
                    fontSize: 11,
                    fontFamily: "'DM Sans'",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey={topStyle.style}
                  stroke="hsl(0 100% 70%)"
                  strokeWidth={2.5}
                  fill="url(#gradMinimal)"
                />
                {Object.keys(evolution[0] || {}).filter(k => k !== "month" && k !== topStyle.style).map((key, i) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={i === 0 ? "hsl(0 0% 78%)" : "hsl(0 0% 55%)"}
                    strokeWidth={1.5}
                    fill="transparent"
                    strokeDasharray={i === 0 ? "4 3" : "2 2"}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>

            <div className="flex flex-wrap items-center gap-5 mt-4">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-[2.5px] bg-accent" />
                <span className="text-[9px] font-body text-muted-foreground uppercase tracking-wider">
                  {topStyle.style}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <p className="editorial-label mb-3">Trend Summary</p>
              <div className="space-y-3">
                {(profile.trendSummary || []).map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-body text-foreground">
                      {s.label}
                    </span>
                    <span
                      className={`text-sm font-body font-medium ${
                        s.positive === true
                          ? "text-accent"
                          : s.positive === false
                            ? "text-muted-foreground"
                            : "text-foreground/60"
                      }`}
                    >
                      {s.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="editorial-label mb-2">Key Moments</p>
              <div className="space-y-2.5">
                {(profile.keyMoments || []).map((moment, i) => (
                   <div key={i} className="flex gap-2">
                   <span className="w-1 h-1 rounded-full bg-accent shrink-0 mt-1.5" />
                   <p className="text-[11px] text-muted-foreground font-body leading-relaxed">
                     <span className="text-foreground font-medium">{moment.month}</span>{" "}
                     — {moment.event}
                   </p>
                 </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fade>

    <Fade>
      <div className="border-b border-border">
        <div className="px-6 py-6 border-b border-border">
          <p className="editorial-label">Suggested Styles</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {(profile.suggestedStyles || []).map((s, i) => (
            <div
              key={s.name}
              className={`group ${i < (profile.suggestedStyles?.length || 0) - 1 ? "border-r border-border" : ""}`}
            >
              <div className="aspect-[3/4] overflow-hidden mag-img-zoom">
                <img
                  src={styleImages[s.name] || styleMinimal}
                  alt={s.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 border-t border-border">
                <h3 className="font-heading text-base text-foreground">
                  {s.name}
                </h3>
                <p className="text-[11px] text-muted-foreground font-body mt-0.5">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Fade>

    <Fade>
      <div className="border-b border-border">
        <div className="px-6 py-6 border-b border-border">
          <p className="editorial-label mb-1">Gợi ý phối đồ</p>
          <p className="text-xs text-muted-foreground font-body">
            Tạo outfit ngay dựa trên phong cách cá nhân của bạn.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {recommendations.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => navigate(`/recommender?prompt=${encodeURIComponent(r.prompt)}`)}
              className="group p-6 text-left border-r border-border last:border-r-0 hover:bg-muted/30 transition-colors"
            >
              <Lightbulb className="w-5 h-5 text-accent mb-2" />
              <p className="font-heading text-sm text-foreground group-hover:text-accent transition-colors">
                {r.label}
              </p>
              <p className="text-[10px] text-muted-foreground font-body mt-1 line-clamp-2">
                {r.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>
    </Fade>

    <div className="px-6 py-14 text-center">
      <p className="editorial-label mb-3">Tiếp theo</p>
      <h2 className="font-heading text-2xl md:text-3xl font-light text-foreground mb-5">
        Tạo outfit <span className="italic">cho phong cách của bạn</span>
      </h2>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          variant="accent"
          size="lg"
          className="gap-2"
          onClick={() => navigate("/recommender")}
        >
          Generate Outfits <ArrowRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          onClick={() => navigate("/trends")}
        >
          <TrendingUp className="w-4 h-4" /> Khám phá xu hướng
        </Button>
      </div>
    </div>
  </div>
  );
};

export default StyleProfilePage;
