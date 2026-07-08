import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const stats = [
  { value: "12.400+", label: "Người dùng" },
  { value: "50K+", label: "Outfit đã tạo" },
  { value: "5", label: "Sàn TMĐT" },
  { value: "98%", label: "Hài lòng" },
];

const testimonials = [
  {
    text: "Redo thay đổi hoàn toàn cách mình mua sắm. Tiết kiệm hàng giờ mỗi tuần và outfit luôn được khen!",
    author: "Minh Anh",
    role: "Tín đồ thời trang",
    rating: 5,
  },
  {
    text: "Gợi ý của AI chính xác đến đáng sợ. Nó hiểu phong cách mình hơn cả chính mình. Link mua hàng cũng rất tiện.",
    author: "Thu Hà",
    role: "Nhà sáng tạo nội dung",
    rating: 5,
  },
  {
    text: "Là người bận rộn, app này cứu mình. Outfit công sở hoàn hảo trong vài giây, đều trong ngân sách.",
    author: "Đức Trung",
    role: "Quản lý Marketing",
    rating: 5,
  },
];

const SocialProof = () => (
  <section className="bg-background">
    <div className="mag-grid grid-cols-2 md:grid-cols-4 border-t border-border">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, type: "spring", damping: 20 }}
          className="py-14 text-center group cursor-default"
        >
          <p className="font-heading text-4xl md:text-5xl font-semibold text-foreground group-hover:text-foreground transition-colors">
            {s.value}
          </p>
          <p className="editorial-label mt-3">{s.label}</p>
        </motion.div>
      ))}
    </div>

    <div className="border-t border-border">
      <div className="px-6 py-16 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="editorial-label mb-4"
        >
          Người dùng nói gì
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-3xl md:text-4xl font-medium text-foreground"
        >
          Được yêu thích bởi{" "}
          <span className="font-semibold">tín đồ thời trang</span>
        </motion.h2>
      </div>

      <div className="mag-grid grid-cols-1 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.author}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, type: "spring", damping: 20 }}
            className="p-8 md:p-10 flex flex-col"
          >
            <Quote className="w-6 h-6 text-foreground/10 mb-5" />
            <p className="text-sm font-body text-foreground leading-relaxed mb-6 flex-1">
              {t.text}
            </p>
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: t.rating }).map((_, j) => (
                <motion.div
                  key={j}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + j * 0.05 }}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </motion.div>
              ))}
            </div>
            <div>
              <p className="text-sm font-body font-semibold text-foreground">
                {t.author}
              </p>
              <p className="text-xs font-body text-muted-foreground">
                {t.role}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProof;
