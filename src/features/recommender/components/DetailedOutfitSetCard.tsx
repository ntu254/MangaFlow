import type { Outfit, Product } from "@/features/recommender/types";
import { motion } from "framer-motion";
import { BadgeCheck, ExternalLink, Heart, Info, Sparkles, Star, ZoomIn } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/shared/lib";

interface DetailedOutfitSetCardProps {
  outfit: Outfit;
  index: number;
}

function getCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("áo") || n.includes("shirt") || n.includes("tee") || n.includes("blazer") || n.includes("sweater") || n.includes("hoodie") || n.includes("crop")) return "ÁO";
  if (n.includes("quần") || n.includes("jean") || n.includes("pants") || n.includes("short")) return "QUẦN";
  if (n.includes("váy") || n.includes("đầm") || n.includes("dress") || n.includes("skirt")) return "CHÂN VÁY";
  if (n.includes("giày") || n.includes("sandal") || n.includes("boot") || n.includes("dép") || n.includes("sneaker")) return "GIÀY";
  if (n.includes("túi") || n.includes("clutch") || n.includes("bag") || n.includes("ví")) return "TÚI";
  return "PHỤ KIỆN";
}

function groupByCategory(products: Product[]): { category: string; items: Product[] }[] {
  const map = new Map<string, Product[]>();
  for (const p of products) {
    const cat = getCategory(p.name);
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(p);
  }
  const order = ["ÁO", "CHÂN VÁY", "QUẦN", "GIÀY", "TÚI", "PHỤ KIỆN"];
  return order.filter((c) => map.has(c)).map((c) => ({ category: c, items: map.get(c)! }));
}

const DetailedOutfitSetCard = ({ outfit, index }: DetailedOutfitSetCardProps) => {
  const [liked, setLiked] = useState(false);
  const [selectedThumb, setSelectedThumb] = useState(0);

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

  const grouped = groupByCategory(outfit.products);
  const mainImage = outfit.products[selectedThumb]?.image || outfit.image;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 pb-4 border-b border-border/30">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-lg md:text-xl font-bold text-foreground">
              Set {index + 1} - {outfit.title}
            </h3>
            {outfit.matchScore && (
              <span className="text-[10px] font-body font-bold text-teal bg-teal/10 px-2 py-0.5 rounded-full">
                {outfit.matchScore}% phù hợp
              </span>
            )}
          </div>
          <p className="text-xs font-body text-muted-foreground mt-1">
            {outfit.styleTags.join(" · ")}
          </p>
        </div>
        <button
          onClick={() => setLiked(!liked)}
          className="w-9 h-9 rounded-full border border-border/60 flex items-center justify-center hover:bg-secondary/50 transition-colors cursor-pointer shrink-0"
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        </button>
      </div>

      {/* Body: 2-column — 42% preview / 58% products */}
      <div className="flex flex-col lg:flex-row">
        {/* Left: Preview */}
        <div className="lg:w-[42%] p-5 space-y-3">
          {/* Main image */}
          <div className="aspect-[4/5] rounded-xl overflow-hidden bg-secondary/30 border border-border/30 relative group">
            <img
              src={mainImage}
              alt={outfit.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 flex items-center justify-center transition-colors">
              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
            </div>
          </div>
          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {outfit.products.map((p, i) => (
              <button
                key={i}
                onClick={() => setSelectedThumb(i)}
                className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  selectedThumb === i ? "border-foreground shadow-sm" : "border-border/30 opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={p.image || "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&q=60"}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Products */}
        <div className="lg:w-[58%] p-5 lg:border-l border-t lg:border-t-0 border-border/30 space-y-4 overflow-y-auto max-h-[520px]">
          <h4 className="text-xs font-body font-bold text-muted-foreground/60 uppercase tracking-wider">
            Sản phẩm trong set
          </h4>

          {grouped.map((group) => (
            <div key={group.category} className="space-y-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-body font-bold text-foreground/50 uppercase tracking-widest">
                  {group.category}
                </span>
                <span className="text-[9px] font-body text-muted-foreground/50">({group.items.length})</span>
              </div>
              {group.items.map((p, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/30 transition-colors group">
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border/30 bg-secondary/40">
                    <img
                      src={p.image || "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&q=60"}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body font-medium text-foreground truncate">{p.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                      <span className={`font-semibold ${p.platform === "Shopee" ? "text-shopee" : "text-tiktok"}`}>{p.platform}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> {p.rating || 5.0}
                      </span>
                      <span>·</span>
                      <span className="font-bold text-foreground">{p.price}</span>
                    </div>
                    {p.badge && (
                      <span className="inline-block mt-0.5 text-[9px] font-body px-1.5 py-0.5 rounded bg-teal/10 text-teal font-semibold">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <a
                    href={p.affiliateUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!p.affiliateUrl) { e.preventDefault(); return; }
                      void trackAffiliateClick(p.id);
                    }}
                    className="text-[10px] font-body font-semibold px-3 py-1.5 border border-border rounded-lg hover:bg-foreground hover:text-background text-foreground transition-all shrink-0"
                  >
                    Mở link
                  </a>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* AI Note */}
      {outfit.aiComment && (
        <div className="mx-5 mb-5 bg-secondary/20 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] font-body font-bold text-muted-foreground/60 uppercase tracking-wider">
              AI Note
            </span>
          </div>
          <p className="text-xs md:text-sm font-body text-foreground/80 leading-relaxed mb-3">
            {outfit.aiComment}
          </p>

          {/* Personalization */}
          {outfit.personalization && outfit.personalization.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-border/20 pt-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vì sao phù hợp với bạn?</span>
              <ul className="space-y-1.5">
                {outfit.personalization.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs md:text-sm text-foreground/70">
                    <BadgeCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Confidence Tags */}
          {outfit.aiConfidence && outfit.aiConfidence.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {outfit.aiConfidence.map((conf, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border ${
                    conf.positive 
                      ? "bg-primary/5 text-primary border-primary/20"
                      : "bg-destructive/5 text-destructive border-destructive/20"
                  }`}
                >
                  {conf.label}
                </span>
              ))}
            </div>
          )}

          {/* Resolved Rules */}
          {outfit.resolvedRules && outfit.resolvedRules.length > 0 && (
            <div className="mt-3.5 space-y-2 border-t border-border/20 pt-3">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Quy tắc phối đồ áp dụng (Nguồn)
                </span>
              </div>
              <ul className="space-y-1.5">
                {outfit.resolvedRules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] bg-secondary border border-border/40 text-foreground shrink-0 uppercase tracking-wider font-semibold">
                      {rule.concept_id}
                    </span>
                    <span className="leading-relaxed">{rule.rule_text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 pt-4 border-t border-border/30">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Tổng set</span>
          <span className="text-lg md:text-xl font-heading font-bold text-foreground">{outfit.totalPrice}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              void trackAffiliateClick();
              outfit.products.forEach((p) => {
                if (p.affiliateUrl) window.open(p.affiliateUrl, "_blank");
              });
            }}
            className="flex items-center justify-center gap-1.5 text-xs font-body font-semibold px-5 py-2.5 bg-foreground text-background hover:bg-foreground/90 rounded-xl transition-all active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Mua ngay
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DetailedOutfitSetCard;
