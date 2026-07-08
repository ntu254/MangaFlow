import athleisureImg from "@/assets/style-athleisure-new.jpg";
import casualImg from "@/assets/style-casual-new.jpg";
import dateNightImg from "@/assets/style-datenight-new.jpg";
import minimalImg from "@/assets/style-minimal-new.jpg";
import officeImg from "@/assets/style-office-new.jpg";
import streetImg from "@/assets/style-streetwear-new.jpg";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";

const styles = [
  { label: "Casual", image: casualImg, tag: "Hàng ngày" },
  { label: "Streetwear", image: streetImg, tag: "Đường phố" },
  { label: "Minimal", image: minimalImg, tag: "Tối giản" },
  { label: "Công sở", image: officeImg, tag: "Chuyên nghiệp" },
  { label: "Athleisure", image: athleisureImg, tag: "Năng động" },
  { label: "Hẹn hò", image: dateNightImg, tag: "Thanh lịch" },
];

const StyleExplorer = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const headerY = useTransform(scrollYProgress, [0, 0.5], [40, 0]);

  return (
    <section ref={ref} className="bg-background">
      <div className="border-b border-border px-6 py-16 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="editorial-label mb-4"
        >
          Khám phá phong cách
        </motion.p>
        <motion.div style={{ y: headerY }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl font-medium text-foreground"
          >
            Tìm kiếm <span className="font-semibold">bản sắc thời trang</span>
          </motion.h2>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {styles.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, type: "spring", damping: 20 }}
            className="group relative cursor-pointer overflow-hidden"
          >
            <div className="aspect-[3/4]">
              <img
                src={s.image}
                alt={s.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent flex flex-col justify-end p-5 group-hover:from-foreground/80 transition-all duration-500">
              <span className="text-[9px] font-body uppercase tracking-[0.3em] text-background/60 mb-1">
                {s.tag}
              </span>
              <p className="font-heading text-xl font-medium text-background mb-3 group-hover:translate-y-0 translate-y-1 transition-transform duration-300">
                {s.label}
              </p>
              <div className="flex items-center gap-1.5 text-background/70 group-hover:text-accent transition-colors">
                <span className="text-[10px] font-body font-medium uppercase tracking-wider">
                  Xem outfit
                </span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default StyleExplorer;
