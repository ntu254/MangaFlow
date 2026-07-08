import { motion } from "framer-motion";

import styleMinimal from "@/assets/style-minimal-new.jpg";
import styleStreet from "@/assets/style-streetwear-new.jpg";
import styleOffice from "@/assets/style-office-new.jpg";
import kfashion from "@/assets/lookbook-kfashion.jpg";

const suggestedStyles = [
  { name: "Quiet Luxury", img: styleMinimal, desc: "Thanh lịch, chất liệu cao cấp, không logo" },
  { name: "Soft Minimal", img: styleOffice, desc: "Nhẹ nhàng, trung tính, tinh tế" },
  { name: "K-Fashion Casual", img: kfashion, desc: "Layer thông minh, phối màu pastel" },
  { name: "Modern Streetwear", img: styleStreet, desc: "Phá cách, oversized, sneaker game" },
];

const ProfileSuggestedStyles = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.5 }}
  >
    <div className="border-b border-border">
      <div className="px-6 py-6 border-b border-border">
        <p className="editorial-label">Phong cách gợi ý</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {suggestedStyles.map((s, i) => (
          <div key={s.name} className={`group ${i < suggestedStyles.length - 1 ? "border-r border-border" : ""}`}>
            <div className="aspect-[3/4] overflow-hidden mag-img-zoom">
              <img src={s.img} alt={s.name} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-4 border-t border-border">
              <h3 className="font-heading text-base text-foreground">{s.name}</h3>
              <p className="text-[11px] text-muted-foreground font-body mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

export default ProfileSuggestedStyles;
