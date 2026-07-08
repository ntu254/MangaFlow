import { WARDROBE_FILTER_GROUPS } from "@/features/wardrobe/constants";
import type { ActiveFilters } from "@/features/wardrobe/types";
import { Button } from "@/shared/ui";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface FilterBarProps {
  filters: ActiveFilters;
  search: string;
  onFilterChange: (filters: ActiveFilters) => void;
  onSearchChange: (search: string) => void;
  onReset: () => void;
  totalItems: number;
  filteredCount: number;
}

export function FilterBar({
  filters,
  search,
  onFilterChange,
  onSearchChange,
  onReset,
  totalItems,
  filteredCount,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters =
    filters.color.length > 0 ||
    filters.style.length > 0 ||
    filters.season.length > 0;

  const categories = WARDROBE_FILTER_GROUPS.find((g) => g.key === "category")?.options || [];
  const styles = WARDROBE_FILTER_GROUPS.find((g) => g.key === "style")?.options || [];
  const colors = WARDROBE_FILTER_GROUPS.find((g) => g.key === "color")?.options || [];
  const seasons = WARDROBE_FILTER_GROUPS.find((g) => g.key === "season")?.options || [];

  const toggleCategory = (cat: string) => {
    const isSelected = filters.category.includes(cat);
    onFilterChange({ ...filters, category: isSelected ? [] : [cat] });
  };

  const toggleFilter = (key: keyof ActiveFilters, value: string) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [key]: updated });
  };

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search and Filter Button */}
      <div className="flex items-center gap-3 relative">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Tìm kiếm trong tủ đồ..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-background/50 backdrop-blur-md border border-border/60 pl-9 pr-9 py-2.5 text-sm font-body rounded-xl focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/30 transition-all placeholder:text-muted-foreground/50 shadow-sm"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="relative" ref={popoverRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`gap-1.5 shrink-0 h-10 px-4 rounded-xl font-medium border-border/60 transition-all backdrop-blur-md ${
              showFilters || hasActiveFilters
                ? "bg-accent/20 border-accent/30 text-accent hover:bg-accent/30"
                : "bg-background/50 hover:bg-secondary/30 text-foreground"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Bộ lọc</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#CA5B43] animate-pulse" />
            )}
          </Button>

          {/* Absolute Popover Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-72 bg-background/60 backdrop-blur-md border border-border/60 rounded-2xl shadow-xl p-5 z-50 space-y-5"
              >
                <div>
                  <p className="font-heading text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5">
                    Màu sắc
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => {
                      const isActive = filters.color.includes(color.value);
                      return (
                        <button
                          key={color.value}
                          onClick={() => toggleFilter("color", color.value)}
                          title={color.label}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${
                            isActive
                              ? "border-foreground scale-110 shadow-sm"
                              : "border-border/60 hover:border-foreground/40"
                          }`}
                          style={{ backgroundColor: color.color }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="font-heading text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5">
                    Phong cách
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {styles.map((style) => {
                      const isActive = filters.style.includes(style.value);
                      return (
                        <button
                          key={style.value}
                          onClick={() => toggleFilter("style", style.value)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-body font-medium transition-all ${
                            isActive
                              ? "bg-[#F5EBE0] text-[#995941] border border-[#E0D0C0] shadow-sm font-semibold"
                              : "bg-secondary/40 text-foreground/70 hover:bg-secondary/60 hover:text-foreground"
                          }`}
                        >
                          {style.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="font-heading text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5">
                    Mùa
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {seasons.map((season) => {
                      const isActive = filters.season.includes(season.value);
                      return (
                        <button
                          key={season.value}
                          onClick={() => toggleFilter("season", season.value)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-body font-medium transition-all ${
                            isActive
                              ? "bg-[#F5EBE0] text-[#995941] border border-[#E0D0C0] shadow-sm font-semibold"
                              : "bg-secondary/40 text-foreground/70 hover:bg-secondary/60 hover:text-foreground"
                          }`}
                        >
                          {season.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground font-body">
                    Đang lọc {filteredCount} / {totalItems} món
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={onReset}
                      className="text-xs text-[#CA5B43] font-body font-medium hover:underline"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Horizontal Category Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide shrink-0">
        <button
          onClick={() => onFilterChange({ ...filters, category: [] })}
          className={`px-4 py-2 rounded-full text-xs font-body font-medium transition-all border shrink-0 ${
            filters.category.length === 0
              ? "bg-[#F5EBE0] border-[#E0D0C0] text-[#995941] font-semibold"
              : "bg-[#FAF7F2] border-border/40 text-foreground/70 hover:bg-secondary/40"
          }`}
        >
          Tất cả
        </button>
        {categories.map((cat) => {
          const isActive = filters.category.includes(cat.value);
          return (
            <button
              key={cat.value}
              onClick={() => toggleCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-xs font-body font-medium transition-all border shrink-0 ${
                isActive
                  ? "bg-[#F5EBE0] border-[#E0D0C0] text-[#995941] font-semibold"
                  : "bg-[#FAF7F2] border-border/40 text-foreground/70 hover:bg-secondary/40"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
