import { motion } from "framer-motion";
import { TrendingUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import cargoImg from "@/assets/products/cargo-pants.jpg";
import blazerImg from "@/assets/products/silk-blouse.jpg";
import sneakersImg from "@/assets/products/sneakers-white.jpg";
import jeansImg from "@/assets/products/jeans-wide-leg.jpg";
import hoodieImg from "@/assets/products/hoodie-vintage.jpg";
import heelsImg from "@/assets/products/black-heels.jpg";

const items = [
  { name: "Quần cargo", image: cargoImg, insight: "Lượt tìm kiếm tăng 45% mùa này.", growth: "+45%" },
  { name: "Blazer oversized", image: blazerImg, insight: "Món đồ không thể thiếu cho phong cách quiet luxury.", growth: "+32%" },
  { name: "Chunky sneaker", image: sneakersImg, insight: "Thống trị cả streetwear và athleisure.", growth: "+28%" },
  { name: "Quần jeans ống rộng", image: jeansImg, insight: "Dáng quần của mùa.", growth: "+38%" },
  { name: "Hoodie vintage", image: hoodieImg, insight: "Hoài niệm Y2K dẫn dắt phong cách casual.", growth: "+22%" },
  { name: "Giày cao gót statement", image: heelsImg, insight: "Sản phẩm xu hướng hàng đầu cho dạ tiệc.", growth: "+19%" },
];

const TrendingItems = () => {
  const navigate = useNavigate();

  return (
    <section className="py-14 md:py-20 border-t border-border">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="editorial-label mb-3">Sản phẩm được tìm kiếm nhiều</p>
            <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground">
              Sản phẩm <span className="italic">xu hướng</span>
            </h2>
          </div>
          <TrendingUp className="w-5 h-5 text-muted-foreground hidden md:block" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border">
          {items.map((item, i) => (
            <motion.button key={item.name} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.4 }}
              onClick={() => navigate("/recommender")}
              className="group bg-background p-4 md:p-6 flex gap-4 items-start text-left hover:bg-muted/30 transition-colors">
              <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-heading text-sm md:text-base italic text-foreground">{item.name}</h3>
                  <span className="text-[9px] font-body font-semibold text-accent">{item.growth}</span>
                </div>
                <p className="text-[11px] font-body text-muted-foreground leading-relaxed line-clamp-2">{item.insight}</p>
                <div className="mt-2 flex items-center gap-1 text-[9px] font-body font-medium uppercase tracking-wider text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  Tạo outfit <ArrowRight className="w-2.5 h-2.5" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingItems;
