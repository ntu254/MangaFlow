import { Button } from "@/shared/ui";
import { motion } from "framer-motion";
import { Plus, Shirt } from "lucide-react";

const WardrobeEmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 px-6"
  >
    <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6">
      <Shirt className="w-10 h-10 text-muted-foreground/20" strokeWidth={1} />
    </div>
    <h3 className="font-heading text-2xl text-foreground mb-2 italic">
      Tủ đồ đang trống
    </h3>
    <p className="text-sm text-muted-foreground font-body text-center max-w-sm mb-6">
      Bắt đầu xây dựng tủ đồ số của bạn. Thêm quần áo và để AI tạo outfit hoàn
      hảo cho bạn.
    </p>
    <Button variant="accent" className="gap-2 rounded-xl">
      <Plus className="w-4 h-4" /> Thêm món đồ đầu tiên
    </Button>
  </motion.div>
);

export default WardrobeEmptyState;
