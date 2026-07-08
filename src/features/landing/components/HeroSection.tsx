import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import heroImg from "@/assets/hero-main-new.jpg";
import outfitImg from "@/assets/outfit-flatlay-new.jpg";
import { Button } from "@/shared/ui";

const chatMessages = [
  { role: "user" as const, text: "Tôi cần outfit đi cà phê cuối tuần" },
  {
    role: "ai" as const,
    text: "Đây là 3 gợi ý casual chic phù hợp cho bạn! ☕",
  },
];

const outfitCards = [
  { name: "Áo thun cotton", price: "163K", platform: "Shopee" },
  { name: "Quần jeans slim", price: "389K", platform: "Shopee" },
  { name: "Sneaker trắng", price: "329K", platform: "TikTokShop" },
];

const HeroSection = () => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setRevealed(true), 100);
    return () => window.clearTimeout(timer);
  }, []);

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen overflow-hidden bg-background pt-20"
    >
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid min-h-[calc(100vh-5rem)] grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <motion.div style={{ y: textY }} className="py-10 lg:py-24 lg:pr-16">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-8 inline-flex items-center gap-2 bg-secondary/60 px-4 py-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-body font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Thời trang AI
              </span>
            </motion.div>

            <h1 className="mb-8 font-heading text-5xl font-semibold leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl xl:text-7xl">
              <span
                className={`block ${revealed ? "blur-text-reveal" : "opacity-0"}`}
              >
                Tìm Outfit Hoàn Hảo
              </span>
              <span
                className={`gradient-text block font-medium ${
                  revealed
                    ? "blur-text-reveal blur-text-reveal-delay-1"
                    : "opacity-0"
                }`}
              >
                Với Trợ Lý AI
              </span>
            </h1>

            <p
              className={`mb-10 max-w-md text-base leading-relaxed text-muted-foreground ${
                revealed
                  ? "blur-text-reveal blur-text-reveal-delay-2"
                  : "opacity-0"
              }`}
            >
              Mô tả phong cách của bạn và nhận gợi ý outfit ngay lập tức kèm
              link mua hàng từ Shopee, TikTok Shop và nhiều sàn khác.
            </p>

            <div
              className={`mb-14 flex flex-col gap-3 sm:flex-row ${
                revealed
                  ? "blur-text-reveal blur-text-reveal-delay-3"
                  : "opacity-0"
              }`}
            >
              <Button variant="accent" size="lg" className="gap-2">
                Nhận gợi ý outfit AI <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="hero-outline" size="lg">
                Xem cách hoạt động
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className={`soft-panel max-w-md p-5 ${revealed ? "" : "opacity-0"}`}
            >
              <p className="editorial-label mb-4">Xem trước AI Stylist</p>
              <div className="mb-4 space-y-3">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                        message.role === "user"
                          ? "bg-foreground text-background"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      <p className="text-xs font-body">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                {outfitCards.map((card) => (
                  <div
                    key={card.name}
                    className="flex-1 rounded-xl bg-card p-2.5"
                  >
                    <div className="mb-2 aspect-square w-full rounded-md bg-secondary" />
                    <p className="truncate text-[10px] font-body font-medium text-foreground">
                      {card.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] font-body font-semibold text-foreground">
                        {card.price}
                      </span>
                      <span className="text-[10px] font-body uppercase text-muted-foreground">
                        {card.platform}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <div className="relative mt-12 pb-16 lg:mt-0 lg:pb-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              style={{ y: imgY }}
              className="relative mx-auto max-w-md lg:max-w-none"
            >
              <div className="aspect-[3/4] max-h-[70vh] rounded-2xl lg:max-h-[85vh]">
                <img
                  src={heroImg}
                  alt="Thời trang editorial - Outfit được AI phối"
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>


            </motion.div>
          </div>
        </div>
      </div>

      <div className="border-y border-border/30 bg-background/55">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row">
          <p className="editorial-label">
            Sản phẩm từ các sàn thương mại điện tử hàng đầu
          </p>
          <div className="flex items-center gap-8 md:gap-12">
            {[
              { name: "Shopee", color: "text-shopee" },
              { name: "TikTok Shop", color: "text-tiktok" },
            ].map((partner) => (
              <span
                key={partner.name}
                className={`text-xs font-body font-semibold uppercase tracking-wider ${partner.color} opacity-60 transition-opacity hover:opacity-100`}
              >
                {partner.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
