import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

import athleisureImg from "@/assets/style-athleisure.jpg";
import casualImg from "@/assets/style-casual.jpg";
import officeImg from "@/assets/style-office.jpg";
import partyImg from "@/assets/style-party.jpg";
import streetImg from "@/assets/style-streetwear.jpg";
import { Button } from "@/shared/ui";

const platformColors: Record<string, string> = {
  Shopee: "bg-shopee",
};

interface Product {
  name: string;
  price: string;
  platform: string;
}
interface StyleData {
  label: string;
  image: string;
  products: Product[];
  swatches: string[];
  tagline: string;
}

const styles: StyleData[] = [
  {
    label: "Casual",
    image: casualImg,
    tagline: "Thoải mái cho ngày thường",
    swatches: ["#F5DEB3", "#6B8E23", "#4682B4"],
    products: [
      {
        name: "Áo thun cotton basic unisex",
        price: "163.000đ",
        platform: "Shopee",
      },
      {
        name: "Quần jeans slim-fit xanh nhạt",
        price: "389.000đ",
        platform: "Shopee",
      },
      { name: "Sneaker low-top trắng", price: "329.000đ", platform: "TikTokShop" },
      { name: "Túi tote canvas beige", price: "135.000đ", platform: "Shopee" },
    ],
  },
  {
    label: "Công sở",
    image: officeImg,
    tagline: "Chuyên nghiệp, tinh tế",
    swatches: ["#1C1C1C", "#F5F5F5", "#B0C4DE"],
    products: [
      {
        name: "Áo sơ mi lụa trắng slim",
        price: "450.000đ",
        platform: "Shopee",
      },
      { name: "Quần âu ống đứng đen", price: "380.000đ", platform: "Shopee" },
      { name: "Giày oxford da nâu", price: "520.000đ", platform: "TikTokShop" },
      { name: "Đồng hồ minimalist bạc", price: "890.000đ", platform: "Shopee" },
    ],
  },
  {
    label: "Dạ tiệc",
    image: partyImg,
    tagline: "Sang trọng cho buổi tối",
    swatches: ["#FFD700", "#8B0000", "#000000"],
    products: [
      { name: "Đầm sequin vàng midi", price: "1.250.000đ", platform: "Shopee" },
      { name: "Clutch ánh kim bạc", price: "320.000đ", platform: "Shopee" },
      {
        name: "Giày cao gót strappy đen",
        price: "650.000đ",
        platform: "Shopee",
      },
      { name: "Bông tai pha lê dáng dài", price: "189.000đ", platform: "TikTokShop" },
    ],
  },
  {
    label: "Streetwear",
    image: streetImg,
    tagline: "Cá tính đường phố",
    swatches: ["#2F4F4F", "#FF6347", "#F0E68C"],
    products: [
      {
        name: "Hoodie oversize graphic",
        price: "420.000đ",
        platform: "Shopee",
      },
      { name: "Quần cargo túi hộp xám", price: "350.000đ", platform: "Shopee" },
      { name: "Giày chunky sneaker", price: "780.000đ", platform: "TikTokShop" },
      { name: "Mũ bucket hat đen", price: "125.000đ", platform: "Shopee" },
    ],
  },
  {
    label: "Athleisure",
    image: athleisureImg,
    tagline: "Năng động, khỏe khoắn",
    swatches: ["#000000", "#FF1493", "#00CED1"],
    products: [
      { name: "Áo tank top dry-fit", price: "220.000đ", platform: "Shopee" },
      {
        name: "Legging tập gym seamless",
        price: "380.000đ",
        platform: "Shopee",
      },
      { name: "Giày training nhẹ", price: "690.000đ", platform: "TikTokShop" },
      {
        name: "Bình nước thể thao 750ml",
        price: "95.000đ",
        platform: "Shopee",
      },
    ],
  },
];

const StylePicker = () => {
  const [active, setActive] = useState(0);
  const current = styles[active];

  return (
    <section className="bg-background">
      <div className="px-6 py-16 text-center">
        <p className="editorial-label mb-4">Phong cách của bạn</p>
        <h2 className="font-heading text-3xl md:text-4xl font-medium text-foreground">
          Chọn phong cách,{" "}
          <span className="font-semibold">nhận gợi ý ngay</span>
        </h2>
      </div>

      <div className="flex items-center justify-center gap-1 overflow-x-auto">
        {styles.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setActive(i)}
            className={`px-8 py-4 text-[11px] font-body font-medium tracking-[0.2em] uppercase transition-all ${
              i === active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mag-grid grid-cols-1 lg:grid-cols-2">
            <div className="relative mag-img-zoom aspect-[3/4] lg:aspect-auto lg:min-h-[600px]">
              <img
                src={current.image}
                alt={current.label}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-foreground/50 to-transparent">
                <p className="text-[10px] font-body uppercase tracking-[0.3em] text-background/60">
                  {current.tagline}
                </p>
                <p className="font-heading text-4xl font-medium text-background">
                  {current.label}
                </p>
              </div>
              <div className="absolute top-6 right-6 flex gap-2">
                {current.swatches.map((c) => (
                  <span
                    key={c}
                    className="w-5 h-5 border border-background/30"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
              <p className="editorial-label mb-8">
                Sản phẩm gợi ý từ các sàn TMĐT
              </p>

              <div className="space-y-0 divide-y divide-border/30">
                {current.products.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-4 py-5"
                  >
                    <div className="w-12 h-12 bg-secondary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-medium text-foreground truncate">
                        {p.name}
                      </p>
                      <p className="text-sm text-foreground font-body font-semibold">
                        {p.price}
                      </p>
                    </div>
                    <span
                      className={`${platformColors[p.platform]} text-accent-foreground text-[10px] font-body font-semibold px-2.5 py-1 uppercase tracking-wider`}
                    >
                      {p.platform}
                    </span>
                  </motion.div>
                ))}
              </div>

              <Button className="mt-8 gap-2 self-start bg-foreground text-background">
                Xem toàn bộ outfit <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default StylePicker;
