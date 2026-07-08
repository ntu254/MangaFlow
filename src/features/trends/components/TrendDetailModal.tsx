import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Button,
  Badge,
} from "@/shared/ui";
import {
  ArrowRight,
  ExternalLink,
  Heart,
  Share2,
  ShoppingCart,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useState } from "react";

interface TrendDetailItem {
  title: string;
  image: string;
  tag: string;
  hot: boolean;
  desc: string;
  aiInsight?: string;
}

interface TrendDetailModalProps {
  item: TrendDetailItem | null;
  open: boolean;
  onClose: () => void;
}

const products = [
  { name: "Áo blazer linen", price: "890.000₫", platform: "Shopee" },
  { name: "Quần ống rộng", price: "450.000₫", platform: "Shopee" },
  { name: "Túi tote cói", price: "320.000₫", platform: "Shopee" },
];

const TrendDetailModal = ({ item, open, onClose }: TrendDetailModalProps) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-background border-border">
        <DialogDescription className="srOnly">{item.title} — trend details</DialogDescription>
        <div className="relative aspect-[16/9] overflow-hidden">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          <div className="absolute top-4 left-4 flex gap-1.5">
            <span className="bg-background/90 text-foreground text-[9px] font-body font-medium px-3 py-1 uppercase tracking-wider">{item.tag}</span>
            {item.hot && (
              <span className="bg-accent text-accent-foreground text-[9px] font-body font-semibold px-3 py-1 uppercase tracking-wider">Hot</span>
            )}
          </div>
          <button
            onClick={() => setLiked(!liked)}
            className="absolute top-4 right-4 w-8 h-8 bg-background/60 backdrop-blur-sm flex items-center justify-center hover:bg-background/90 transition-colors"
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? "fill-accent text-accent" : "text-foreground/70"}`} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <DialogTitle className="font-heading text-2xl md:text-3xl italic text-background">{item.title}</DialogTitle>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm font-body text-foreground leading-relaxed">{item.desc}</p>

          {item.aiInsight && (
            <div className="border border-border bg-muted/50 p-4 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] font-body font-semibold uppercase tracking-[0.2em] text-accent">Phân tích AI</span>
                <p className="text-xs font-body text-muted-foreground mt-0.5">{item.aiInsight}</p>
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-body font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">Sản phẩm gợi ý</p>
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.name} className="flex items-center justify-between border border-border p-3">
                  <div>
                    <p className="text-sm font-body text-foreground">{p.name}</p>
                    <span className="text-[10px] font-body text-muted-foreground">{p.platform}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-body font-medium text-foreground">{p.price}</span>
                    <button className="text-[10px] font-body font-medium uppercase tracking-wider text-accent flex items-center gap-1 hover:gap-2 transition-all">
                      Mua <ShoppingCart className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <Button
              variant="accent"
              size="sm"
              className="gap-1.5 text-[10px]"
              onClick={() => navigate("/recommender")}
            >
              <Wand2 className="w-3 h-3" /> Tạo outfit từ xu hướng
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-[10px]"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
              }}
            >
              <Share2 className="w-3 h-3" /> Chia sẻ
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-[10px] ml-auto"
              onClick={() => navigate("/style-profile")}
            >
              <Sparkles className="w-3 h-3" /> Xem style profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrendDetailModal;
