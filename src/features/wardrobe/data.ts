import type { WardrobeItem } from "./types";

import imgBlackBlazer from "@/assets/wardrobe/black-blazer.jpg";
import imgBlackTrousers from "@/assets/wardrobe/black-trousers.jpg";
import imgBlueJeans from "@/assets/wardrobe/blue-jeans.jpg";
import imgCanvasTote from "@/assets/wardrobe/canvas-tote.jpg";
import imgDenimJacket from "@/assets/wardrobe/denim-jacket.jpg";
import imgFloralSkirt from "@/assets/wardrobe/floral-midi-skirt.jpg";
import imgGrayHoodie from "@/assets/wardrobe/gray-hoodie.jpg";
import imgPinkShirt from "@/assets/wardrobe/pink-silk-shirt.jpg";
import imgSunglasses from "@/assets/wardrobe/round-sunglasses.jpg";
import imgStrapSandals from "@/assets/wardrobe/strap-sandals.jpg";
import imgWhiteSneakers from "@/assets/wardrobe/white-sneakers.jpg";
import imgWhiteTshirt from "@/assets/wardrobe/white-tshirt.jpg";

export const wardrobeItems: WardrobeItem[] = [
  { id: 1, name: "Áo thun trắng basic", category: "Tops", color: "#FFFFFF", tags: ["Casual", "Minimal"], image: imgWhiteTshirt },
  { id: 2, name: "Quần jeans xanh đậm", category: "Bottoms", color: "#1C3A5F", tags: ["Casual", "Streetwear"], image: imgBlueJeans },
  { id: 3, name: "Áo sơ mi lụa hồng", category: "Tops", color: "#F4A0A0", tags: ["Office"], image: imgPinkShirt },
  { id: 4, name: "Quần âu đen", category: "Bottoms", color: "#1A1A1A", tags: ["Office", "Minimal"], image: imgBlackTrousers },
  { id: 5, name: "Giày sneaker trắng", category: "Shoes", color: "#F5F5F5", tags: ["Casual", "Sporty"], image: imgWhiteSneakers },
  { id: 6, name: "Túi tote canvas", category: "Accessories", color: "#D2B48C", tags: ["Casual"], image: imgCanvasTote },
  { id: 7, name: "Áo hoodie xám", category: "Tops", color: "#808080", tags: ["Streetwear", "Casual"], image: imgGrayHoodie },
  { id: 8, name: "Váy midi hoa", category: "Bottoms", color: "#FFB6C1", tags: ["Party"], image: imgFloralSkirt },
  { id: 9, name: "Áo khoác denim", category: "Outerwear", color: "#5B7FAF", tags: ["Streetwear", "Casual"], image: imgDenimJacket },
  { id: 10, name: "Sandal quai ngang", category: "Shoes", color: "#C4A882", tags: ["Casual", "Minimal"], image: imgStrapSandals },
  { id: 11, name: "Kính mát tròn", category: "Accessories", color: "#2C2C2C", tags: ["Streetwear"], image: imgSunglasses },
  { id: 12, name: "Áo blazer đen", category: "Outerwear", color: "#1A1A1A", tags: ["Office", "Minimal"], image: imgBlackBlazer },
];
