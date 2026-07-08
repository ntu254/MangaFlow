import { wardrobeItems } from "@/features/wardrobe/data";

import {
  sampleOutfits,
  dashboardStatsMock,
  seasonalTrendsMock,
  regionalTrendsMock,
  nextTrendsMock,
  personalizedTrendsMock,
  wardrobeMatchesMock,
  styleProfileMock,
  styleRecommendationsMock,
  wardrobeAnalysisMock,
  wardrobeOverviewMock,
  wardrobeSuggestionMock,
  wardrobeUploadAnalysisMock,
  adminUsersMock,
  adminUserDetailMock,
  adminAiDataMock,
  adminProductsDataMock,
  adminProductClicksMock,
  adminTrendsDataMock,
  adminPlansDataMock,
  adminAnalyticsDataMock,
  adminNotificationsDataMock,
  adminFeedbackDataMock,
  adminSettingsDataMock,
} from "./mock-fixtures";
import type { MockHandler } from "./types";

const allOutfits = sampleOutfits;

const matchPrompt = (prompt: string, outfits: typeof allOutfits) => {
  const keywords = prompt.toLowerCase();
  const matches = outfits.filter((o) => {
    const searchText = [
      o.title,
      o.style,
      ...o.styleTags,
      o.aiComment,
      o.occasion || "",
      o.mood || "",
      o.season || "",
      ...o.products.map((p) => p.name),
    ].join(" ").toLowerCase();
    return searchText.includes(keywords) ||
      keywords.split(" ").some((k) => k.length > 2 && searchText.includes(k));
  });
  return matches.length > 0 ? matches : outfits;
};

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

let items = [...wardrobeItems];
let mockProfile = { ...styleProfileMock } as typeof styleProfileMock & Record<string, unknown>;
let mockNotificationPreferences = {
  id: "notif-pref-1",
  user_id: "mock-user-1",
  trend_alerts: true,
  outfit_suggestions: true,
  promotions: false,
  subscription_reminders: true,
  push_enabled: true,
  email_enabled: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockHandlers: Record<string, MockHandler> = {
  "/api/auth/login": (options) => {
    const body = typeof options.json === "string"
      ? JSON.parse(options.json)
      : (options.json || {});
    return {
      user: { id: "mock-user-1", email: body.email || "demo@redo.ai" },
      token: "mock-user-token-12345",
    };
  },
  "/api/auth/signup": (options) => {
    const body = typeof options.json === "string"
      ? JSON.parse(options.json)
      : (options.json || {});
    mockProfile = {
      ...mockProfile,
      id: "mock-user-1",
      email: body.email || "demo@redo.ai",
      display_name: body.displayName || "Demo User",
    };
    return {
      user: { id: "mock-user-1", email: body.email || "demo@redo.ai" },
      token: "mock-user-token-12345",
    };
  },
  "/api/auth/logout": () => ({ success: true }),
  "/api/auth/password-reset": () => ({ success: true }),
  "/api/auth/update-password": () => ({ success: true }),
  "/api/auth/delete-account": () => ({ success: true }),
  "/api/auth/export-data": () => ({
    exportedAt: new Date().toISOString(),
    profile: mockProfile,
    wardrobeItems: items,
    outfits: allOutfits,
  }),
  "/api/wardrobe/items": () => items,
  "/api/wardrobe/overview": () => ({
    ...wardrobeOverviewMock,
    itemCount: items.length,
  }),
  "/api/wardrobe/suggestion": () => wardrobeSuggestionMock,
  "/api/wardrobe/upload-analysis": () => wardrobeUploadAnalysisMock,
  "/api/wardrobe/analysis": () => wardrobeAnalysisMock,
  "/api/wardrobe/items/": (options) => {
    const url = options.path || "";
    const idMatch = url.match(/\/api\/wardrobe\/items\/(\d+)/);
    if (!idMatch) return null;
    const id = parseInt(idMatch[1]);

    if (options.method === "DELETE" || options.method === "delete") {
      items = items.filter((i) => i.id !== id);
      return { success: true };
    }

    if (options.method === "PATCH" || options.method === "patch") {
      const body = typeof options.json === "string"
        ? JSON.parse(options.json)
        : (options.json || {});
      items = items.map((i) =>
        i.id === id ? { ...i, ...body } : i
      );
      return items.find((i) => i.id === id) || null;
    }

    return null;
  },
  "/api/admin/dashboard/stats": () => dashboardStatsMock,
  "/api/trends/seasonal": () => seasonalTrendsMock,
  "/api/trends/regional": () => regionalTrendsMock,
  "/api/trends/next": () => nextTrendsMock,
  "/api/trends/personalized": () => personalizedTrendsMock,
  "/api/trends/wardrobe-matches": () => wardrobeMatchesMock,
  "/api/profile": (options) => {
    if (options.method === "PATCH" || options.method === "patch") {
      const body = typeof options.json === "string"
        ? JSON.parse(options.json)
        : (options.json || {});
      mockProfile = { ...mockProfile, ...body, updated_at: new Date().toISOString() };
    }
    return mockProfile;
  },
  "/api/profile/style-preferences": (options) => {
    const body = typeof options.json === "string"
      ? JSON.parse(options.json)
      : (options.json || {});
    mockProfile = {
      ...mockProfile,
      style_dna: body.styleDna,
      favorite_colors: body.favoriteColors,
      updated_at: new Date().toISOString(),
    };
    return mockProfile;
  },
  "/api/profile/quiz-complete": (options) => {
    const body = typeof options.json === "string"
      ? JSON.parse(options.json)
      : (options.json || {});
    mockProfile = {
      ...mockProfile,
      style_dna: body.styleDna,
      avatar_url: body.avatarUrl || mockProfile.avatar_url,
      fashion_preferences: body.fashionPreferences
        ? { ...(mockProfile.fashion_preferences as Record<string, unknown>), ...body.fashionPreferences }
        : mockProfile.fashion_preferences,
      quiz_completed: true,
      updated_at: new Date().toISOString(),
    };
    return mockProfile;
  },
  "/api/profile/reset-personalization": () => {
    mockProfile = {
      ...mockProfile,
      style_dna: {},
      favorite_colors: [],
      preferred_styles: [],
      preferred_occasions: [],
      fashion_preferences: {},
      quiz_completed: false,
      updated_at: new Date().toISOString(),
    };
    return mockProfile;
  },
  "/api/profile/notification-preferences": (options) => {
    if (options.method === "PATCH" || options.method === "patch") {
      const body = typeof options.json === "string"
        ? JSON.parse(options.json)
        : (options.json || {});
      mockNotificationPreferences = {
        ...mockNotificationPreferences,
        ...body,
        updated_at: new Date().toISOString(),
      };
    }
    return mockNotificationPreferences;
  },
  "/api/profile/payments": () => [
    {
      id: "pay_mock_1",
      amount: 199000,
      currency: "VND",
      status: "completed",
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ],
  "/api/profile/invoices": () => [
    {
      id: "inv_mock_1",
      invoice_number: "INV-DEMO-001",
      amount: 199000,
      currency: "VND",
      status: "paid",
      pdf_url: null,
      created_at: new Date().toISOString(),
    },
  ],
  "/api/style-profile": () => styleProfileMock,
  "/api/style-profile/recommendations": () => styleRecommendationsMock,
  "/api/recommender/outfits": () => allOutfits,
  "/api/recommender/generate": (options) => {
    const body = typeof options.json === "string"
      ? JSON.parse(options.json)
      : (options.json || {});
    const prompt = (body?.prompt || "").trim();
    const delay = 800 + Math.random() * 700;

    return new Promise((resolve) => {
      setTimeout(() => {
        let results = prompt
          ? matchPrompt(prompt, allOutfits)
          : allOutfits;
        if (prompt === "refresh" || !prompt) {
          results = shuffle(allOutfits);
        }
        resolve(results);
      }, delay);
    });
  },
  "/api/recommender/converse": (options) => {
    const body = typeof options.json === "string"
      ? JSON.parse(options.json)
      : (options.json || {});
    const prompt = (body?.prompt || "").trim();
    const results = prompt ? matchPrompt(prompt, allOutfits).slice(0, 3) : allOutfits.slice(0, 3);
    const topStyle = results[0]?.style ?? "Casual";

    return {
      reply: prompt
        ? `Mình đã phân tích yêu cầu “${prompt}” và chọn ${results.length} outfit hợp với vibe ${topStyle}.`
        : "Mình đã chuẩn bị một vài outfit nổi bật để bạn bắt đầu.",
      outfits: results,
      suggestions: [
        { label: "Rẻ hơn", prompt: "Điều chỉnh outfit này dưới 500 nghìn" },
        { label: "Thanh lịch hơn", prompt: "Làm outfit này thanh lịch hơn" },
        { label: "Cá tính hơn", prompt: "Phối theo hướng cá tính hơn" },
      ],
    };
  },
  "/api/admin/auth/login": () => ({
    session: {
      id: "admin-001",
      userId: "user-admin-1",
      email: "admin@redo.ai",
      displayName: "Super Admin",
      roleId: "role-super",
      roleName: "super_admin",
      permissions: [
        { module: "dashboard", canRead: true, canWrite: true, canDelete: true },
        { module: "users", canRead: true, canWrite: true, canDelete: true },
        { module: "ai_engine", canRead: true, canWrite: true, canDelete: true },
        { module: "products", canRead: true, canWrite: true, canDelete: true },
        { module: "trends", canRead: true, canWrite: true, canDelete: true },
        { module: "plans", canRead: true, canWrite: true, canDelete: true },
        { module: "analytics", canRead: true, canWrite: true, canDelete: true },
        { module: "notifications", canRead: true, canWrite: true, canDelete: true },
        { module: "reports", canRead: true, canWrite: true, canDelete: true },
        { module: "settings", canRead: true, canWrite: true, canDelete: true },
      ],
    },
    token: "mock-admin-token-12345",
  }),
  "/api/admin/auth/logout": () => ({ success: true }),
  "/api/admin/products": () => adminProductsDataMock,
  "/api/admin/products/": (options) => {
    const url = options.path || "";
    const idMatch = url.match(/\/api\/admin\/products\/([^/]+)/);
    if (!idMatch) return null;
    const productId = idMatch[1];

    if (url.endsWith("/feature")) return { success: true };
    if (url.endsWith("/visibility")) return { success: true };
    if (url.endsWith("/clicks")) return adminProductClicksMock[productId] || [];
    return null;
  },
  "/api/admin/ai": () => adminAiDataMock,
  "/api/admin/ai/jobs/": (options) => {
    const url = options.path || "";
    if (url.endsWith("/retry")) return { success: true };
    return null;
  },
  "/api/admin/ai/models/": (options) => {
    const url = options.path || "";
    if (url.endsWith("/toggle")) return { success: true };
    return null;
  },
  "/api/admin/settings": () => adminSettingsDataMock,
  "/api/admin/settings/general": () => ({ success: true }),
  "/api/admin/settings/api": () => ({ success: true }),
  "/api/admin/feedback": () => adminFeedbackDataMock,
  "/api/admin/feedback/": () => ({ success: true }),
  "/api/admin/notifications": () => adminNotificationsDataMock,
  "/api/admin/notifications/broadcast": () => ({ success: true }),
  "/api/admin/notifications/settings": () => ({ success: true }),
  "/api/admin/analytics": () => adminAnalyticsDataMock,
  "/api/admin/plans": () => adminPlansDataMock,
  "/api/admin/plans/": () => ({ success: true }),
  "/api/admin/trends": () => adminTrendsDataMock,
  "/api/admin/trends/": (options) => {
    const url = options.path || "";
    if (url.endsWith("/toggle")) return { success: true };
    return { success: true };
  },
  "/api/admin/audit-log": () => ({ success: true }),
  "/api/admin/users": () => ({
    users: adminUsersMock,
    total: adminUsersMock.length,
    page: 1,
    page_size: adminUsersMock.length,
  }),
  "/api/admin/users/": (options) => {
    const url = options.path || "";
    const idMatch = url.match(/\/api\/admin\/users\/([^/]+)/);
    if (!idMatch) return null;
    const userId = idMatch[1];

    if (url.endsWith("/suspend")) {
      return { success: true };
    }
    if (url.endsWith("/unsuspend")) {
      return { success: true };
    }
    if (url.endsWith("/role")) {
      return { success: true };
    }

    return { ...adminUserDetailMock, profile: { ...adminUserDetailMock.profile, id: userId } };
  },
};
