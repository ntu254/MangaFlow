import type { WardrobeItem } from "@/features/wardrobe/types";
import { motion } from "framer-motion";
import { Eye, Sparkles } from "lucide-react";

interface WardrobeGridProps {
  items: WardrobeItem[];
  onSelectItem: (item: WardrobeItem) => void;
}

const categoryEmoji: Record<string, string> = {
  "Tops": "👕",
  "Bottoms": "👖",
  "Shoes": "👟",
  "Accessories": "⌚",
  "Outerwear": "🧥",
};

export function WardrobeGrid({ items, onSelectItem }: WardrobeGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.04, duration: 0.3 }}
          className="group relative cursor-pointer"
          onClick={() => onSelectItem(item)}
        >
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-secondary/40 relative">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <span className="text-xs">No image</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <div className="flex items-center gap-1.5 text-background/90">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-[10px] font-body font-medium uppercase tracking-wider">
                  Xem chi tiết
                </span>
              </div>
            </div>

            {/* AI Suggested Badge */}
            {item.source === "ai-scan" && (
              <div className="absolute top-2.5 left-2.5 bg-[#FAF7F2]/90 backdrop-blur-sm border border-[#EBE1D1] rounded-full px-2 py-0.5 shadow-sm flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-[#995941]" />
                <span className="text-[9px] font-body font-medium text-[#995941]">
                  AI gợi ý
                </span>
              </div>
            )}
          </div>

          <div className="mt-2.5 px-0.5 space-y-0.5">
            <p className="text-xs font-body font-semibold text-foreground truncate">
              {item.name}
            </p>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-[10px] font-body text-muted-foreground capitalize">
                {categoryEmoji[item.category] || "👕"} {item.category}
              </span>
              {item.color && (
                <>
                  <span className="text-muted-foreground/35">·</span>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full border border-border/60"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[10px] font-body text-muted-foreground">
                      Màu sắc
                    </span>
                  </div>
                </>
              )}
              {item.season && (
                <>
                  <span className="text-muted-foreground/35">·</span>
                  <span className="text-[9px] font-body bg-[#FAF7F2] text-[#995941] border border-[#EBE1D1]/60 px-1.5 py-0.5 rounded-full capitalize">
                    {item.season}
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
