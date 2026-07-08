import type { Outfit } from "@/features/recommender/types";
import { motion } from "framer-motion";
import { ExternalLink, Info, Star } from "lucide-react";
import { supabase } from "@/shared/lib";

interface OutfitCardProps {
  outfit: Outfit;
  index: number;
  onSave?: (id: number) => void;
  onLike?: (id: number, liked: boolean | null) => void;
  onHide?: (id: number) => void;
  onReport?: (id: number) => void;
  onAction?: (id: number, action: any) => void;
  onShare?: (outfit: Outfit) => void;
}

function getProductCategoryLabel(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("đầm") || n.includes("váy") || n.includes("dress") || n.includes("sườn xám")) return "Đầm";
  if (n.includes("giày") || n.includes("sandal") || n.includes("boot") || n.includes("dép") || n.includes("sneaker")) return "Giày";
  if (n.includes("túi") || n.includes("clutch") || n.includes("bag") || n.includes("ví")) return "Túi";
  if (n.includes("áo") || n.includes("shirt") || n.includes("tee") || n.includes("blazer") || n.includes("sweater") || n.includes("hoodie")) return "Áo";
  if (n.includes("quần") || n.includes("jean") || n.includes("pants") || n.includes("skirt")) return "Quần";
  if (n.includes("khuyên tai") || n.includes("bông tai") || n.includes("nhẫn") || n.includes("vòng cổ") || n.includes("dây truyền") || n.includes("dây chuyền") || n.includes("kính") || n.includes("mắt kính") || n.includes("thắt lưng") || n.includes("earring") || n.includes("necklace") || n.includes("belt")) return "Phụ kiện";
  return "Sản phẩm khác";
}

const OutfitCard = ({ outfit, index }: OutfitCardProps) => {
  if (outfit.userHidden) return null;

  const trackAffiliateClick = async (productId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      await supabase.functions.invoke("track-click", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: {
          product_id: productId || null,
          outfit_id: outfit.dbId || null,
          source: "affiliate",
          traffic_source: "direct",
        },
      });
    } catch {
      // silent — tracking is best-effort
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-sm space-y-6"
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
        <div>
          <h3 className="font-heading text-lg md:text-xl font-bold text-foreground">
            Set {index + 1} - {outfit.title}
          </h3>
          <p className="text-xs font-body text-muted-foreground mt-1 tracking-wide">
            {outfit.styleTags.join(" · ")}
          </p>
        </div>
        {outfit.matchScore && (
          <div className="shrink-0 self-start sm:self-center flex items-center bg-foreground/5 px-3 py-1.5 rounded-lg border border-border/60">
            <span className="text-xs font-body font-bold text-foreground/80">
              {outfit.matchScore}% phù hợp
            </span>
          </div>
        )}
      </div>

      {/* AI Comment */}
      <div className="bg-secondary/20 border border-border/30 rounded-xl p-4 space-y-3">
        <div>
          <p className="text-[10px] font-body font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">
            AI Note
          </p>
          <p className="text-xs md:text-sm font-body text-foreground/80 leading-relaxed">
            {outfit.aiComment}
          </p>
        </div>

        {/* Resolved Rules */}
        {outfit.resolvedRules && outfit.resolvedRules.length > 0 && (
          <div className="border-t border-border/20 pt-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                Quy tắc phối đồ áp dụng (Nguồn)
              </span>
            </div>
            <ul className="space-y-1">
              {outfit.resolvedRules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <span className="inline-block px-1 py-0.5 rounded text-[8px] bg-secondary border border-border/40 text-foreground shrink-0 uppercase tracking-wider font-semibold">
                    {rule.concept_id}
                  </span>
                  <span className="leading-relaxed">{rule.rule_text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="space-y-4">
        <h4 className="text-xs font-heading font-bold text-muted-foreground/60 uppercase tracking-wider border-b border-border/20 pb-1.5">
          Sản phẩm trong set
        </h4>
        {outfit.products.map((p, idx) => (
          <div key={idx} className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/80 block">
              {getProductCategoryLabel(p.name)}
            </span>
            <div className="flex items-center justify-between gap-4 p-3 bg-secondary/10 hover:bg-secondary/20 border border-border/40 rounded-xl transition-all">
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-border/30 bg-secondary/40">
                <img
                  src={p.image || "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80"}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-body font-medium text-foreground truncate">
                  {p.name}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1 flex-wrap">
                  <span className="font-semibold text-foreground/80">{p.platform}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {p.rating || 5.0}
                  </span>
                  <span>·</span>
                  <span className="font-bold text-foreground">{p.price}</span>
                </div>
              </div>
              <a
                href={p.affiliateUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!p.affiliateUrl) {
                    e.preventDefault();
                  } else {
                    void trackAffiliateClick(p.id);
                  }
                }}
                className="flex items-center gap-1 text-xs font-body font-semibold px-4.5 py-2 border border-border bg-background hover:bg-secondary text-foreground rounded-lg transition-all shrink-0 active:scale-95 shadow-sm"
              >
                Mở link <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/40">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
            Tổng set
          </span>
          <span className="text-lg md:text-xl font-heading font-bold text-foreground">
            {outfit.totalPrice}
          </span>
        </div>
        <button
          onClick={() => {
            void trackAffiliateClick();
            outfit.products.forEach((p) => {
              if (p.affiliateUrl) {
                window.open(p.affiliateUrl, "_blank");
              }
            });
          }}
          className="flex items-center justify-center gap-1.5 text-xs font-body font-semibold px-6 py-3 bg-foreground text-background hover:bg-foreground/90 rounded-xl transition-all shadow-md active:scale-95"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Mở tất cả link
        </button>
      </div>
    </motion.div>
  );
};

export default OutfitCard;
