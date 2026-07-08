import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface TrendSearchProps {
  onSearch: (query: string) => void;
}

const suggestions = [
  "outfit linen", "cargo pants streetwear", "quiet luxury",
  "phối blazer oversized", "gorpcore aesthetic", "xu hướng màu sắc",
];

const TrendSearch = ({ onSearch }: TrendSearchProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <section className="border-t border-border">
      <div className="container mx-auto max-w-6xl px-6 py-8">
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm xu hướng, phong cách, sản phẩm, màu sắc..."
            className="w-full bg-transparent border border-border pl-11 pr-10 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-foreground/30 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); onSearch(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {suggestions.map((s, i) => (
            <motion.button
              key={s}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              type="button"
              onClick={() => { setQuery(s); onSearch(s); }}
              className="px-3 py-1.5 text-[10px] font-body text-muted-foreground border border-border hover:border-foreground/20 hover:text-foreground transition-colors"
            >
              {s}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendSearch;
