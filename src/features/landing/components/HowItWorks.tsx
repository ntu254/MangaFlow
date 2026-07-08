import { motion } from "framer-motion";
import { ClipboardList, ShoppingBag, Wand2 } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Làm bài quiz phong cách",
    desc: "Trả lời vài câu hỏi nhanh hoặc tải lên tủ đồ. Cho chúng tôi biết vibe, ngân sách và dịp mặc.",
    num: "01",
  },
  {
    icon: Wand2,
    title: "AI tạo outfit",
    desc: "AI tạo bộ outfit hoàn chỉnh — áo, quần, giày, phụ kiện — phù hợp với phong cách của bạn.",
    num: "02",
  },
  {
    icon: ShoppingBag,
    title: "Mua sắm ngay",
    desc: "Mỗi sản phẩm đều có link giá tốt nhất trên Shopee, TikTok Shop. Mua chỉ với một click.",
    num: "03",
  },
];

const HowItWorks = () => (
  <section id="how-it-works" className="bg-background py-8 md:py-12">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="soft-panel flex items-center justify-center p-12 md:p-16"
      >
        <div>
          <p className="editorial-label mb-4">Cách hoạt động</p>
          <h2 className="font-heading text-3xl font-medium leading-tight text-foreground md:text-4xl">
            Ba bước để có
            <br />
            <span className="font-semibold">outfit hoàn hảo</span>
          </h2>
          <div className="editorial-divider mt-6" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15, type: "spring", damping: 20 }}
            className="flex min-h-0 flex-col justify-between rounded-xl bg-card p-8 md:p-10"
          >
            <div>
              <span className="editorial-label">{step.num}</span>
              <div className="mb-5 mt-6 text-foreground/50">
                <step.icon className="h-7 w-7" strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-heading text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
