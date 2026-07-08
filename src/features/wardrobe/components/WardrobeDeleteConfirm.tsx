import type { WardrobeItem } from "@/features/wardrobe/types";
import { Button } from "@/shared/ui";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface WardrobeDeleteConfirmProps {
  item: WardrobeItem | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: number) => void;
}

export function WardrobeDeleteConfirm({ item, open, onClose, onConfirm }: WardrobeDeleteConfirmProps) {
  if (!open || !item) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm bg-card rounded-2xl border border-border shadow-xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-semibold text-foreground">Xóa món đồ</h3>
              <p className="text-xs font-body text-muted-foreground mt-1 max-w-[260px]">
                Bạn có chắc muốn xóa <span className="font-medium text-foreground">{item.name}</span> khỏi tủ đồ? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="w-3 h-3" />
              Outfit liên quan đến item này cũng sẽ bị ảnh hưởng
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" className="flex-1 rounded-xl text-xs h-9" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="destructive" className="flex-1 rounded-xl gap-1.5 text-xs h-9" onClick={() => { onConfirm(item.id); onClose(); }}>
              <Trash2 className="w-3.5 h-3.5" /> Xóa
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
