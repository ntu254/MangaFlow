import { Button } from "@/shared/ui";
import { motion } from "framer-motion";
import { RefreshCw, Sparkles } from "lucide-react";
import { STYLE_FILTERS, SMART_FILTERS } from "@/features/recommender/types";

interface OutfitHeaderProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onRefresh: () => void;
  isGenerating: boolean;
  outfitCount: number;
  activePrompt: string;
  smartFilter?: string;
  onSmartFilterChange?: (filter: string) => void;
}

const OutfitHeader = ({ activeFilter, onFilterChange, onRefresh, isGenerating, outfitCount, activePrompt, smartFilter, onSmartFilterChange }: OutfitHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background/76 backdrop-blur-xl border-b border-border/40"
    >
      <div className="px-6 md:px-8 py-3">
        {/* Style filter tabs - horizontal scroll */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {STYLE_FILTERS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onFilterChange(tab.value)}
              className={`text-xs font-body font-medium px-3.5 py-1.5 rounded-full border whitespace-nowrap transition-all shrink-0 ${
                activeFilter === tab.value
                  ? "bg-accent text-accent-foreground border-accent shadow-sm"
                  : "border-border/60 text-muted-foreground hover:border-accent/30 hover:text-accent bg-background/40"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default OutfitHeader;
