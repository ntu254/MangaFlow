import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { useState } from "react";

const WardrobeUploadArea = () => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => setIsDragging(false)}
      className={`border border-dashed rounded-xl px-6 py-5 flex items-center gap-4 transition-all duration-300 ${
        isDragging
          ? "border-accent bg-accent/5 scale-[1.005]"
          : "border-border hover:border-muted-foreground/30"
      }`}
    >
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        <Upload className="w-4 h-4 text-muted-foreground/40" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-xs font-body font-medium text-foreground">
          Drag clothing images here to add them to your wardrobe
        </p>
        <p className="text-[10px] text-muted-foreground/60 font-body mt-0.5">PNG, JPG up to 10MB</p>
      </div>
    </motion.div>
  );
};

export default WardrobeUploadArea;
