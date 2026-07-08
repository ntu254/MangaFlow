import type { WardrobeItem } from "@/features/wardrobe/types";
import { Button } from "@/shared/ui";
import { motion } from "framer-motion";
import { AlertCircle, Sparkles } from "lucide-react";

interface UnderusedSectionProps {
  items: WardrobeItem[];
  onSelectItem: (item: WardrobeItem) => void;
}

export function UnderusedSection({ items, onSelectItem }: UnderusedSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="mt-6 mb-8 bg-card border border-border/80 rounded-[24px] p-6 shadow-[0_26px_70px_-36px_hsl(var(--primary)/0.12)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent" />
            <h3 className="font-heading text-lg font-medium text-foreground">
              Món đang bị bỏ quên
            </h3>
            <span className="text-xs font-body bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium border border-border/50">
              {items.length} món
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-body leading-relaxed max-w-xl">
            {items.length} món chưa được phối gần đây. Hãy để AI tạo outfit mới từ chúng.
          </p>
        </div>

        <Button
          variant="accent"
          className="bg-accent hover:bg-accent/90 text-white rounded-full text-xs font-semibold px-5 h-9 shrink-0 gap-1.5 transition-all shadow-[0_18px_34px_-18px_hsl(var(--accent)/0.62)] hover:-translate-y-0.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Phối lại đồ cũ
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="shrink-0 cursor-pointer group"
            onClick={() => onSelectItem(item)}
          >
            <div className="w-24 aspect-[3/4] rounded-xl overflow-hidden bg-secondary/40 relative shadow-sm transition-transform duration-300 group-hover:scale-[1.02]">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <span className="text-xs">No image</span>
                </div>
              )}
              <div className="absolute inset-0 ring-1 ring-inset ring-border/40 rounded-xl" />
            </div>
            <p className="mt-2 text-[11px] font-body font-medium text-foreground truncate max-w-[96px] text-center">
              {item.name}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
