import { motion } from "framer-motion";
import { BarChart3, Palette, User } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  {
    icon: BarChart3,
    label: "DNA Phong cách",
    value: "Minimal 70%",
    bg: "bg-coral-light",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
  {
    icon: Palette,
    label: "Màu yêu thích",
    value: "Trắng · 35%",
    bg: "bg-[hsl(40_30%_95%)]",
    iconBg: "bg-[hsl(40_40%_88%)]",
    iconColor: "text-[hsl(40_40%_40%)]",
  },
  {
    icon: User,
    label: "Loại outfit",
    value: "Casual · 42%",
    bg: "bg-teal-light",
    iconBg: "bg-teal/10",
    iconColor: "text-teal",
  },
];

const StyleProfilePreview = () => (
  <section className="bg-background">
    <div className="border-b border-border px-6 py-16 text-center">
      <p className="editorial-label mb-4">Phân tích AI</p>
      <h2 className="font-heading text-3xl md:text-4xl font-medium text-foreground">
        Hồ sơ <span className="font-semibold">Phong cách</span>
      </h2>
    </div>

    <div className="mag-grid grid-cols-1 md:grid-cols-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className={`p-10 text-center ${s.bg} group cursor-default transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
        >
          <div
            className={`w-11 h-11 rounded-full ${s.iconBg} flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110`}
          >
            <s.icon className={`w-5 h-5 ${s.iconColor}`} />
          </div>
          <p className="editorial-label mb-2">{s.label}</p>
          <p className="font-heading text-2xl font-semibold text-foreground">
            {s.value}
          </p>
        </motion.div>
      ))}
    </div>

    <div className="border-t border-border px-6 py-10 text-center">
      <Link
        to="/style-profile"
        className="inline-block text-[11px] font-body font-semibold uppercase tracking-[0.2em] text-accent hover:text-accent/80 transition-colors"
      >
        Khám phá hồ sơ phong cách của bạn →
      </Link>
    </div>
  </section>
);

export default StyleProfilePreview;
