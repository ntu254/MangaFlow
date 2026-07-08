import type { WardrobeItem } from "@/features/wardrobe/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui";
import { AnimatePresence, motion } from "framer-motion";
import { MoreVertical, Pencil, Shirt, Sparkles, Trash2 } from "lucide-react";
import { forwardRef, useState } from "react";

interface WardrobeItemCardProps {
  item: WardrobeItem;
  index: number;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
  onEdit: (item: WardrobeItem) => void;
  onDelete: (item: WardrobeItem) => void;
  onSuggestOutfit: (item: WardrobeItem) => void;
}

const tagColors: Record<string, string> = {
  Casual: "bg-secondary text-foreground/70",
  Office: "bg-secondary text-foreground/70",
  Streetwear: "bg-secondary text-foreground/70",
  Minimal: "bg-muted text-muted-foreground",
  Party: "bg-secondary text-foreground/70",
  Sporty: "bg-secondary text-foreground/70",
};

const WardrobeItemCard = forwardRef<HTMLDivElement, WardrobeItemCardProps>(
  ({ item, index, selected, onToggleSelect, onEdit, onDelete, onSuggestOutfit }, ref) => {
    const [hovered, setHovered] = useState(false);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.035, duration: 0.35 }}
        layout
        className={`group relative rounded-xl overflow-hidden bg-card/60 backdrop-blur-md border border-border/40 transition-all duration-300 cursor-pointer ${
          selected
            ? "ring-2 ring-foreground/20"
            : "hover:shadow-sm hover:-translate-y-0.5"
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onToggleSelect?.(item.id)}
      >
        <div className="aspect-[4/5] bg-secondary/40 relative flex items-center justify-center overflow-hidden">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Shirt className="w-10 h-10 text-muted-foreground/12" strokeWidth={1} />
            </div>
          )}

          {onToggleSelect && (
            <div
              className={`absolute top-2.5 left-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                selected
                  ? "bg-accent border-accent scale-100"
                  : "border-background/60 bg-foreground/20 backdrop-blur-sm scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100"
              }`}
            >
              {selected && (
                <span className="text-accent-foreground text-[9px] font-bold">&#10003;</span>
              )}
            </div>
          )}

          {item.season && (
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-background/80 backdrop-blur-sm text-[9px] font-body font-medium text-muted-foreground">
              {item.season}
            </div>
          )}

          <div className="absolute top-2.5 right-2.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="w-7 h-7 rounded-md bg-background/80 flex items-center justify-center hover:bg-background transition-colors">
                  <MoreVertical className="w-3.5 h-3.5 text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
                  <Pencil className="w-3.5 h-3.5 mr-2" /> Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSuggestOutfit(item); }}>
                  <Sparkles className="w-3.5 h-3.5 mr-2" /> Tạo outfit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(item); }}>
                  <Trash2 className="w-3.5 h-3.5 mr-2 text-destructive" /> Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="p-3">
          <p className="text-[13px] font-body font-medium text-foreground truncate leading-tight">
            {item.name}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="w-2.5 h-2.5 rounded-full border border-border/60 shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[9px] text-muted-foreground font-body uppercase tracking-wider">
              {item.category}
            </span>
            {item.source === "ai-scan" && (
              <span className="text-[8px] text-accent font-body font-medium ml-auto flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            )}
          </div>
          {item.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-[8px] px-1.5 py-px rounded-full font-body font-medium uppercase tracking-wider leading-relaxed ${
                    tagColors[tag] || "bg-secondary text-muted-foreground"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  },
);

WardrobeItemCard.displayName = "WardrobeItemCard";

export default WardrobeItemCard;
