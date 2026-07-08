import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ImagePlus,
  Loader2,
  Pencil,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { wardrobeService } from "../services/wardrobe.service";

interface WardrobeUploadModalProps {
  open: boolean;
  onClose: () => void;
}

type UploadStep = "upload" | "analyzing" | "review" | "saved";

const categories = ["Tops", "Bottoms", "Shoes", "Outerwear", "Accessories"];
const types: Record<string, string[]> = {
  Tops: ["Áo thun", "Hoodie", "Blazer", "Sơ mi", "Áo ba lỗ"],
  Bottoms: ["Jeans", "Quần âu", "Váy", "Shorts", "Đầm"],
  Shoes: ["Sneaker", "Sandal", "Boots", "Giày cao gót", "Loafer"],
  Outerwear: ["Áo khoác", "Coat", "Cardigan", "Vest"],
  Accessories: ["Túi xách", "Mũ", "Kính mát", "Khăn", "Trang sức"],
};
const styleTags = [
  "Casual",
  "Minimal",
  "Streetwear",
  "Công sở",
  "Dạ tiệc",
  "Thể thao",
];
const colorOptions = [
  { label: "Trắng", hex: "#FFFFFF" },
  { label: "Đen", hex: "#1A1A1A" },
  { label: "Xanh", hex: "#1C3A5F" },
  { label: "Be", hex: "#D2B48C" },
  { label: "Xám", hex: "#808080" },
  { label: "Hồng", hex: "#F4A0A0" },
];

const WardrobeUploadModal = ({ open, onClose }: WardrobeUploadModalProps) => {
  const [step, setStep] = useState<UploadStep>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [detectedName, setDetectedName] = useState("New Item");
  const [detectedCategory, setDetectedCategory] = useState("Tops");
  const [detectedType, setDetectedType] = useState("Áo");
  const [detectedColor, setDetectedColor] = useState("Khác");
  const [detectedTags, setDetectedTags] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const reset = useCallback(() => {
    setStep("upload");
    setPreview(null);
    setFile(null);
    setIsSaving(false);
    setIsEditing(false);
    setDetectedName("New Item");
    setDetectedCategory("Tops");
    setDetectedType("Áo");
    setDetectedColor("Khác");
    setDetectedTags([]);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setStep("analyzing");
      setTimeout(() => setStep("review"), 2000);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      if (file) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        await wardrobeService.addItem({
          name: detectedName,
          imageBase64: base64,
          mimeType: file.type,
          category: detectedCategory,
          type: detectedType,
          color: detectedColor,
          tags: detectedTags,
        });
      }
      setStep("saved");
    } catch (err) {
      console.error("Failed to save item:", err);
      setStep("saved");
    } finally {
      setIsSaving(false);
      setTimeout(() => handleClose(), 1800);
    }
  };
  const toggleTag = (tag: string) => {
    setDetectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-card rounded-xl shadow-sm overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-foreground/60" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-body font-semibold text-foreground">
                  {step === "upload" && "Thêm món đồ"}
                  {step === "analyzing" && "Đang phân tích..."}
                  {step === "review" && "AI đã nhận diện"}
                  {step === "saved" && "Đã lưu!"}
                </p>
                <p className="text-[10px] text-muted-foreground font-body">
                  {step === "upload" &&
                    "Tải ảnh lên và AI sẽ nhận diện tự động"}
                  {step === "analyzing" && "AI đang phân tích món đồ của bạn"}
                  {step === "review" && "Xem lại và xác nhận thông tin"}
                  {step === "saved" && "Đã thêm vào tủ đồ"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === "upload" && (
              <div className="space-y-4">
                <div
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-10 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200",
                    isDragging
                      ? "border-accent bg-accent/5"
                      : "border-border hover:bg-secondary/30",
                  )}
                >
                  <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center">
                    <Upload
                      className="w-6 h-6 text-muted-foreground/30"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-body font-medium text-foreground">
                      Kéo thả ảnh quần áo vào đây
                    </p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      hoặc nhấn để chọn · PNG, JPG tối đa 10MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors w-full"
                >
                  <ImagePlus
                    className="w-4 h-4 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                  <span className="text-[10px] font-body text-muted-foreground">
                    Tải ảnh
                  </span>
                </button>
              </div>
            )}

            {step === "analyzing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-10 gap-4"
              >
                <div className="relative">
                  {preview && (
                    <img
                      src={preview}
                      alt="Đã tải"
                      className="w-28 h-28 rounded-lg object-cover border border-border"
                    />
                  )}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear",
                    }}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <Sparkles className="w-4 h-4 text-foreground/60" />
                  </motion.div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-body font-medium text-foreground">
                    Đang phân tích món đồ...
                  </p>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    Nhận diện loại, màu sắc và phong cách
                  </p>
                </div>
                <Loader2 className="w-5 h-5 text-foreground/40 animate-spin" />
              </motion.div>
            )}

            {step === "review" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="flex gap-4">
                  {preview && (
                    <img
                      src={preview}
                      alt="Quần áo"
                      className="w-24 h-28 rounded-xl object-cover border border-border shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {isEditing ? (
                      <input
                        value={detectedName}
                        onChange={(e) => setDetectedName(e.target.value)}
                        className="w-full text-sm font-body font-medium text-foreground bg-secondary/50 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    ) : (
                      <p className="text-sm font-body font-semibold text-foreground">
                        {detectedName}
                      </p>
                    )}

                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <select
                            value={detectedCategory}
                            onChange={(e) =>
                              setDetectedCategory(e.target.value)
                            }
                            className="text-[11px] font-body bg-secondary rounded-md px-2 py-1 text-foreground focus:outline-none"
                          >
                            {categories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <select
                            value={detectedType}
                            onChange={(e) => setDetectedType(e.target.value)}
                            className="text-[11px] font-body bg-secondary rounded-md px-2 py-1 text-foreground focus:outline-none"
                          >
                            {(types[detectedCategory] || []).map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-body bg-secondary text-muted-foreground px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {detectedCategory}
                          </span>
                          <span className="text-[10px] font-body text-muted-foreground">
                            {detectedType}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">
                        Màu:
                      </span>
                      {isEditing ? (
                        <div className="flex gap-1">
                          {colorOptions.map((c) => (
                            <button
                              key={c.hex}
                              onClick={() => setDetectedColor(c.hex)}
                              className={cn(
                                "w-5 h-5 rounded-full transition-all",
                                detectedColor === c.hex
                                  ? "ring-2 ring-foreground/30"
                                  : "ring-1 ring-border/30",
                              )}
                              style={{ backgroundColor: c.hex }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      ) : (
                        <span
                          className="w-4 h-4 rounded-full border border-border"
                          style={{ backgroundColor: detectedColor }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-2">
                    Phong cách AI gợi ý
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {styleTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => isEditing && toggleTag(tag)}
                        className={cn(
                          "text-[10px] px-2.5 py-1 rounded-md font-body font-medium transition-all",
                          detectedTags.includes(tag)
                            ? "bg-foreground/10 text-foreground"
                            : "bg-secondary text-muted-foreground",
                          isEditing && "cursor-pointer hover:opacity-80",
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-md gap-1.5 text-xs h-9"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Pencil className="w-3 h-3" />{" "}
                    {isEditing ? "Xong" : "Chỉnh sửa"}
                  </Button>
                  <Button
                    variant="accent"
                    size="sm"
                    className="flex-1 rounded-md gap-1.5 text-xs h-9"
                    onClick={handleConfirm}
                  >
                    <Check className="w-3.5 h-3.5" /> Xác nhận
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "saved" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-10 gap-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, delay: 0.1 }}
                  className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center"
                >
                  <Check className="w-6 h-6 text-foreground/60" strokeWidth={2} />
                </motion.div>
                <p className="text-sm font-body font-semibold text-foreground">
                  Đã thêm vào tủ đồ!
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  AI sẵn sàng tạo outfit với món đồ này.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WardrobeUploadModal;
