import { sampleOutfits } from "@/features/recommender/data";
import { wardrobeItems } from "@/features/wardrobe/data";
import type { WardrobeAnalysis } from "@/features/wardrobe/types";
import type { StyleProfile, StyleRecommendation } from "@/features/style-profile/types";
import type { SeasonalTrend, RegionTrend, NextTrend, PersonalizedTrend, WardrobeMatch } from "@/features/trends/types";
import type { DashboardStats, AdminProductClick } from "@/features/admin/types";

export interface WardrobeOverviewMock {
  itemCount: number;
  savedOutfits: number;
  aiSuggestions: number;
}

export interface WardrobeSuggestionPiece {
  role: string;
  name: string;
  color: string;
}

export interface WardrobeUploadAnalysisMock {
  detectedName: string;
  detectedCategory: string;
  detectedType: string;
  detectedColor: string;
  detectedTags: string[];
  suggestion: WardrobeSuggestionPiece[];
}

export const wardrobeOverviewMock: WardrobeOverviewMock = {
  itemCount: wardrobeItems.length,
  savedOutfits: 5,
  aiSuggestions: 18,
};

export const wardrobeSuggestionMock: WardrobeSuggestionPiece[] = [
  { role: "Áo", name: "Áo thun trắng basic", color: "#FFFFFF" },
  { role: "Quần", name: "Quần jeans xanh đậm", color: "#1C3A5F" },
  { role: "Giày", name: "Giày sneaker trắng", color: "#F5F5F5" },
];

export const wardrobeUploadAnalysisMock: WardrobeUploadAnalysisMock = {
  detectedName: "Áo thun trắng",
  detectedCategory: "Tops",
  detectedType: "Áo thun",
  detectedColor: "#FFFFFF",
  detectedTags: ["Casual", "Minimal"],
  suggestion: wardrobeSuggestionMock,
};

export const wardrobeAnalysisMock: WardrobeAnalysis = {
  totalItems: wardrobeItems.length,
  topCategory: "Tops",
  topColor: "White",
  topStyle: "Casual",
  colorPalette: [
    { color: "#FFFFFF", count: 2, label: "Trắng" },
    { color: "#1A1A1A", count: 2, label: "Đen" },
    { color: "#1C3A5F", count: 1, label: "Xanh dương" },
    { color: "#D2B48C", count: 1, label: "Be" },
    { color: "#808080", count: 1, label: "Xám" },
    { color: "#F4A0A0", count: 1, label: "Hồng" },
  ],
  categoryDistribution: [
    { category: "Tops", count: 3 },
    { category: "Bottoms", count: 3 },
    { category: "Shoes", count: 2 },
    { category: "Outerwear", count: 2 },
    { category: "Accessories", count: 2 },
  ],
  styleDistribution: [
    { style: "Casual", count: 7 },
    { style: "Minimal", count: 4 },
    { style: "Streetwear", count: 4 },
    { style: "Office", count: 3 },
    { style: "Party", count: 1 },
    { style: "Sporty", count: 1 },
  ],
  seasonBreakdown: [
    { season: "Xuân/Hè", count: 5 },
    { season: "Thu/Đông", count: 3 },
    { season: "Quanh năm", count: 4 },
  ],
  consistencyScore: 72,
  dominantStyles: ["Casual", "Minimal"],
  missingEssentials: ["Sneaker trắng basic", "Blazer đen", "Túi tote đa năng"],
};

export const styleProfileMock: StyleProfile = {
  styleDna: [
    { style: "Minimal", value: 70 },
    { style: "Streetwear", value: 15 },
    { style: "Casual", value: 10 },
    { style: "Elegant", value: 5 },
    { style: "Athleisure", value: 8 },
    { style: "Classic", value: 12 },
  ],
  favoriteColors: [
    { name: "White", hex: "#FFFFFF", pct: 35 },
    { name: "Beige", hex: "#F5F0E8", pct: 25 },
    { name: "Black", hex: "#1C1C1C", pct: 20 },
    { name: "Navy", hex: "#1B2A4A", pct: 12 },
    { name: "Sage Green", hex: "#9CAF88", pct: 8 },
  ],
  outfitTypeDistribution: [
    { name: "Casual", value: 42, color: "hsl(0 0% 75%)" },
    { name: "Office", value: 28, color: "hsl(0 0% 45%)" },
    { name: "Streetwear", value: 15, color: "hsl(0 100% 70%)" },
    { name: "Party", value: 10, color: "hsl(0 0% 25%)" },
    { name: "Sport", value: 5, color: "hsl(166 65% 50%)" },
  ],
  aiInsight: {
    summary: "Phong cách của bạn là modern minimal với ảnh hưởng streetwear nhẹ nhàng.",
    description: "Bạn ưa chuộng outfit trung tính, linh hoạt cho cả casual lẫn office.",
  },
  insights: [
    "Bạn thường chọn tông màu trung tính — phong cách minimal rất rõ nét.",
    "Bạn ưa chuộng silhouette tối giản và đường cắt sạch.",
    "Rất hiếm khi bạn mặc màu sắc rực rỡ — thử thêm pastel nhé!",
    "Outfit casual chiếm phần lớn tủ đồ — linh hoạt cho mọi dịp.",
  ],
  wardrobeFavorites: [],
  evolution: [
    { month: "Jan", Minimal: 30, Casual: 50, Office: 20 },
    { month: "Feb", Minimal: 35, Casual: 45, Office: 20 },
    { month: "Mar", Minimal: 50, Casual: 30, Office: 20 },
    { month: "Apr", Minimal: 55, Casual: 25, Office: 20 },
    { month: "May", Minimal: 60, Casual: 20, Office: 20 },
    { month: "Jun", Minimal: 70, Casual: 10, Office: 20 },
  ],
  trendSummary: [
    { label: "Minimal", change: "+40%", positive: true },
    { label: "Casual", change: "-40%", positive: false },
    { label: "Office", change: "Ổn định", positive: null },
  ],
  keyMoments: [
    { month: "Tháng 3", event: "Minimal bắt đầu tăng mạnh" },
    { month: "Tháng 6", event: "Minimal trở thành phong cách chủ đạo" },
  ],
  suggestedStyles: [],
  missingEssentials: [
    { item: "Sneaker trắng basic", reason: "Phù hợp mọi outfit casual & minimal", priority: "high" },
    { item: "Blazer đen", reason: "Nâng cấp office look ngay lập tức", priority: "high" },
    { item: "Túi tote đa năng", reason: "Phụ kiện thiết yếu cho ngày dài", priority: "medium" },
    { item: "Áo len cashmere", reason: "Layer mỏng nhẹ cho thu/đông", priority: "medium" },
    { item: "Đồng hồ tối giản", reason: "Điểm nhấn tinh tế cho style minimal", priority: "low" },
  ],
  consistencyScore: 72,
  dominantStyles: ["Casual", "Minimal"],
};

export const styleRecommendationsMock: StyleRecommendation[] = [
  { prompt: "outfit minimal cho đi làm", label: "Đi làm — Minimal", style: "Minimal" },
  { prompt: "outfit streetwear cá tính", label: "Dạo phố — Streetwear", style: "Streetwear" },
  { prompt: "outfit casual cuối tuần", label: "Cuối tuần — Casual", style: "Casual" },
  { prompt: "outfit tối giản sang trọng", label: "Hẹn hò — Minimal", style: "Minimal" },
];

export const seasonalTrendsMock: SeasonalTrend[] = [
  {
    season: "summer",
    label: "Hè 2026",
    trends: [
      { name: "Linen mọi thứ", desc: "Từ blazer đến quần ống rộng — linen thống trị mùa hè.", growth: "+64%" },
      { name: "Váy maxi hoa", desc: "Maxi trở lại với xếp ly và họa tiết hoa tinh tế.", growth: "+42%" },
      { name: "Màu pastel", desc: "Vàng bơ, xanh sage, hồng baby — palette của mùa.", growth: "+38%" },
    ],
  },
  {
    season: "autumn",
    label: "Thu 2026",
    trends: [
      { name: "Lớp layer tối giản", desc: "Phối layer tinh tế với tông màu đất.", growth: "+35%" },
      { name: "Blazer oversized", desc: "Blazer dáng rộng — món đồ trung tâm cho thu.", growth: "+47%" },
      { name: "Tông màu mocha", desc: "Nâu mocha và be đậm dẫn đầu xu hướng thu.", growth: "+31%" },
    ],
  },
  {
    season: "winter",
    label: "Đông 2026",
    trends: [
      { name: "Quiet Luxury", desc: "Chất liệu cao cấp, len cashmere, dáng suông.", growth: "+55%" },
      { name: "Bốt cao cổ", desc: "Knee-high boots cho phong cách thanh lịch.", growth: "+29%" },
      { name: "Áo khoác lông", desc: "Faux fur làm điểm nhấn cho mùa đông.", growth: "+33%" },
    ],
  },
];

export const regionalTrendsMock: RegionTrend[] = [
  { region: "Hàn Quốc", flag: "🇰🇷", trends: ["K-Fashion layer oversized", "Màu pastel Hàn", "Túi tote tối giản", "Silhouette rộng"] },
  { region: "Nhật Bản", flag: "🇯🇵", trends: ["Streetwear Nhật", "Denim raw", "Giày tabi", "Phong cách Ura-Harajuku"] },
  { region: "Mỹ", flag: "🇺🇸", trends: ["Gorpcore", "Old money", "Athleisure nâng cấp", "Sneaker culture"] },
  { region: "Việt Nam", flag: "🇻🇳", trends: ["Áo dài cách tân", "Streetwear Sài Gòn", "Phối đồ linen", "Túi cói"] },
];

export const nextTrendsMock: NextTrend[] = [
  { name: "Mocha Minimal", desc: "Tông màu nâu mocha kết hợp với silhouette tối giản — dự báo sẽ thay thế quiet luxury.", confidence: 87, source: "Phân tích runway SS26 + dữ liệu Pinterest" },
  { name: "Techwear 2.0", desc: "Phiên bản tinh tế hơn của techwear — túi đa năng, chất liệu kỹ thuật, phối layer thông minh.", confidence: 74, source: "TikTok fashion community + search trend" },
  { name: "Crafted Denim", desc: "Denim thủ công, raw edge, mộc mạc — phản ứng ngược với fast fashion.", confidence: 81, source: "Dữ liệu tìm kiếm + Pinterest saves" },
];

export const personalizedTrendsMock: PersonalizedTrend[] = [
  { prompt: "outfit minimal hè 2026", label: "Minimal mùa hè", reason: "Phù hợp Style DNA Minimal · 70%" },
  { prompt: "streetwear cá tính hè", label: "Streetwear hè", reason: "Kết hợp Streetwear 15% + Casual 10%" },
  { prompt: "athleisure hiện đại", label: "Athleisure 2026", reason: "Gợi ý mở rộng phong cách" },
  { prompt: "office minimal thu", label: "Công sở thu", reason: "Office 28% — style hiện có" },
];

export const wardrobeMatchesMock: WardrobeMatch[] = [
  { trend: "Quiet Luxury", match: "Áo blazer đen + quần tây", note: "Bạn đã có blazer đen trong tủ. Kết hợp với quần tây để tạo quiet luxury look." },
  { trend: "Gorpcore", match: "Hoodie xám + cargo pants", note: "Bạn có thể thử Gorpcore với hoodie xám và cargo pants hiện có." },
  { trend: "K-Fashion", match: "Áo thun trắng + quần ống rộng", note: "Layer thêm blazer oversized — bạn đã có sẵn áo thun trắng basic." },
];

export const dashboardStatsMock: DashboardStats = {
  totalUsers: 12847,
  activeToday: 1342,
  outfitsGenerated: 45291,
  wardrobeUploads: 89120,
  savedOutfits: 23456,
  affiliateClicks: 8712,
  userGrowth: [
    { month: "Jan", users: 1200 },
    { month: "Feb", users: 1800 },
    { month: "Mar", users: 2400 },
    { month: "Apr", users: 3100 },
    { month: "May", users: 4200 },
    { month: "Jun", users: 5800 },
  ],
  outfitCategories: [
    { name: "Casual", value: 35, color: "bg-accent" },
    { name: "Formal", value: 25, color: "bg-teal" },
    { name: "Street", value: 22, color: "bg-muted-foreground" },
    { name: "Sport", value: 18, color: "bg-border" },
  ],
  topStyles: [
    { style: "Casual", count: 3200 },
    { style: "Streetwear", count: 2800 },
    { style: "Office", count: 2100 },
    { style: "Date Night", count: 1800 },
    { style: "Athleisure", count: 1400 },
  ],
  recentActivity: [
    { user: "Minh Anh", action: "Generated outfit", time: "2 min ago" },
    { user: "Thanh Hà", action: "Uploaded 5 wardrobe items", time: "8 min ago" },
    { user: "Duc Phong", action: "Saved outfit to collection", time: "15 min ago" },
    { user: "Linh Chi", action: "Completed style quiz", time: "22 min ago" },
    { user: "Hoang Nam", action: "Clicked affiliate link", time: "30 min ago" },
  ],
};

export const adminUsersMock = [
  { id: "u1", name: "Minh Anh", email: "minhanh@gmail.com", avatar_url: null, date: "2025-01-15", plan: "Premium", status: "Active", outfits: 42, wardrobe: 87, credits_balance: 250, is_banned: false },
  { id: "u2", name: "Thanh Hà", email: "thanhha@gmail.com", avatar_url: null, date: "2025-02-03", plan: "Free", status: "Active", outfits: 12, wardrobe: 23, credits_balance: 0, is_banned: false },
  { id: "u3", name: "Duc Phong", email: "ducphong@gmail.com", avatar_url: null, date: "2025-01-28", plan: "Premium", status: "Active", outfits: 56, wardrobe: 112, credits_balance: 500, is_banned: false },
  { id: "u4", name: "Linh Chi", email: "linhchi@gmail.com", avatar_url: null, date: "2024-12-10", plan: "Free", status: "Inactive", outfits: 3, wardrobe: 8, credits_balance: 0, is_banned: false },
  { id: "u5", name: "Hoang Nam", email: "hoangnam@gmail.com", avatar_url: null, date: "2025-03-01", plan: "Premium", status: "Active", outfits: 28, wardrobe: 64, credits_balance: 150, is_banned: true },
  { id: "u6", name: "Thi Ngoc", email: "thingoc@gmail.com", avatar_url: null, date: "2025-02-14", plan: "Free", status: "Active", outfits: 7, wardrobe: 15, credits_balance: 0, is_banned: false },
  { id: "u7", name: "Van Khanh", email: "vankhanh@gmail.com", avatar_url: null, date: "2024-11-20", plan: "Premium", status: "Inactive", outfits: 31, wardrobe: 45, credits_balance: 300, is_banned: false },
  { id: "u8", name: "Bao Tran", email: "baotran@gmail.com", avatar_url: null, date: "2025-01-05", plan: "Free", status: "Active", outfits: 9, wardrobe: 21, credits_balance: 0, is_banned: false },
  { id: "u9", name: "Quoc Anh", email: "quocanh@gmail.com", avatar_url: null, date: "2025-03-10", plan: "Pro", status: "Active", outfits: 18, wardrobe: 41, credits_balance: 75, is_banned: false },
  { id: "u10", name: "Mai Phuong", email: "maiphuong@gmail.com", avatar_url: null, date: "2025-02-20", plan: "Free", status: "Suspended", outfits: 1, wardrobe: 5, credits_balance: 0, is_banned: true },
  { id: "u11", name: "Tuan Anh", email: "tuananh@gmail.com", avatar_url: null, date: "2024-10-05", plan: "Premium", status: "Active", outfits: 73, wardrobe: 156, credits_balance: 820, is_banned: false },
  { id: "u12", name: "Kim Ngan", email: "kimngan@gmail.com", avatar_url: null, date: "2025-03-22", plan: "Free", status: "Active", outfits: 15, wardrobe: 34, credits_balance: 10, is_banned: false },
];

export const adminUserDetailMock = {
  profile: {
    id: "u1",
    name: "Minh Anh",
    email: "minhanh@gmail.com",
    avatar_url: null,
    style_dna: { Minimal: 65, Casual: 20, Streetwear: 15 },
    favorite_colors: ["White", "Beige", "Black"],
    quiz_completed: true,
    is_banned: false,
    ban_reason: null,
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-06-01T00:00:00Z",
  },
  subscription: {
    plan_name: "Premium",
    status: "active",
    billing_cycle: "monthly",
    current_period_start: "2025-06-01T00:00:00Z",
    current_period_end: "2025-07-01T00:00:00Z",
    trial_end: null,
  },
  credits: {
    balance: 250,
    lifetime_earned: 1200,
    lifetime_spent: 950,
    recent_transactions: [
      { id: "ct1", amount: 100, type: "earned", description: "Monthly credit grant", created_at: "2025-06-01T00:00:00Z" },
      { id: "ct2", amount: -50, type: "spent", description: "AI outfit generation", created_at: "2025-05-30T00:00:00Z" },
      { id: "ct3", amount: -30, type: "spent", description: "Style analysis", created_at: "2025-05-28T00:00:00Z" },
    ],
  },
  ai_usage: {
    total_jobs: 87,
    successful: 82,
    failed: 5,
    avg_confidence: 0.87,
    recent_jobs: [
      { id: "aj1", job_type: "outfit_generation", status: "completed", created_at: "2025-06-02T12:00:00Z" },
      { id: "aj2", job_type: "style_analysis", status: "completed", created_at: "2025-06-01T10:00:00Z" },
      { id: "aj3", job_type: "trend_match", status: "failed", created_at: "2025-05-30T15:00:00Z" },
    ],
  },
};

export const adminProductsDataMock = {
  stats: {
    totalProducts: 8,
    activeAffiliates: 6,
    brokenLinks: 2,
    totalClicks: 3451,
  },
  products: [
    { id: "p1", title: "Classic White Tee", platform: "Shopee", category: "Tops", affiliate: "Active", linkHealth: "Healthy", featured: true, clicks: 842, commission: 12800, image_url: null },
    { id: "p2", title: "Wide Leg Jeans", platform: "Shopee", category: "Bottoms", affiliate: "Active", linkHealth: "Healthy", featured: false, clicks: 563, commission: 22400, image_url: null },
    { id: "p3", title: "Silk Midi Skirt", platform: "Shopee", category: "Bottoms", affiliate: "Active", linkHealth: "Broken", featured: false, clicks: 0, commission: 0, image_url: null },
    { id: "p4", title: "Canvas Tote Bag", platform: "TikTokShop", category: "Accessories", affiliate: "Inactive", linkHealth: "Healthy", featured: false, clicks: 189, commission: 3400, image_url: null },
    { id: "p5", title: "Chunky Sneakers", platform: "TikTok Shop", category: "Shoes", affiliate: "Active", linkHealth: "Healthy", featured: true, clicks: 1204, commission: 45000, image_url: null },
    { id: "p6", title: "Oversized Blazer", platform: "Shopee", category: "Outerwear", affiliate: "Active", linkHealth: "Healthy", featured: false, clicks: 321, commission: 18900, image_url: null },
    { id: "p7", title: "Sequin Party Dress", platform: "Shopee", category: "Dresses", affiliate: "Active", linkHealth: "Broken", featured: false, clicks: 0, commission: 0, image_url: null },
    { id: "p8", title: "Leather Belt", platform: "TikTokShop", category: "Accessories", affiliate: "Inactive", linkHealth: "Healthy", featured: false, clicks: 332, commission: 5600, image_url: null },
  ],
};

export const adminProductClicksMock: Record<string, AdminProductClick[]> = {
  p1: [
    { id: "c1", user: "Minh Anh", platform: "Shopee", clicked_at: "2026-06-02T14:30:00Z", source: "outfit_detail" },
    { id: "c2", user: "Thanh Hà", platform: "Shopee", clicked_at: "2026-06-02T12:15:00Z", source: "trend_card" },
  ],
  p5: [
    { id: "c3", user: "Duc Phong", platform: "TikTok Shop", clicked_at: "2026-06-02T10:00:00Z", source: "recommendation" },
    { id: "c4", user: "Hoang Nam", platform: "TikTok Shop", clicked_at: "2026-06-01T18:45:00Z", source: "outfit_detail" },
    { id: "c5", user: "Linh Chi", platform: "TikTok Shop", clicked_at: "2026-06-01T09:30:00Z", source: "trend_card" },
  ],
};

export const adminSettingsDataMock = {
  onboardingToggles: [
    { key: "style_quiz", label: "Enable Style Quiz", description: "Show style quiz for new users", enabled: true },
    { key: "wardrobe_scan", label: "Enable Wardrobe Scan", description: "Allow AI wardrobe scanning on signup", enabled: true },
    { key: "skip_onboarding", label: "Skip Onboarding Option", description: "Let users skip onboarding", enabled: false },
  ],
  platformInfo: { platformName: "Redo", supportEmail: "support@Redo.com" },
  styleCategories: ["Casual", "Streetwear", "Office", "Date Night", "Athleisure", "Party", "Minimal", "Bohemian"],
  occasionCategories: ["Work", "Weekend", "Date", "Party", "Vacation", "Formal Event", "Gym", "School"],
  colorPalette: ["#E8927C", "#2EC4B6", "#1D1D1D", "#F4F0EC", "#6C63FF", "#FFD166", "#EF476F", "#118AB2"],
  notificationTemplates: ["Welcome Email", "Weekly Style Report", "New Trend Alert", "Outfit Saved Confirmation", "Account Suspension Notice"],
  apiIntegrations: [
    { name: "Shopee Affiliate API", status: "Connected" },
    { name: "TikTok Shop API", status: "Connected" },
  ],
  roles: [
    { role: "Super Admin", users: 1, access: "Full access to all features" },
    { role: "Content Manager", users: 2, access: "Trends, Lookbook, Products" },
    { role: "Support Agent", users: 3, access: "Feedback, Reports, Users (read-only)" },
    { role: "AI Engineer", users: 1, access: "AI Analytics, Settings" },
  ],
};

export const adminFeedbackDataMock = {
  total: 6,
  reports: [
    { id: "f1", type: "Incorrect AI Recommendation", user: "Minh Anh", priority: "High", status: "New", date: "2026-03-10", detail: "Outfit suggested winter coat for summer occasion" },
    { id: "f2", type: "Broken Shopping Link", user: "Thanh Hà", priority: "Medium", status: "In Review", date: "2026-03-09", detail: "Shopee link for white sneakers returns 404" },
    { id: "f3", type: "Wrong Wardrobe Detection", user: "Duc Phong", priority: "High", status: "New", date: "2026-03-09", detail: "AI detected pants as skirt" },
    { id: "f4", type: "General Feedback", user: "Linh Chi", priority: "Low", status: "Resolved", date: "2026-03-08", detail: "Would love more Korean style options" },
    { id: "f5", type: "Incorrect AI Recommendation", user: "Hoang Nam", priority: "Medium", status: "In Review", date: "2026-03-07", detail: "Color recommendations clash with uploaded wardrobe" },
    { id: "f6", type: "Wrong Wardrobe Detection", user: "Thi Ngoc", priority: "High", status: "New", date: "2026-03-11", detail: "Bag detected as shoe" },
  ],
};

export const adminNotificationsDataMock = {
  templates: [
    { id: "nt1", name: "New Outfit Ready", channel: "Push", trigger: "outfit.generated", status: "Active" },
    { id: "nt2", name: "Weekly Style Report", channel: "Email", trigger: "weekly.digest", status: "Active" },
    { id: "nt3", name: "Trend Alert", channel: "Push", trigger: "trend.updated", status: "Active" },
    { id: "nt4", name: "Subscription Expiring", channel: "Email", trigger: "subscription.expiring", status: "Active" },
    { id: "nt5", name: "Welcome Series", channel: "Email", trigger: "user.registered", status: "Draft" },
    { id: "nt6", name: "Sale Promotion", channel: "Push", trigger: "promotion.sale", status: "Inactive" },
  ],
  emailSettings: [
    { key: "weekly_digest", label: "Weekly Style Digest", description: "Send weekly outfit recommendations via email", enabled: true },
    { key: "trend_alerts", label: "Trend Alerts", description: "Notify users about new fashion trends", enabled: true },
    { key: "promotional", label: "Promotional Emails", description: "Send promotions and affiliate deals", enabled: false },
  ],
  pushSettings: [
    { key: "outfit_ready", label: "Outfit Ready", description: "Push when AI finishes generating an outfit", enabled: true },
    { key: "new_trend", label: "New Trend Available", description: "Push when new trend insights are ready", enabled: true },
    { key: "subscription_reminder", label: "Subscription Reminders", description: "Push before subscription expires", enabled: true },
  ],
};

export const adminAnalyticsDataMock = {
  stats: {
    totalGenerations: "145K",
    detectionAccuracy: "93.2%",
    avgConfidence: "87.5%",
    topStyle: "Casual",
    mostSaved: "2,341",
    failedDetections: "814",
  },
  dailyGenerations: [
    { day: "Mon", count: 820 },
    { day: "Tue", count: 1050 },
    { day: "Wed", count: 940 },
    { day: "Thu", count: 1200 },
    { day: "Fri", count: 1580 },
    { day: "Sat", count: 1890 },
    { day: "Sun", count: 1640 },
  ],
  accuracyTrend: [
    { month: "Jan", rate: 78 },
    { month: "Feb", rate: 82 },
    { month: "Mar", rate: 85 },
    { month: "Apr", rate: 87 },
    { month: "May", rate: 91 },
    { month: "Jun", rate: 93 },
  ],
  topPrompts: [
    { prompt: "Office outfit for summer", count: 1240 },
    { prompt: "Casual weekend look", count: 980 },
    { prompt: "Date night elegant", count: 870 },
    { prompt: "Streetwear Korean style", count: 760 },
    { prompt: "Beach vacation outfit", count: 650 },
  ],
  failedDetections: [
    { item: "Patterned shirts", count: 342, rate: "12%" },
    { item: "Layered outfits", count: 218, rate: "8%" },
    { item: "Dark accessories", count: 156, rate: "6%" },
    { item: "Transparent fabrics", count: 98, rate: "4%" },
  ],
};

export const adminPlansDataMock = {
  stats: {
    monthlyRevenue: "$38,016",
    payingUsers: 2288,
    avgRevenuePerUser: "$16.61",
    conversionRate: "34.8%",
  },
  plans: [
    { id: "pl1", name: "Free", price: "$0", users: 4280, revenue: "$0", credits: 10, status: "Active" },
    { id: "pl2", name: "Basic", price: "$9.99/mo", users: 1240, revenue: "$12,387", credits: 100, status: "Active" },
    { id: "pl3", name: "Pro", price: "$19.99/mo", users: 892, revenue: "$17,831", credits: 300, status: "Active" },
    { id: "pl4", name: "Unlimited", price: "$49.99/mo", users: 156, revenue: "$7,798", credits: -1, status: "Active" },
  ],
  transactions: [
    { id: "tx1", user: "Minh Anh", plan: "Pro", amount: "$19.99", method: "Visa ···· 4242", date: "2026-03-10", status: "Completed" },
    { id: "tx2", user: "Thanh Hà", plan: "Basic", amount: "$9.99", method: "MoMo", date: "2026-03-10", status: "Completed" },
    { id: "tx3", user: "Duc Phong", plan: "Unlimited", amount: "$49.99", method: "Bank Transfer", date: "2026-03-09", status: "Completed" },
    { id: "tx4", user: "Linh Chi", plan: "Basic", amount: "$9.99", method: "Visa ···· 1234", date: "2026-03-09", status: "Failed" },
    { id: "tx5", user: "Hoang Nam", plan: "Pro", amount: "$19.99", method: "Shopee Pay", date: "2026-03-08", status: "Completed" },
    { id: "tx6", user: "Bao Tran", plan: "Free", amount: "$0", method: "—", date: "2026-03-08", status: "Completed" },
    { id: "tx7", user: "Quoc Anh", plan: "Pro", amount: "$19.99", method: "Visa ···· 5678", date: "2026-03-07", status: "Completed" },
    { id: "tx8", user: "Mai Phuong", plan: "Basic", amount: "$9.99", method: "MoMo", date: "2026-03-07", status: "Failed" },
  ],
};

export const adminTrendsDataMock = {
  trends: [
    { id: "tr1", title: "Spring Pastel Revival", category: "Seasonal", season: "Spring 2026", status: "Published", date: "2026-03-01", growthPct: 42 },
    { id: "tr2", title: "Neo Minimalism", category: "Style", season: "All Year", status: "Published", date: "2026-02-15", growthPct: 38 },
    { id: "tr3", title: "Coastal Grandmother 2.0", category: "Lifestyle", season: "Summer 2026", status: "Draft", date: "2026-03-10", growthPct: null },
    { id: "tr4", title: "Tech-Wear Evolution", category: "Street", season: "Fall 2026", status: "Draft", date: "2026-03-08", growthPct: null },
    { id: "tr5", title: "Quiet Luxury Continues", category: "Premium", season: "All Year", status: "Published", date: "2026-01-20", growthPct: 55 },
    { id: "tr6", title: "Color Blocking Returns", category: "Color", season: "Spring 2026", status: "Published", date: "2026-02-28", growthPct: 31 },
    { id: "tr7", title: "Denim on Denim 2.0", category: "Style", season: "Summer 2026", status: "Published", date: "2026-03-05", growthPct: 27 },
    { id: "tr8", title: "Bold Accessories Trend", category: "Accessories", season: "Fall 2026", status: "Draft", date: "2026-03-12", growthPct: null },
  ],
  published: 5,
  drafts: 3,
};

export const adminAiDataMock = {
  stats: {
    modelsActive: "4/5",
    generationsToday: 12847,
    successRate: "97.3%",
    queueSize: 23,
  },
  models: [
    { id: "m1", name: "GPT-4o", provider: "OpenAI", task: "Outfit Generation", status: "Active", latency: "1.2s", quotaUsed: "85%" },
    { id: "m2", name: "Claude 3.5 Sonnet", provider: "Anthropic", task: "Stylist Prompt", status: "Active", latency: "1.8s", quotaUsed: "62%" },
    { id: "m3", name: "Gemini 2.0 Flash", provider: "Google", task: "Item Classification", status: "Active", latency: "0.9s", quotaUsed: "91%" },
    { id: "m4", name: "GPT-4o-mini", provider: "OpenAI", task: "Trend Summarization", status: "Active", latency: "0.7s", quotaUsed: "43%" },
    { id: "m5", name: "DALL·E 3", provider: "OpenAI", task: "Outfit Visualization", status: "Inactive", latency: "—", quotaUsed: "—" },
  ],
  templates: [
    { id: "t1", name: "Stylist Default v3", task: "Outfit Generation", version: 3, status: "Active", updated: "2026-03-10" },
    { id: "t2", name: "Item Classifier v2", task: "Classification", version: 2, status: "Active", updated: "2026-03-08" },
    { id: "t3", name: "Trend Analyst v1", task: "Trend Insights", version: 1, status: "Draft", updated: "2026-03-11" },
    { id: "t4", name: "Gap Analyzer v2", task: "Gap Analysis", version: 2, status: "Active", updated: "2026-03-05" },
    { id: "t5", name: "Tone Analyzer v1", task: "Style Description", version: 1, status: "Draft", updated: "2026-03-02" },
  ],
  jobs: [
    { id: "j1", user: "Minh Anh", type: "Outfit", prompt: "Date night outfit", status: "Success", time: "2 min ago" },
    { id: "j2", user: "Thanh Hà", type: "Classification", prompt: "Upload image", status: "Success", time: "5 min ago" },
    { id: "j3", user: "Duc Phong", type: "Outfit", prompt: "Office look", status: "Failed", time: "12 min ago" },
    { id: "j4", user: "Linh Chi", type: "Trend", prompt: "Summer 2026", status: "Success", time: "18 min ago" },
    { id: "j5", user: "Hoang Nam", type: "Outfit", prompt: "Streetwear", status: "Success", time: "25 min ago" },
    { id: "j6", user: "Mai Phuong", type: "Classification", prompt: "Upload image", status: "Failed", time: "30 min ago" },
    { id: "j7", user: "Quoc Anh", type: "Outfit", prompt: "Business casual", status: "Success", time: "40 min ago" },
    { id: "j8", user: "Kim Ngan", type: "Trend", prompt: "Fall 2026", status: "Success", time: "48 min ago" },
  ],
};

export { sampleOutfits };
