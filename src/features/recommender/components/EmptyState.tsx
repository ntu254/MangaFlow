import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const EmptyState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full text-center px-8"
    >
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 via-accent/10 to-teal/10 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-accent" strokeWidth={1.5} />
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-teal/20 flex items-center justify-center"
        >
          <span className="text-xs">✨</span>
        </motion.div>
      </div>
      <h3 className="font-heading text-2xl font-semibold text-foreground mb-3">
        Bạn muốn mặc gì hôm nay?
      </h3>
      <p className="text-sm font-body text-muted-foreground max-w-md mb-8 leading-relaxed">
        Mô tả phong cách, dịp, hoặc tâm trạng — AI sẽ phối outfit hoàn hảo và gợi ý link mua sắm.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {[
          { label: "Outfit đi cà phê", emoji: "☕" },
          { label: "Streetwear cuối tuần", emoji: "🔥" },
          { label: "Công sở dưới 1 triệu", emoji: "💼" },
        ].map((p) => (
          <span
            key={p.label}
            className="text-xs font-body px-4 py-2.5 rounded-full border border-border/60 bg-background/60 text-muted-foreground hover:border-accent/30 hover:text-accent hover:bg-accent/5 cursor-pointer transition-all"
          >
            {p.emoji} {p.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

export default EmptyState;
