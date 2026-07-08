import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/shared/ui";

const CTABanner = () => (
  <section className="relative my-8 overflow-hidden md:mx-6 md:my-12">
    <div
      className="absolute inset-0 rounded-2xl"
      style={{
        background: `
					radial-gradient(circle at 88% 18%, hsl(var(--coral-light)) 0%, transparent 26%),
					radial-gradient(circle at 16% 86%, hsl(var(--mint-light)) 0%, transparent 24%),
					linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--teal)) 42%, hsl(var(--accent)) 100%)
				`,
      }}
    />

    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, type: "spring", damping: 20 }}
      className="relative z-10 px-6 py-24 text-center md:py-28"
    >
      <div className="relative z-10">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mb-6 text-md font-body font-medium uppercase tracking-[0.4em] text-background"
        >
          Are you ready?
        </motion.p>

        <h2 className="mx-auto mb-6 max-w-3xl font-heading text-4xl font-semibold leading-tight text-background md:text-5xl lg:text-6xl">
          Để trở thành <span className="font-semibold">stylist riêng</span> của
          bạn
        </h2>

        <p className="mx-auto mb-10 max-w-xl text-sm leading-relaxed text-background/80 md:text-base">
          Mô tả phong cách của bạn và nhận gợi ý outfit ngay lập tức kèm link
          mua hàng từ Shopee, TikTok Shop và nhiều sàn khác.
        </p>

        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Button className="gap-2 bg-background text-foreground hover:bg-background/92">
            Bắt đầu ngay <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  </section>
);

export default CTABanner;
