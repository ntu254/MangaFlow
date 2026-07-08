import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame, Heart, Sparkles, Star, TrendingUp, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Outfit } from "../types";

interface HotOutfit {
  id: number;
  title: string;
  image: string;
  tags: string[];
  badge: string;
  badgeIcon: React.ReactNode;
  platform: string;
  platformColor: string;
  price: string;
  description: string;
}

function outfitsToHot(outfits: Outfit[]): HotOutfit[] {
  if (!outfits || outfits.length === 0) return [];
  const badges = [
    { label: "Hot", icon: <Flame className="w-3 h-3" /> },
    { label: "Trending", icon: <TrendingUp className="w-3 h-3" /> },
    { label: "Phù hợp", icon: <Star className="w-3 h-3" /> },
  ];
  return outfits.map((o, i) => {
    const b = badges[i % badges.length];
    const platform = o.products?.[0]?.platform || "Shopee";
    return {
      id: typeof o.id === "number" ? o.id : i,
      title: o.title,
      image: o.image,
      tags: o.styleTags || [o.style],
      badge: b.label,
      badgeIcon: b.icon,
      platform,
      platformColor: platform === "Shopee" ? "bg-shopee" : "bg-tiktok",
      price: o.totalPrice,
      description: o.aiComment || `${o.styleTags?.join(", ") || o.style}`,
    };
  });
}

const HOT_OUTFITS: HotOutfit[] = [
  {
    id: 1,
    title: "Thanh lịch công sở",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80",
    tags: ["Thanh lịch", "Tối giản", "Công sở"],
    badge: "Hot",
    badgeIcon: <Flame className="w-3 h-3" />,
    platform: "Shopee",
    platformColor: "bg-shopee",
    price: "1.290.000đ",
    description: "Set thanh lịch cho nàng công sở hiện đại",
  },
  {
    id: 2,
    title: "Năng động đi học",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
    tags: ["Năng động", "Trẻ trung", "Đi học"],
    badge: "Best seller",
    badgeIcon: <Star className="w-3 h-3" />,
    platform: "Shopee",
    platformColor: "bg-shopee",
    price: "890.000đ",
    description: "Phong cách trẻ trung, năng động cho nữ sinh",
  },
  {
    id: 3,
    title: "Dạo phố pastel",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
    tags: ["Nữ tính", "Ngọt ngào", "Dạo phố"],
    badge: "96% phù hợp",
    badgeIcon: <TrendingUp className="w-3 h-3" />,
    platform: "TikTok Shop",
    platformColor: "bg-tiktok",
    price: "1.050.000đ",
    description: "Set pastel nữ tính, nhẹ nhàng dạo phố",
  },
  {
    id: 4,
    title: "Hẹn hò nữ tính",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
    tags: ["Nữ tính", "Romantic", "Hẹn hò"],
    badge: "Hot",
    badgeIcon: <Flame className="w-3 h-3" />,
    platform: "Shopee",
    platformColor: "bg-shopee",
    price: "780.000đ",
    description: "Phong cách lãng mạn cho buổi hẹn hò",
  },
  {
    id: 5,
    title: "Café cuối tuần",
    image: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&q=80",
    tags: ["Casual", "Thoải mái", "Basic"],
    badge: "New",
    badgeIcon: <Zap className="w-3 h-3" />,
    platform: "TikTok Shop",
    platformColor: "bg-tiktok",
    price: "650.000đ",
    description: "Set casual thoải mái cho cuối tuần",
  },
  {
    id: 6,
    title: "Sang trọng tối nay",
    image: "https://images.unsplash.com/photo-1518622358385-8ea7d657d6c0?w=600&q=80",
    tags: ["Dạ tiệc", "Sang trọng", "Tối giản"],
    badge: "Premium",
    badgeIcon: <Sparkles className="w-3 h-3" />,
    platform: "Shopee",
    platformColor: "bg-shopee",
    price: "1.800.000đ",
    description: "Set dạ tiệc sang trọng, nổi bật",
  },
];

const FILTER_CHIPS = ["Hot trend", "Nữ tính", "Dưới 3 triệu", "Shopee", "TikTok Shop"];

const AUTO_SLIDE_MS = 5000;

interface HotOutfitCarouselProps {
  outfits?: Outfit[];
}

export default function HotOutfitCarousel({ outfits: realOutfits }: HotOutfitCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hotOutfits = realOutfits && realOutfits.length > 0 ? outfitsToHot(realOutfits) : HOT_OUTFITS;

  const filtered = hotOutfits.filter((o) => {
    if (activeFilter.length === 0) return true;
    if (activeFilter.includes("Dưới 3 triệu")) {
      const priceNum = Number(o.price.replace(/[^0-9]/g, ""));
      if (priceNum > 3000000) return false;
    }
    if (activeFilter.includes("Shopee") && o.platform !== "Shopee") return false;
    if (activeFilter.includes("TikTok Shop") && o.platform !== "TikTok Shop") return false;
    if (activeFilter.includes("Hot trend") && o.badge !== "Hot") return false;
    if (activeFilter.includes("Nữ tính") && !o.tags.some((t) => t.toLowerCase().includes("nữ"))) return false;
    return true;
  });

  const displayOutfits = filtered.length > 0 ? filtered : hotOutfits;
  const total = displayOutfits.length;

  useEffect(() => {
    if (activeIndex >= total) {
      setActiveIndex(0);
    }
  }, [total, activeIndex]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isAutoPlay && !isPaused && total > 0) {
      timerRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % total);
      }, AUTO_SLIDE_MS);
    }
  }, [isAutoPlay, isPaused, total]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const goTo = (idx: number) => {
    setActiveIndex(idx);
    resetTimer();
  };

  const goPrev = () => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
    resetTimer();
  };

  const goNext = () => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev + 1) % total);
    resetTimer();
  };

  const toggleLike = (id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getVisibleIndices = () => {
    const indices: { idx: number; offset: number }[] = [];
    if (total === 0) return [];
    // We only need 3 cards (-1, 0, 1) to perfectly center the active card (0) symmetrically
    for (let offset = -1; offset <= 1; offset++) {
      const idx = (activeIndex + offset + total) % total;
      indices.push({ idx, offset });
    }
    return indices;
  };

  return (
    <div
      className="space-y-8 py-4 select-none relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header - Centered & Premium Editorial Style */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-2">
        <div className="flex items-center gap-2">
          <div className="editorial-divider" />
          <span className="editorial-label text-accent flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-accent/10" /> Gợi ý nổi bật
          </span>
          <div className="editorial-divider" />
        </div>
        <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground tracking-tight max-w-xl leading-tight">
          {realOutfits && realOutfits.length > 0
            ? `Khám phá ${realOutfits.length} set hot hôm nay`
            : "Khám phá các set đồ hot hôm nay"}
        </h2>
        <p className="text-xs md:text-sm font-body text-muted-foreground max-w-md">
          Chưa biết mặc gì? Xem ngay những công thức phối đồ thịnh hành nhất được gợi ý riêng cho bạn.
        </p>
      </div>

      {/* Filter Chips - Centered */}
      <div className="flex flex-wrap justify-center gap-2 overflow-x-auto scrollbar-hide pb-1 z-10 relative">
        {FILTER_CHIPS.map((chip) => {
          const isSelected = activeFilter.includes(chip);
          return (
            <button
              key={chip}
              onClick={() => {
                setActiveFilter(isSelected ? activeFilter.filter((c) => c !== chip) : [...activeFilter, chip]);
              }}
              className={`text-xs font-body px-4 py-2 rounded-full border whitespace-nowrap transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98] ${
                isSelected
                  ? "bg-foreground text-background border-foreground font-semibold shadow-md shadow-foreground/5"
                  : "border-border/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground bg-background/40 backdrop-blur-sm"
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Carousel Container */}
      <div className="relative overflow-visible py-4">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.25)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.25)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] pointer-events-none" />

        {/* Soft Ambient Light Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] h-[300px] bg-accent/8 rounded-full blur-[100px] animate-float" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[350px] h-[350px] bg-teal/6 rounded-full blur-[120px] animate-float" style={{ animationDelay: "1.5s" }} />
        </div>

        {/* Arrow Left */}
        <button
          onClick={goPrev}
          className="absolute left-2 md:-translate-x-4 lg:-translate-x-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-background/80 backdrop-blur-md border border-border/60 shadow-md flex items-center justify-center text-foreground/70 hover:text-foreground hover:scale-105 active:scale-95 hover:shadow-lg transition-all cursor-pointer hidden md:flex"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Cards */}
        <div className="overflow-hidden px-2 py-4 relative z-10">
          <div className="flex items-center justify-center gap-6 transition-transform duration-500 ease-out">
            {getVisibleIndices().map(({ idx, offset }) => {
              const outfit = displayOutfits[idx];
              if (!outfit) return null;

              const isActive = offset === 0;
              const isLeft = offset === -1;
              const isRight = offset === 1;

              return (
                <motion.div
                  key={`${outfit.id}-${offset}`}
                  initial={false}
                  animate={{
                    scale: isActive ? 1.05 : 0.9,
                    opacity: isActive ? 1 : 0.65,
                    filter: isActive ? "grayscale(0%)" : "grayscale(15%)",
                    x: 0,
                  }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={`relative shrink-0 transition-all duration-500 ${
                    isActive
                      ? "w-[280px] sm:w-[300px] md:w-[330px] z-10"
                      : "hidden md:block w-[250px] z-0"
                  }`}
                >
                  {/* Glowing active backdrop (rendered outside overflow-hidden) */}
                  {isActive && (
                    <div 
                      className="absolute -inset-4 bg-gradient-to-tr from-accent/25 via-coral/5 to-teal/15 rounded-[28px] blur-2xl opacity-75 z-[-1] animate-pulse pointer-events-none" 
                      style={{ animationDuration: "3000ms" }}
                    />
                  )}

                  <div
                    className={`rounded-2xl overflow-hidden border transition-all duration-500 ${
                      isActive
                        ? "border-accent/25 shadow-xl shadow-foreground/5 bg-card"
                        : "border-border/40 shadow-sm bg-card/75 backdrop-blur-sm"
                    }`}
                  >
                    {/* Image */}
                    <div className={`relative overflow-hidden ${isActive ? "aspect-[4/5]" : "aspect-[3/4]"}`}>
                      <img
                        src={outfit.image}
                        alt={outfit.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1 bg-foreground/85 text-background px-2.5 py-1 rounded-full text-xs font-body font-semibold backdrop-blur-sm shadow-sm">
                        {outfit.badgeIcon}
                        {outfit.badge}
                      </div>
                      {/* Like */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(outfit.id); }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/85 backdrop-blur-sm flex items-center justify-center border border-border/30 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-sm text-foreground"
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            likedIds.has(outfit.id) ? "fill-red-500 text-red-500" : "text-foreground/50"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Content */}
                    <div className={`p-5 ${isActive ? "space-y-4" : "space-y-2.5"}`}>
                      <h3 className={`font-heading font-extrabold text-foreground ${isActive ? "text-base" : "text-sm"}`}>
                        {outfit.title}
                      </h3>

                      {isActive && (
                        <p className="text-xs font-body text-muted-foreground leading-relaxed">{outfit.description}</p>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {outfit.tags.slice(0, isActive ? 3 : 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-body font-semibold px-2.5 py-1 rounded-full bg-secondary/80 text-muted-foreground border border-border/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Price + Platform */}
                      <div className="flex items-center justify-between pt-1">
                        <span className={`font-body font-extrabold text-foreground ${isActive ? "text-sm" : "text-xs"}`}>
                          {outfit.price}
                        </span>
                        <span className={`text-[10px] font-body font-bold px-2.5 py-1 rounded-full border ${
                          outfit.platform === "Shopee" 
                            ? "bg-shopee/10 border-shopee/20 text-shopee" 
                            : "bg-tiktok/10 border-tiktok/20 text-tiktok"
                        }`}>
                          {outfit.platform}
                        </span>
                      </div>

                      {/* CTA */}
                      {isActive && (
                        <button className="w-full h-10 rounded-full bg-foreground text-background text-xs font-body font-semibold flex items-center justify-center gap-1.5 hover:bg-foreground/90 transition-colors cursor-pointer shadow-sm">
                          Xem chi tiết set <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Arrow Right */}
        <button
          onClick={goNext}
          className="absolute right-2 md:translate-x-4 lg:translate-x-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-background/80 backdrop-blur-md border border-border/60 shadow-md flex items-center justify-center text-foreground/70 hover:text-foreground hover:scale-105 active:scale-95 hover:shadow-lg transition-all cursor-pointer hidden md:flex"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Controls - Only Dots */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <div className="flex items-center gap-1.5">
          {displayOutfits.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all cursor-pointer ${
                i === activeIndex 
                  ? "bg-foreground w-4 h-2" 
                  : "bg-foreground/20 w-2 h-2 hover:bg-foreground/40"
              }`}
              title={`Trang ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
