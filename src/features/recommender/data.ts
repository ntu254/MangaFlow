import casualImg from "@/assets/style-casual-new.jpg";
import officeImg from "@/assets/style-office-new.jpg";
import partyImg from "@/assets/style-party-new.jpg";
import streetImg from "@/assets/style-streetwear-new.jpg";
import datenightImg from "@/assets/style-datenight-new.jpg";
import minimalImg from "@/assets/style-minimal-new.jpg";
import athleisureImg from "@/assets/style-athleisure-new.jpg";

import prodBlackHeels from "@/assets/products/black-heels.jpg";
import prodBlackTrousers from "@/assets/products/black-trousers.jpg";
import prodBucketHat from "@/assets/products/bucket-hat.jpg";
import prodCargo from "@/assets/products/cargo-pants.jpg";
import prodHoodie from "@/assets/products/hoodie-vintage.jpg";
import prodJeans from "@/assets/products/jeans-wide-leg.jpg";
import prodDenimJacket from "@/assets/wardrobe/denim-jacket.jpg";
import prodSequinDress from "@/assets/products/sequin-dress.jpg";
import prodSilkBlouse from "@/assets/products/silk-blouse.jpg";
import prodSilverClutch from "@/assets/products/silver-clutch.jpg";
import prodSneakers from "@/assets/products/sneakers-white.jpg";
import prodTshirt from "@/assets/products/tshirt-white-basic.jpg";

import type { Outfit } from "./types";

export const sampleOutfits: Outfit[] = [
  {
    id: 1,
    title: "Casual Chic Hàng Ngày",
    emoji: "🧡",
    image: casualImg,
    style: "Casual · Minimalist",
    styleTags: ["Casual", "Minimal"],
    aiMatch: true,
    aiComment: "Bộ outfit phù hợp minimalist của bạn, dễ phối và thích hợp từ đi học đến cà phê cuối tuần!",
    totalPrice: "1.099.000đ",
    matchScore: 96,
    season: "All Season",
    occasion: "Daily",
    mood: "Relaxed",
    products: [
      { name: "Áo thun basic oversize cotton", price: "189.000đ", oldPrice: "250.000đ", platform: "Shopee", badge: "Bestseller", rating: 4.8, sold: "12.4k", brand: "YODY", image: prodTshirt },
      { name: "Quần jeans ống rộng high waist", price: "390.000đ", oldPrice: "450.000đ", platform: "TikTokShop", badge: null, rating: 4.6, sold: "8.2k", brand: "Routine", image: prodJeans },
      { name: "Sneakers trắng basic unisex", price: "520.000đ", oldPrice: null, platform: "TikTokShop", badge: "Freeship", rating: 4.7, sold: "5.1k", brand: "Ananas", image: prodSneakers },
    ],
  },
  {
    id: 2,
    title: "Streetwear Trendy",
    emoji: "🧢",
    image: streetImg,
    style: "Streetwear · K-Fashion",
    styleTags: ["Streetwear", "K-Fashion"],
    aiMatch: true,
    aiComment: "Inspired bởi K-Street đang hot, mix tones earth với điểm nhấn nổi bật. Chuẩn cho cuối tuần!",
    totalPrice: "875.000đ",
    matchScore: 94,
    season: "Spring/Fall",
    occasion: "Weekend",
    mood: "Energetic",
    products: [
      { name: "Hoodie vintage wash oversized", price: "350.000đ", oldPrice: null, platform: "Shopee", badge: "Hot", rating: 4.9, sold: "20.1k", brand: "MLB", image: prodHoodie },
      { name: "Cargo pants túi hộp 6 túi", price: "430.000đ", oldPrice: "560.000đ", platform: "Shopee", badge: null, rating: 4.5, sold: "6.8k", brand: "5S Fashion", image: prodCargo },
      { name: "Mũ bucket Corduroy", price: "95.000đ", oldPrice: null, platform: "Shopee", badge: null, rating: 4.7, sold: "15.3k", brand: "Local Brand", image: prodBucketHat },
    ],
  },
  {
    id: 3,
    title: "Office Elegant",
    emoji: "💼",
    image: officeImg,
    style: "Công sở · Thanh lịch",
    styleTags: ["Office", "Minimal"],
    aiMatch: false,
    aiComment: "Phong cách công sở hiện đại, tinh tế nhưng không nhàm chán. Phù hợp meeting và after-work dinner!",
    totalPrice: "1.280.000đ",
    matchScore: 88,
    season: "All Season",
    occasion: "Work",
    mood: "Professional",
    products: [
      { name: "Áo sơ mi lụa trắng cổ V", price: "450.000đ", oldPrice: null, platform: "Shopee", badge: "Premium", rating: 4.9, sold: "3.2k", brand: "IVY moda", image: prodSilkBlouse },
      { name: "Quần âu đen ống đứng slim", price: "380.000đ", oldPrice: "420.000đ", platform: "Shopee", badge: null, rating: 4.5, sold: "7.1k", brand: "Aristino", image: prodBlackTrousers },
      { name: "Giày cao gót mũi nhọn 5cm", price: "450.000đ", oldPrice: null, platform: "Shopee", badge: "Freeship", rating: 4.6, sold: "4.5k", brand: "Vascara", image: prodBlackHeels },
    ],
  },
  {
    id: 4,
    title: "Night Out Glam",
    emoji: "✨",
    image: partyImg,
    style: "Dạ tiệc · Party",
    styleTags: ["Party"],
    aiMatch: false,
    aiComment: "Outfit nổi bật cho đêm tiệc! Sequin mix cùng phụ kiện ánh kim, bạn sẽ là tâm điểm mọi ánh nhìn.",
    totalPrice: "1.570.000đ",
    matchScore: 82,
    season: "All Season",
    occasion: "Party",
    mood: "Glamorous",
    products: [
      { name: "Đầm sequin vàng midi", price: "1.250.000đ", oldPrice: null, platform: "Shopee", badge: "Hot", rating: 4.8, sold: "2.1k", brand: "Elise", image: prodSequinDress },
      { name: "Clutch ánh kim bạc", price: "320.000đ", oldPrice: "400.000đ", platform: "Shopee", badge: null, rating: 4.4, sold: "1.8k", brand: "Charles & Keith", image: prodSilverClutch },
    ],
  },
  {
    id: 5,
    title: "Date Night Tinh Tế",
    emoji: "🌹",
    image: datenightImg,
    style: "Lãng mạn · Date Night",
    styleTags: ["Minimal", "Party"],
    aiMatch: false,
    aiComment: "Outfit cho buổi hẹn hò tối nay — vừa thanh lịch vừa có chút phá cách, chắc chắn sẽ gây ấn tượng!",
    totalPrice: "1.890.000đ",
    matchScore: 91,
    season: "Spring/Fall",
    occasion: "Date",
    mood: "Romantic",
    products: [
      { name: "Đầm midi ôm sát", price: "890.000đ", oldPrice: null, platform: "Shopee", badge: "Premium", rating: 4.7, sold: "3.8k", brand: "Elise", image: prodSequinDress },
      { name: "Sandals cao gót quai mảnh", price: "520.000đ", oldPrice: "650.000đ", platform: "TikTokShop", badge: "Freeship", rating: 4.5, sold: "2.4k", brand: "Vascara", image: prodBlackHeels },
      { name: "Túi mini đeo chéo", price: "480.000đ", oldPrice: null, platform: "TikTokShop", badge: null, rating: 4.6, sold: "1.9k", brand: "Charles & Keith", image: prodSilverClutch },
    ],
  },
  {
    id: 6,
    title: "Minimalist Essential",
    emoji: "◻️",
    image: minimalImg,
    style: "Minimal · Basic",
    styleTags: ["Minimal", "Casual"],
    aiMatch: false,
    aiComment: "Less is more. Tone trắng-đen-be kinh điển, dễ mặc, dễ phối, không bao giờ lỗi mốt.",
    totalPrice: "2.450.000đ",
    matchScore: 87,
    season: "All Season",
    occasion: "Daily",
    mood: "Calm",
    products: [
      { name: "Áo blazer trắng oversize", price: "890.000đ", oldPrice: null, platform: "Shopee", badge: "Bestseller", rating: 4.8, sold: "6.2k", brand: "YODY", image: prodTshirt },
      { name: "Quần âu be ống rộng", price: "520.000đ", oldPrice: null, platform: "Shopee", badge: null, rating: 4.6, sold: "4.1k", brand: "Aristino", image: prodBlackTrousers },
      { name: "Túi tote da be", price: "650.000đ", oldPrice: "780.000đ", platform: "TikTokShop", badge: "Hot", rating: 4.7, sold: "3.2k", brand: "Local Brand", image: prodJeans },
      { name: "Sneakers trắng basic", price: "390.000đ", oldPrice: null, platform: "Shopee", badge: null, rating: 4.9, sold: "15.7k", brand: "Ananas", image: prodSneakers },
    ],
  },
  {
    id: 7,
    title: "Athleisure Năng Động",
    emoji: "🏃",
    image: athleisureImg,
    style: "Sporty · Active",
    styleTags: ["Casual", "Sporty"],
    aiMatch: false,
    aiComment: "Phong cách năng động cho ngày cuối tuần — vừa tập gym xong có thể đi cà phê ngay!",
    totalPrice: "1.650.000đ",
    matchScore: 79,
    season: "Summer",
    occasion: "Workout",
    mood: "Energetic",
    products: [
      { name: "Set áo bra + legging", price: "680.000đ", oldPrice: null, platform: "Shopee", badge: "Bestseller", rating: 4.8, sold: "8.9k", brand: "YODY", image: prodCargo },
      { name: "Áo khoác gió mỏng", price: "520.000đ", oldPrice: "600.000đ", platform: "Shopee", badge: null, rating: 4.4, sold: "3.5k", brand: "5S Fashion", image: prodHoodie },
      { name: "Sneakers chạy bộ", price: "450.000đ", oldPrice: null, platform: "TikTokShop", badge: "Freeship", rating: 4.7, sold: "6.4k", brand: "Ananas", image: prodSneakers },
    ],
  },
  {
    id: 8,
    title: "K-Fashion Street Style",
    emoji: "🇰🇷",
    image: streetImg,
    style: "K-Fashion · Streetwear",
    styleTags: ["K-Fashion", "Streetwear"],
    aiMatch: false,
    aiComment: "Phong cách Hàn Quốc đang hot rần rần — layer áo khoác dáng rộng quần ống suông đũa giày platform.",
    totalPrice: "2.120.000đ",
    matchScore: 93,
    season: "Fall/Winter",
    occasion: "Daily",
    mood: "Trendy",
    products: [
      { name: "Áo khoác anh vũ oversized", price: "790.000đ", oldPrice: null, platform: "Shopee", badge: "Hot", rating: 4.8, sold: "7.2k", brand: "MLB", image: prodDenimJacket },
      { name: "Quần ống suông đũa", price: "450.000đ", oldPrice: null, platform: "Shopee", badge: null, rating: 4.5, sold: "5.1k", brand: "Routine", image: prodJeans },
      { name: "Giày platform trắng", price: "550.000đ", oldPrice: "680.000đ", platform: "TikTokShop", badge: "Premium", rating: 4.7, sold: "4.3k", brand: "Ananas", image: prodSneakers },
      { name: "Băng đô bản to", price: "89.000đ", oldPrice: null, platform: "Shopee", badge: null, rating: 4.4, sold: "12.8k", brand: "Local Brand", image: prodBucketHat },
    ],
  },
];
