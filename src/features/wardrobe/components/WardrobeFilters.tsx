import { cn } from "@/lib/utils";

const categories = [
  "All",
  "Tops",
  "Bottoms",
  "Shoes",
  "Outerwear",
  "Accessories",
];

interface WardrobeFiltersProps {
  active: string;
  onChange: (cat: string) => void;
}

const WardrobeFilters = ({ active, onChange }: WardrobeFiltersProps) => (
  <div className="flex items-center gap-2 flex-wrap">
    {categories.map((cat) => (
      <button
        key={cat}
        onClick={() => onChange(cat)}
        className={cn(
          "px-4 py-2 rounded-full text-xs font-body font-medium tracking-wide transition-all duration-200",
          active === cat
            ? "bg-foreground text-background shadow-md"
            : "bg-secondary text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
        )}
      >
        {cat}
      </button>
    ))}
  </div>
);

export default WardrobeFilters;
