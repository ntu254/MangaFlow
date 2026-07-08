import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles, TrendingUp } from "lucide-react";

const insights = [
  {
    text: "Lượt tìm kiếm outfit linen tăng 64% mùa hè này.",
    stat: "+64%",
    category: "Chất liệu",
  },
  {
    text: "Phong cách gorpcore tăng 40% trên mạng xã hội.",
    stat: "+40%",
    category: "Thẩm mỹ",
  },
  {
    text: "Vàng bơ xuất hiện trong 38% BST hè 2026.",
    stat: "38%",
    category: "Màu sắc",
  },
  {
    text: "Quần cargo là sản phẩm được tìm kiếm #1 toàn cầu.",
    stat: "#1",
    category: "Sản phẩm",
  },
  {
    text: "Outfit quiet luxury có tỷ lệ lưu cao gấp 2.3 lần.",
    stat: "2.3x",
    category: "Phong cách",
  },
  {
    text: "Nội dung thời trang Hàn Quốc tăng 55% tương tác.",
    stat: "+55%",
    category: "Văn hóa",
  },
];

const AITrendInsights = () => {
  return (
    <section className="py-14 md:py-20 border-t border-border bg-muted/30">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="editorial-label mb-3 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-accent" /> Phân tích bởi Redo
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground">
              Phân tích <span className="italic">xu hướng AI</span>
            </h2>
          </div>
          <TrendingUp className="w-5 h-5 text-muted-foreground hidden md:block" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {insights.map((ins, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="bg-background p-6 flex gap-4 items-start group hover:bg-card transition-colors"
            >
              <div className="text-2xl md:text-3xl font-heading font-light text-accent shrink-0 w-14 text-right">
                {ins.stat}
              </div>
              <div className="flex-1">
                <span className="text-[9px] font-body font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {ins.category}
                </span>
                <p className="text-[12px] font-body text-foreground leading-relaxed mt-1">
                  {ins.text}
                </p>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AITrendInsights;
