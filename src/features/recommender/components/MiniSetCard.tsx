import type { Outfit } from "@/features/recommender/types";
import { ChevronRight } from "lucide-react";

interface MiniSetCardProps {
  outfit: Outfit;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const MiniSetCard = ({ outfit, index, isActive, onClick }: MiniSetCardProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left cursor-pointer ${
        isActive
          ? "border-foreground/30 bg-secondary/40 shadow-sm"
          : "border-border/30 bg-card hover:bg-secondary/20 hover:border-border/60"
      }`}
    >
      {/* Thumbnails */}
      <div className="flex -space-x-2 shrink-0">
        {outfit.products.slice(0, 4).map((p, i) => (
          <div
            key={i}
            className="w-9 h-9 rounded-lg overflow-hidden border-2 border-card bg-secondary/40"
          >
            <img
              src={p.image || "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100&q=60"}
              alt={p.name}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-body font-semibold text-foreground truncate">
            Set {index + 1} - {outfit.title}
          </p>
          {outfit.matchScore && (
            <span className="text-[9px] font-body font-bold text-teal bg-teal/10 px-1.5 py-0.5 rounded-full shrink-0">
              {outfit.matchScore}%
            </span>
          )}
        </div>
        <p className="text-[10px] font-body text-muted-foreground mt-0.5 truncate">
          {outfit.styleTags.slice(0, 3).join(" · ")}
        </p>
      </div>

      {/* Price + Arrow */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-body font-bold text-foreground">{outfit.totalPrice}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  );
};

export default MiniSetCard;
