import { motion } from "framer-motion";
import { Shirt } from "lucide-react";

import whiteTshirt from "@/assets/wardrobe/white-tshirt.jpg";
import blueJeans from "@/assets/wardrobe/blue-jeans.jpg";
import blackBlazer from "@/assets/wardrobe/black-blazer.jpg";
import whiteSneakers from "@/assets/wardrobe/white-sneakers.jpg";
import grayHoodie from "@/assets/wardrobe/gray-hoodie.jpg";
import pinkSilkShirt from "@/assets/wardrobe/pink-silk-shirt.jpg";

const wardrobeFavorites = [
  { name: "Áo thun trắng", img: whiteTshirt, worn: 47 },
  { name: "Quần jeans", img: blueJeans, worn: 38 },
  { name: "Blazer đen", img: blackBlazer, worn: 31 },
  { name: "Sneaker trắng", img: whiteSneakers, worn: 29 },
  { name: "Hoodie xám", img: grayHoodie, worn: 24 },
  { name: "Áo lụa hồng", img: pinkSilkShirt, worn: 18 },
];

const ProfileWardrobeFavorites = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.5 }}
  >
    <div className="border-b border-border">
      <div className="px-6 py-6 border-b border-border">
        <p className="editorial-label">Món đồ yêu thích</p>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6">
        {wardrobeFavorites.map((item, i) => (
          <div key={item.name} className={`group p-4 text-center ${i < wardrobeFavorites.length - 1 ? "border-r border-border" : ""}`}>
            <div className="aspect-square overflow-hidden mb-2 mag-img-zoom">
              <img src={item.img} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <p className="text-[11px] font-body font-medium text-foreground truncate">{item.name}</p>
            <p className="text-[10px] text-muted-foreground font-body mt-0.5">
              <Shirt className="w-3 h-3 inline mr-0.5" />{item.worn} lần
            </p>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

export default ProfileWardrobeFavorites;
