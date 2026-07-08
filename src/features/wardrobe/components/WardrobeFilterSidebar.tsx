import { WARDROBE_FILTER_GROUPS } from "@/features/wardrobe/constants";
import type { ActiveFilters } from "@/features/wardrobe/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChevronDown, Filter } from "lucide-react";
import { useState } from "react";

interface WardrobeFilterSidebarProps {
  filters: ActiveFilters;
  onChange: (filters: ActiveFilters) => void;
}

type FilterGroup = (typeof WARDROBE_FILTER_GROUPS)[number];

const CollapsibleGroup = ({ group, selected, onToggle }: { group: FilterGroup; selected: string[]; onToggle: (key: string, value: string) => void }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full py-3 px-1 text-left group">
        <span className="text-xs font-body font-semibold text-foreground uppercase tracking-wider">{group.label}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pb-3 px-1 space-y-1">
          {group.options.map((opt) => {
            const isActive = selected.includes(opt.value);
            return (
              <button key={opt.value} onClick={() => onToggle(group.key, opt.value)}
                className={cn("flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-xs font-body transition-all duration-150",
                  isActive ? "bg-accent/10 text-accent font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
                {opt.color && <span className={cn("w-3.5 h-3.5 rounded-full border shrink-0", isActive ? "border-accent" : "border-border")} style={{ backgroundColor: opt.color }} />}
                <span>{opt.label}</span>
                {isActive && <span className="ml-auto text-[9px] text-accent">✓</span>}
              </button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

const WardrobeFilterSidebar = ({ filters, onChange }: WardrobeFilterSidebarProps) => {
  const totalActive = Object.values(filters).flat().length;

  const handleToggle = (key: string, value: string) => {
    const current = filters[key as keyof ActiveFilters];
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: updated });
  };

  const handleClear = () => {
    onChange({ category: [], style: [], color: [], season: [] });
  };

  return (
    <motion.aside initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-foreground" strokeWidth={1.5} />
          <span className="text-sm font-body font-semibold text-foreground">Bộ lọc</span>
          {totalActive > 0 && (
            <span className="text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-body font-medium">{totalActive}</span>
          )}
        </div>
        {totalActive > 0 && (
          <button onClick={handleClear} className="text-[10px] font-body text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            Xóa tất cả
          </button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border p-3 shadow-sm">
        {WARDROBE_FILTER_GROUPS.map((group) => (
          <CollapsibleGroup key={group.key} group={group} selected={filters[group.key as keyof ActiveFilters]} onToggle={handleToggle} />
        ))}
      </div>
    </motion.aside>
  );
};

export default WardrobeFilterSidebar;
