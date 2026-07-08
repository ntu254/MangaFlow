import type { WardrobeItem } from "@/features/wardrobe/types";
import { Button } from "@/shared/ui";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Edit2, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ItemDetailProps {
  item: WardrobeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: WardrobeItem) => void;
  onDelete: (item: WardrobeItem) => void;
}

const categoryEmoji: Record<string, string> = {
  "Tops": "👕",
  "Bottoms": "👖",
  "Shoes": "👟",
  "Accessories": "⌚",
  "Outerwear": "🧥",
};

export function ItemDetail({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: ItemDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Use dateAdded to simulate underused
  const isUnderused = item ? (item.dateAdded && (new Date().getTime() - new Date(item.dateAdded).getTime()) > 45 * 24 * 60 * 60 * 1000) : false;

  const quickMatchSuggestions = ["Phối với quần jeans", "Phối với chân váy"];

  const handleDelete = () => {
    if (!item) return;
    onDelete(item);
    onClose();
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={isMobile ? { opacity: 0, y: 300, x: 0 } : { opacity: 0, x: 400, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={isMobile ? { opacity: 0, y: 300, x: 0 } : { opacity: 0, x: 400, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          style={{ height: isMobile ? "calc(100vh / 0.85)" : "calc((100vh - 64px) / 0.85)", zoom: "85%" }}
          className="fixed bottom-0 left-0 right-0 top-auto md:top-16 md:right-0 md:left-auto z-40 w-full md:w-[360px] lg:w-[400px] bg-background/60 backdrop-blur-md rounded-t-3xl md:rounded-none shadow-2xl flex flex-col border-l border-border/50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
            <h2 className="font-heading text-lg font-medium text-foreground truncate flex-1">
              {item.name}
            </h2>
            <div className="flex items-center gap-2 pl-3">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="relative aspect-[3/4] w-full shrink-0 bg-secondary/20">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <span className="text-xs">No image</span>
                </div>
              )}
            </div>

            <div className="p-5 pb-0 space-y-4">
              <Button
                className="w-full h-11 bg-[#1E293B] text-white hover:bg-[#0F172A] font-medium rounded-xl gap-2 shadow-sm transition-all"
                onClick={() => {}} // Integration ready
              >
                <Sparkles className="w-4 h-4 text-white" />
                Phối món này bằng AI
              </Button>

              {isUnderused && (
                <div className="bg-[#FFF8F2] border border-[#FEEBD9] rounded-xl p-3.5 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#CA5B43] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-foreground font-semibold">
                      Bạn chưa mặc món này trong 45 ngày.
                    </p>
                    <button className="text-[11px] text-[#CA5B43] hover:underline font-medium mt-1">
                      Thử phối lại?
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 pt-4 space-y-6">
              <div>
                <h3 className="font-heading font-medium text-foreground mb-4">Chi tiết</h3>
                <div className="space-y-3.5 text-sm font-body">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <span className="text-muted-foreground">Danh mục</span>
                    <span className="font-medium flex items-center gap-1.5 capitalize">
                      {categoryEmoji[item.category] || "👕"} {item.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <span className="text-muted-foreground">Màu sắc</span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {item.color ? (
                        <span className="font-medium flex items-center gap-1.5 capitalize">
                          <span className="w-2.5 h-2.5 rounded-full border border-border/60 shadow-sm" style={{ backgroundColor: item.color }} />
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between border-b border-border/40 pb-3">
                    <span className="text-muted-foreground pt-1">Mùa</span>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {item.season ? (
                        <span className="px-2.5 py-1 rounded-full bg-secondary/60 text-[11px] font-medium text-foreground/80 capitalize">
                          {item.season}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between border-b border-border/40 pb-3">
                    <span className="text-muted-foreground pt-1">Thẻ phong cách</span>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {item.tags && item.tags.length > 0 ? (
                        item.tags.map((t) => (
                          <span key={t} className="px-2.5 py-1 rounded-full bg-secondary/60 text-[11px] font-medium text-foreground/80 capitalize">
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-3">
                    <span className="text-muted-foreground">Ngày thêm</span>
                    <span className="font-medium">
                      {item.dateAdded ? new Date(item.dateAdded).toLocaleDateString("vi-VN") : "-"}
                    </span>
                  </div>

                  {/* Quick match suggestions */}
                  <div className="flex flex-col gap-3 pt-4 border-t border-border/40">
                    <span className="font-heading text-xs font-semibold text-foreground uppercase tracking-wider">
                      Gợi ý phối nhanh
                    </span>
                    <div className="space-y-2">
                      {quickMatchSuggestions.map((suggestion, idx) => (
                        <div key={idx} className="bg-[#FAF7F2] border border-[#EBE1D1]/60 rounded-xl p-3 flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">{suggestion}</span>
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] text-[#995941] hover:text-[#CA5B43] px-2.5 font-medium rounded-full bg-[#FAF7F2] hover:bg-[#F5EBE0] border border-[#EBE1D1]/60 shadow-sm transition-all">
                            Thử phối
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-border/40 bg-background shrink-0">
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-10 font-medium rounded-xl gap-2 text-foreground/80 hover:text-foreground hover:bg-secondary"
                onClick={() => onEdit(item)}
              >
                <Edit2 className="w-4 h-4" />
                Sửa
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-10 font-medium rounded-xl gap-2 bg-[#A33B3B] hover:bg-[#8F2F2F]"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
              >
                <Trash2 className="w-12 h-12 text-[#A33B3B] mb-4 opacity-80" />
                <p className="font-heading text-xl font-medium text-foreground mb-2">
                  Xóa món đồ?
                </p>
                <p className="text-sm text-muted-foreground font-body mb-8 px-4">
                  Hành động này không thể hoàn tác. Món đồ này sẽ bị xóa vĩnh viễn khỏi tủ đồ của bạn.
                </p>
                <div className="flex gap-3 w-full max-w-[240px]">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded-xl h-10 font-medium"
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="flex-1 rounded-xl h-10 font-medium bg-[#A33B3B] hover:bg-[#8F2F2F]"
                  >
                    Xóa
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
