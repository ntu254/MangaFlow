import { Button } from "@/shared/ui";
import { motion } from "framer-motion";
import { Heart, Plus, Shirt, Sparkles, Upload } from "lucide-react";

interface WardrobeHeaderProps {
  itemCount: number;
  savedOutfits: number;
  aiSuggestions: number;
  onAddClick?: () => void;
  onViewSavedAiOutfits?: () => void;
}

const WardrobeHeader = ({
  itemCount,
  savedOutfits,
  aiSuggestions,
  onAddClick,
  onViewSavedAiOutfits,
}: WardrobeHeaderProps) => {
  const stats = [
    {
      icon: Shirt,
      value: itemCount,
      label: "Món đồ",
      accent: "bg-accent/10 text-accent",
    },
    {
      icon: Heart,
      value: savedOutfits,
      label: "Outfit đã lưu",
      accent: "bg-teal-light text-teal",
    },
    {
      icon: Sparkles,
      value: aiSuggestions,
      label: "Gợi ý từ AI",
      accent: "bg-accent/10 text-accent",
    },
  ];

  return (
    <div className="px-6 pt-24 pb-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="editorial-label mb-2">Tủ đồ thông minh</p>
            <h1 className="font-heading text-4xl md:text-5xl font-light text-foreground leading-tight">
              Tủ đồ <span className="italic">của tôi</span>
            </h1>
            <p className="text-muted-foreground font-body text-sm mt-1.5 max-w-sm">
              Bộ sưu tập quần áo cá nhân được AI hỗ trợ phối đồ.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex items-center gap-2.5"
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl text-xs"
            >
              <Upload className="w-3.5 h-3.5" /> Tải nhiều ảnh
            </Button>
            <Button
              variant="accent"
              size="default"
              className="gap-2 rounded-xl"
              onClick={onAddClick}
            >
              <Plus className="w-4 h-4" /> Thêm món đồ
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex gap-3 flex-wrap"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.08 }}
              onClick={stat.label === "Outfit đã lưu" ? onViewSavedAiOutfits : undefined}
              className={`flex items-center gap-3 bg-card rounded-xl border border-border px-4 py-3 shadow-sm hover:shadow-md transition-shadow ${
                stat.label === "Outfit đã lưu" ? "cursor-pointer" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.accent}`}
              >
                <stat.icon className="w-3.5 h-3.5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-lg font-heading font-semibold text-foreground leading-none">
                  {stat.value}
                </p>
                <p className="text-[9px] font-body text-muted-foreground uppercase tracking-wider mt-0.5">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default WardrobeHeader;
