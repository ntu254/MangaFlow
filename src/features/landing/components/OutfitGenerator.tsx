import outfitImg from "@/assets/outfit-flatlay-new.jpg";
import { Button } from "@/shared/ui";
import { motion } from "framer-motion";
import { RefreshCcw, ShoppingCart, Star } from "lucide-react";

const items = [
  {
    type: "Áo",
    name: "Áo sơ mi denim xanh nhạt",
    price: "245.000đ",
    originalPrice: "350.000đ",
    platform: "Shopee",
    rating: 4.8,
  },
  {
    type: "Quần",
    name: "Quần âu slim-fit xám",
    price: "380.000đ",
    originalPrice: "520.000đ",
    platform: "Shopee",
    rating: 4.7,
  },
  {
    type: "Giày",
    name: "Sneaker trắng low-top",
    price: "329.000đ",
    originalPrice: "450.000đ",
    platform: "TikTokShop",
    rating: 4.9,
  },
  {
    type: "Túi",
    name: "Túi xách tote canvas beige",
    price: "135.000đ",
    originalPrice: "200.000đ",
    platform: "Shopee",
    rating: 4.5,
  },
];

const platformColors: Record<string, string> = {
  Shopee: "bg-shopee",
  TikTokShop: "bg-tiktok",
};

const OutfitGenerator = () => (
  <section className="bg-background">
    <div className="border-b border-border px-6 py-16 text-center">
      <p className="editorial-label mb-4">AI tạo outfit</p>
      <h2 className="font-heading text-3xl md:text-4xl font-medium text-foreground">
        Outfit <span className="font-semibold">hoàn chỉnh</span> từ AI
      </h2>
    </div>

    <div className="mag-grid grid-cols-1 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative mag-img-zoom aspect-square lg:aspect-auto lg:min-h-[600px]"
      >
        <img
          src={outfitImg}
          alt="Outfit do AI tạo"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-6 left-6 bg-secondary text-foreground px-4 py-2">
          <p className="text-[10px] font-body font-bold uppercase tracking-wider">
            AI tạo
          </p>
        </div>
        <div className="absolute bottom-6 left-6 right-6 flex gap-2">
          <span className="bg-background/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-body font-medium uppercase tracking-wider text-foreground">
            Casual Chic
          </span>
          <span className="bg-background/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-body font-medium uppercase tracking-wider text-foreground">
            Cuối tuần
          </span>
        </div>
      </motion.div>

      <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
        <p className="editorial-label mb-2">Sản phẩm trong outfit</p>
        <p className="text-sm text-muted-foreground font-body mb-8">
          Tổng:{" "}
          <span className="font-semibold text-foreground">1.089.000đ</span>
        </p>

        <div className="space-y-0 divide-y divide-border/30">
          {items.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4 py-5"
            >
              <div className="w-14 h-14 bg-secondary flex-shrink-0 flex items-center justify-center">
                <span className="text-[9px] font-body font-bold uppercase tracking-wider text-muted-foreground">
                  {item.type}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-medium text-foreground truncate">
                  {item.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-foreground font-body font-semibold">
                    {item.price}
                  </span>
                  <span className="text-xs text-muted-foreground font-body line-through">
                    {item.originalPrice}
                  </span>
                  <div className="flex items-center gap-0.5 ml-2">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] font-body text-muted-foreground">
                      {item.rating}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`${platformColors[item.platform]} text-accent-foreground text-[10px] font-body font-semibold px-2.5 py-1 uppercase tracking-wider`}
                >
                  {item.platform}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mt-8">
          <Button className="gap-2 bg-foreground text-background">
            <ShoppingCart className="w-3.5 h-3.5" /> Mua tất cả
          </Button>
          <Button variant="outline" className="gap-2">
            <RefreshCcw className="w-3.5 h-3.5" /> Tạo lại
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default OutfitGenerator;
