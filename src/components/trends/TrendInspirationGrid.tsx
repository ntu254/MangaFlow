import kfashionImg from "@/assets/lookbook-kfashion.jpg";
import athleisureImg from "@/assets/style-athleisure-new.jpg";
import casualImg from "@/assets/style-casual-new.jpg";
import dateNightImg from "@/assets/style-datenight-new.jpg";
import minimalImg from "@/assets/style-minimal-new.jpg";
import officeImg from "@/assets/style-office-new.jpg";
import partyImg from "@/assets/style-party-new.jpg";
import streetImg from "@/assets/style-streetwear-new.jpg";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  Flame,
  Heart,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const categories = [
  "Tất cả",
  "Hè 2026",
  "Xu hướng màu",
  "Hot Items",
  "Mạng xã hội",
  "Lấy cảm hứng Runway",
];

interface Trend {
  title: string;
  image: string;
  tag: string;
  hot: boolean;
  desc: string;
  aiInsight?: string;
  size: "sm" | "md" | "lg";
}

const trends: Trend[] = [
  {
    title: "Vàng bơ",
    image: casualImg,
    tag: "Xu hướng màu",
    hot: true,
    desc: "Tông vàng bơ chiếm lĩnh các BST hè — linh hoạt từ casual đến công sở.",
    aiInsight: "Vàng bơ xuất hiện trong 38% BST hè 2026.",
    size: "lg",
  },
  {
    title: "Linen mọi thứ",
    image: officeImg,
    tag: "Hè 2026",
    hot: true,
    desc: "Linen trở lại mạnh mẽ, từ blazer đến quần ống rộng.",
    aiInsight: "Lượt tìm kiếm linen tăng 64% mùa này.",
    size: "md",
  },
  {
    title: "Maxi trở lại",
    image: partyImg,
    tag: "Hot Items",
    hot: false,
    desc: "Váy maxi trở lại với xếp ly và cut-out tinh tế cho dáng thanh lịch.",
    size: "sm",
  },
  {
    title: "Gorpcore nổi lên",
    image: streetImg,
    tag: "Mạng xã hội",
    hot: true,
    desc: "Outdoor gặp streetwear: áo gió, giày hiking, túi tiện ích.",
    aiInsight: "Yêu cầu phối gorpcore tăng 45% trên Redo.",
    size: "md",
  },
  {
    title: "Athleisure nâng cấp",
    image: athleisureImg,
    tag: "Hot Items",
    hot: false,
    desc: "Athleisure được tinh chỉnh — kết hợp blazer và phụ kiện cao cấp.",
    size: "sm",
  },
  {
    title: "Quiet Luxury",
    image: minimalImg,
    tag: "Hè 2026",
    hot: true,
    desc: "Chất liệu cao cấp, đường cắt hoàn hảo, không logo — xu hướng cho người sành điệu.",
    aiInsight: "Outfit quiet luxury có tỷ lệ lưu cao gấp 2.3 lần.",
    size: "lg",
  },
  {
    title: "Làn sóng K-Fashion",
    image: kfashionImg,
    tag: "Mạng xã hội",
    hot: true,
    desc: "Thẩm mỹ Hàn Quốc tiếp tục định hình xu hướng toàn cầu với silhouette layer oversized.",
    size: "md",
  },
  {
    title: "Dạ tiệc Glam",
    image: dateNightImg,
    tag: "Lấy cảm hứng Runway",
    hot: false,
    desc: "Phong cách buổi tối lãng mạn với lụa, satin và ánh lấp lánh tinh tế.",
    size: "sm",
  },
];

const getAspect = (size: string) => {
  switch (size) {
    case "lg":
      return "aspect-[3/4]";
    case "md":
      return "aspect-[4/5]";
    default:
      return "aspect-[3/4]";
  }
};

const TrendInspirationGrid = () => {
  const [activeFilter, setActiveFilter] = useState(0);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  const filtered =
    activeFilter === 0
      ? trends
      : trends.filter((t) => t.tag === categories[activeFilter]);

  const toggleSave = (i: number) =>
    setSaved((prev) => {
      const n = new Set(prev);
      if (n.has(i)) {
        n.delete(i);
      } else {
        n.add(i);
      }
      return n;
    });
  const toggleLike = (i: number) =>
    setLiked((prev) => {
      const n = new Set(prev);
      if (n.has(i)) {
        n.delete(i);
      } else {
        n.add(i);
      }
      return n;
    });

  return (
    <section className="py-14 md:py-20 border-t border-border">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="text-center mb-10">
          <p className="editorial-label mb-3">Cảm hứng tuyển chọn</p>
          <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground">
            Cảm hứng <span className="italic">xu hướng</span>
          </h2>
        </div>

        <div className="flex justify-center gap-2 mb-10 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((c, i) => (
            <button
              key={c}
              onClick={() => setActiveFilter(i)}
              className={`px-5 py-2 text-[10px] font-body font-medium tracking-[0.15em] uppercase whitespace-nowrap transition-all ${
                i === activeFilter
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="columns-1 md:columns-2 lg:columns-3 gap-4 md:gap-5 space-y-4 md:space-y-5"
          >
            {filtered.map((t, i) => {
              const gi = trends.indexOf(t);
              return (
                <motion.article
                  key={t.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="break-inside-avoid group cursor-pointer relative overflow-hidden bg-card"
                >
                  <div
                    className={`relative overflow-hidden ${getAspect(t.size)}`}
                  >
                    <img
                      src={t.image}
                      alt={t.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />

                    <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                      <span className="bg-background/90 backdrop-blur-sm text-foreground text-[9px] font-body font-medium px-3 py-1 uppercase tracking-wider">
                        {t.tag}
                      </span>
                      {t.hot && (
                        <span className="bg-accent text-accent-foreground text-[9px] font-body font-semibold px-3 py-1 flex items-center gap-1 uppercase tracking-wider">
                          <Flame className="w-2.5 h-2.5" /> Hot
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (saved.has(gi)) {
                          toggleSave(gi);
                        } else {
                          toggleSave(gi);
                        }
                      }}
                      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-background/60 backdrop-blur-sm hover:bg-background/90 transition-all"
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${saved.has(gi) ? "fill-foreground text-foreground" : "text-foreground/70"}`}
                      />
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                      <h3 className="font-heading text-xl md:text-2xl italic text-background leading-tight mb-1">
                        {t.title}
                      </h3>
                      <p className="text-[11px] font-body text-background/70 leading-relaxed line-clamp-2">
                        {t.desc}
                      </p>
                    </div>

                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors duration-300 flex items-center justify-center">
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/recommender");
                          }}
                          className="flex items-center gap-2 bg-background/95 backdrop-blur-sm text-foreground px-4 py-2.5 text-[9px] font-body font-medium uppercase tracking-[0.15em] hover:bg-background transition-colors"
                        >
                          <Wand2 className="w-3 h-3" /> Tạo outfit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (liked.has(gi)) {
                              toggleLike(gi);
                            } else {
                              toggleLike(gi);
                            }
                          }}
                          className="w-9 h-9 flex items-center justify-center bg-background/95 backdrop-blur-sm hover:bg-background transition-colors"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${liked.has(gi) ? "fill-accent text-accent" : "text-foreground"}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {t.aiInsight && (
                    <div className="px-5 py-3 border-t border-border bg-muted/50 flex items-start gap-2">
                      <Sparkles className="w-3 h-3 text-accent mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[9px] font-body font-semibold uppercase tracking-[0.2em] text-accent">
                          Phân tích AI
                        </span>
                        <p className="text-[11px] font-body text-muted-foreground leading-relaxed mt-0.5">
                          {t.aiInsight}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                    <button
                      onClick={() => navigate("/recommender")}
                      className="text-[10px] font-body font-medium uppercase tracking-wider text-accent flex items-center gap-1 group-hover:gap-2 transition-all"
                    >
                      Xem outfit <ArrowRight className="w-3 h-3" />
                    </button>
                    <span className="text-[9px] font-body text-muted-foreground uppercase tracking-wider">
                      {t.tag}
                    </span>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default TrendInspirationGrid;
