import type { WardrobeItem } from "@/features/wardrobe/types";
import { Button, Input, Label } from "@/shared/ui";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Shirt, X } from "lucide-react";
import { useState } from "react";

interface WardrobeEditModalProps {
  item: WardrobeItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (item: WardrobeItem) => void;
}

const categories = ["Tops", "Bottoms", "Shoes", "Outerwear", "Accessories"];
const styleTags = ["Casual", "Minimal", "Streetwear", "Office", "Party", "Sporty"];
const seasons = ["Xuân", "Hè", "Thu", "Đông", "Quanh năm"];

const colorOptions = [
  { label: "Trắng", hex: "#FFFFFF" },
  { label: "Đen", hex: "#1A1A1A" },
  { label: "Xanh dương", hex: "#1C3A5F" },
  { label: "Be", hex: "#D2B48C" },
  { label: "Xám", hex: "#808080" },
  { label: "Hồng", hex: "#F4A0A0" },
  { label: "Đỏ", hex: "#E74C3C" },
  { label: "Xanh lá", hex: "#27AE60" },
];

export function WardrobeEditModal({ item, open, onClose, onSave }: WardrobeEditModalProps) {
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState(item?.category || "Tops");
  const [color, setColor] = useState(item?.color || "#FFFFFF");
  const [tags, setTags] = useState<string[]>(item?.tags || []);
  const [season, setSeason] = useState(item?.season || "Quanh năm");

  if (!open || !item) return null;

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    onSave({
      ...item,
      name: name.trim() || item.name,
      category,
      color,
      tags,
      season,
    });
    onClose();
  };

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
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Shirt className="w-4 h-4 text-accent" />
              </div>
              <p className="text-sm font-body font-semibold text-foreground">Chỉnh sửa món đồ</p>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Image preview + name */}
            {item.image && (
              <div className="flex items-center gap-4">
                <img src={item.image} alt={item.name} className="w-16 h-20 rounded-xl object-cover border border-border" />
                <div className="flex-1 space-y-2">
                  <Label className="font-body text-xs text-muted-foreground">Tên món đồ</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="text-sm font-body" />
                </div>
              </div>
            )}

            {/* Category */}
            <div className="space-y-2">
              <Label className="font-body text-xs text-muted-foreground">Danh mục</Label>
              <div className="flex gap-1.5 flex-wrap">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`text-xs font-body px-3 py-1.5 rounded-lg transition-all ${
                      category === c
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label className="font-body text-xs text-muted-foreground">Màu sắc</Label>
              <div className="flex gap-1.5 flex-wrap">
                {colorOptions.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setColor(c.hex)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      color === c.hex ? "border-accent scale-110" : "border-border"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Style Tags */}
            <div className="space-y-2">
              <Label className="font-body text-xs text-muted-foreground">Phong cách</Label>
              <div className="flex gap-1.5 flex-wrap">
                {styleTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`text-xs font-body px-3 py-1.5 rounded-lg transition-all ${
                      tags.includes(tag)
                        ? "bg-accent/10 text-accent border border-accent/20"
                        : "bg-secondary text-muted-foreground border border-transparent hover:text-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Season */}
            <div className="space-y-2">
              <Label className="font-body text-xs text-muted-foreground">Mùa</Label>
              <div className="flex gap-1.5 flex-wrap">
                {seasons.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeason(s)}
                    className={`text-xs font-body px-3 py-1.5 rounded-lg transition-all ${
                      season === s
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 px-6 pb-6">
            <Button variant="outline" className="flex-1 rounded-xl text-xs h-9" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="accent" className="flex-1 rounded-xl gap-1.5 text-xs h-9" onClick={handleSave}>
              <Check className="w-3.5 h-3.5" /> Lưu thay đổi
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
