import type { WardrobeAnalysis } from "@/features/wardrobe/types";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Palette,
  Shirt,
  ShoppingBag,
  Sparkles,
  Zap,
} from "lucide-react";

interface WardrobeAnalysisProps {
  analysis: WardrobeAnalysis;
}

export function WardrobeAnalysis({ analysis }: WardrobeAnalysisProps) {
  const maxCategory = Math.max(...analysis.categoryDistribution.map((c) => c.count));
  const maxStyle = Math.max(...analysis.styleDistribution.map((s) => s.count));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-accent mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">
              Consistency
            </span>
          </div>
          <p className="text-2xl font-heading font-semibold text-foreground">
            {analysis.consistencyScore}%
          </p>
          <p className="text-xs font-body text-muted-foreground mt-0.5">
            Phong cách {analysis.dominantStyles[0] || "—"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-teal mb-1">
            <Palette className="w-4 h-4" />
            <span className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">
              Top Color
            </span>
          </div>
          <p className="text-2xl font-heading font-semibold text-foreground">
            {analysis.topColor}
          </p>
          <p className="text-xs font-body text-muted-foreground mt-0.5">
            Màu chủ đạo trong tủ đồ
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-accent mb-1">
            <Shirt className="w-4 h-4" />
            <span className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">
              Top Category
            </span>
          </div>
          <p className="text-2xl font-heading font-semibold text-foreground">
            {analysis.topCategory}
          </p>
          <p className="text-xs font-body text-muted-foreground mt-0.5">
            {analysis.totalItems} items total
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">
              Missing
            </span>
          </div>
          <p className="text-2xl font-heading font-semibold text-foreground">
            {analysis.missingEssentials.length}
          </p>
          <p className="text-xs font-body text-muted-foreground mt-0.5">
            Items cần bổ sung
          </p>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" /> Phân bố danh mục
        </h3>
        <div className="space-y-3">
          {analysis.categoryDistribution.map((cat) => (
            <div key={cat.category}>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-body text-foreground">{cat.category}</span>
                <span className="text-xs font-body text-muted-foreground">{cat.count} items</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${(cat.count / maxCategory) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Style Distribution + Color Palette */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Phong cách</h3>
          <div className="space-y-3">
            {analysis.styleDistribution.map((s) => (
              <div key={s.style}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-body text-foreground">{s.style}</span>
                  <span className="text-xs font-body text-muted-foreground">{s.count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal rounded-full transition-all duration-500"
                    style={{ width: `${(s.count / maxStyle) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Bảng màu</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.colorPalette.map((c) => (
              <div key={c.color} className="flex flex-col items-center gap-1">
                <div
                  className="w-10 h-10 rounded-xl border-2 border-border shadow-sm"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-xs font-body text-muted-foreground">{c.label}</span>
                <span className="text-xs font-body text-muted-foreground">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Missing Essentials */}
      {analysis.missingEssentials.length > 0 && (
        <div className="bg-card border border-amber-200 dark:border-amber-900 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-heading font-semibold text-foreground">
              Items cần bổ sung
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.missingEssentials.map((item) => (
              <span
                key={item}
                className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-body font-medium"
              >
                <ShoppingBag className="w-3 h-3 inline mr-1" />
                {item}
              </span>
            ))}
          </div>
          <p className="text-xs font-body text-muted-foreground mt-3">
            AI đề xuất bổ sung những item này để tăng khả năng phối đồ
          </p>
        </div>
      )}

      {/* Season Breakdown */}
      {analysis.seasonBreakdown.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" /> Phân bố theo mùa
          </h3>
          <div className="flex gap-4">
            {analysis.seasonBreakdown.map((s) => (
              <div key={s.season} className="flex-1 text-center">
                <p className="text-lg font-heading font-semibold text-foreground">{s.count}</p>
                <p className="text-xs font-body text-muted-foreground">{s.season}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
