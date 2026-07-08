export interface Database {
  public: {
    Tables: {
      admin_roles: AdminRolesTable;
      admin_users: AdminUsersTable;
      admin_permissions: AdminPermissionsTable;
      admin_audit_logs: AdminAuditLogsTable;
      profiles: ProfilesTable;
      plans: PlansTable;
      subscriptions: SubscriptionsTable;
      user_credits: UserCreditsTable;
      credit_transactions: CreditTransactionsTable;
      ai_models: AiModelsTable;
      ai_provider_configs: AiProviderConfigsTable;
      prompt_templates: PromptTemplatesTable;
      ai_jobs: AiJobsTable;
      ai_generation_logs: AiGenerationLogsTable;
      product_categories: ProductCategoriesTable;
      product_tags: ProductTagsTable;
      product_sources: ProductSourcesTable;
      products: ProductsTable;
      product_sync_logs: ProductSyncLogsTable;
      product_clicks: ProductClicksTable;
      fashion_trends: FashionTrendsTable;
      trend_keywords: TrendKeywordsTable;
      trend_colors: TrendColorsTable;
      style_presets: StylePresetsTable;
      trend_products: TrendProductsTable;
      payments: PaymentsTable;
      billing_events: BillingEventsTable;
      invoices: InvoicesTable;
      analytics_events: AnalyticsEventsTable;
      daily_user_metrics: DailyUserMetricsTable;
      daily_ai_metrics: DailyAiMetricsTable;
      daily_affiliate_metrics: DailyAffiliateMetricsTable;
      daily_revenue_metrics: DailyRevenueMetricsTable;
      device_tokens: DeviceTokensTable;
      notifications: NotificationsTable;
      notification_logs: NotificationLogsTable;
      user_notification_preferences: UserNotificationPreferencesTable;
      user_reports: UserReportsTable;
      report_actions: ReportActionsTable;
      blocked_keywords: BlockedKeywordsTable;
      moderation_logs: ModerationLogsTable;
      content_safety_rules: ContentSafetyRulesTable;
      system_settings: SystemSettingsTable;
      feature_flags: FeatureFlagsTable;
      rate_limits: RateLimitsTable;
      wardrobe_items: WardrobeItemsTable;
      outfits: OutfitsTable;
      outfit_items: OutfitItemsTable;
      user_activity_log: UserActivityLogTable;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_admin_user: {
        Args: Record<string, never>;
        Returns: AdminUser[];
      };
      delete_my_account: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}

type Timestamp = string;
type Json = Record<string, unknown>;

interface TableDef<T> {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
}

// --- 1. Admin & Auth ---
export interface AdminRole {
  id: string; name: string; description: string | null; created_at: Timestamp;
}
type AdminRolesTable = TableDef<AdminRole>;

export interface AdminUser {
  id: string; user_id: string; role_id: string; is_active: boolean; created_at: Timestamp; updated_at: Timestamp;
}
type AdminUsersTable = TableDef<AdminUser>;

export interface AdminPermission {
  id: string; role_id: string; module: string; can_read: boolean; can_write: boolean; can_delete: boolean;
}
type AdminPermissionsTable = TableDef<AdminPermission>;

export interface AdminAuditLog {
  id: string; admin_id: string; action: string; entity_type: string | null; entity_id: string | null; details: Json | null; ip_address: string | null; created_at: Timestamp;
}
type AdminAuditLogsTable = TableDef<AdminAuditLog>;

// --- 2. Profiles ---
export interface Profile {
  id: string; email: string; display_name: string | null; avatar_url: string | null; style_dna: Json | null; favorite_colors: string[] | null; quiz_completed: boolean; is_banned: boolean; ban_reason: string | null; body_size: Json | null; preferred_styles: string[]; preferred_occasions: string[]; budget_min: number | null; budget_max: number | null; fashion_preferences: Json; two_factor_enabled: boolean; created_at: Timestamp; updated_at: Timestamp;
}
type ProfilesTable = TableDef<Profile>;

// --- 3. Plans ---
export interface Plan {
  id: string; name: string; slug: string; description: string | null; price_monthly: number; price_yearly: number; currency: string; ai_generations_limit: number; wardrobe_limit: number; saved_outfits_limit: number; credits_per_month: number; has_ai_analysis: boolean; has_affiliate_access: boolean; has_trend_insights: boolean; has_priority_support: boolean; trial_days: number; is_active: boolean; sort_order: number; created_at: Timestamp; updated_at: Timestamp;
}
type PlansTable = TableDef<Plan>;

export interface Subscription {
  id: string; user_id: string; plan_id: string; status: string; billing_cycle: string; current_period_start: Timestamp; current_period_end: Timestamp; trial_end: Timestamp | null; cancelled_at: Timestamp | null; created_at: Timestamp; updated_at: Timestamp;
}
type SubscriptionsTable = TableDef<Subscription>;

// --- 4. Credits ---
export interface UserCredit {
  id: string; user_id: string; balance: number; lifetime_earned: number; lifetime_spent: number; updated_at: Timestamp;
}
type UserCreditsTable = TableDef<UserCredit>;

export interface CreditTransaction {
  id: string; user_id: string; amount: number; type: string; reference_type: string | null; reference_id: string | null; description: string | null; created_at: Timestamp;
}
type CreditTransactionsTable = TableDef<CreditTransaction>;

// --- 5. AI Engine ---
export interface AiModel {
  id: string; name: string; provider: string; model_type: string; is_active: boolean; config: Json | null; created_at: Timestamp;
}
type AiModelsTable = TableDef<AiModel>;

export interface AiProviderConfig {
  id: string; provider: string; api_key_encrypted: string | null; base_url: string | null; default_model: string | null; rate_limit_rpm: number; is_active: boolean; created_at: Timestamp; updated_at: Timestamp;
}
type AiProviderConfigsTable = TableDef<AiProviderConfig>;

export interface PromptTemplate {
  id: string; name: string; slug: string; category: string; template: string; system_prompt: string | null; model_id: string | null; parameters: Json | null; is_active: boolean; version: number; created_at: Timestamp; updated_at: Timestamp;
}
type PromptTemplatesTable = TableDef<PromptTemplate>;

export interface AiJob {
  id: string; user_id: string | null; job_type: string; prompt: string | null; model_id: string | null; template_id: string | null; status: string; input_data: Json | null; output_data: Json | null; error_message: string | null; retry_count: number; max_retries: number; started_at: Timestamp | null; completed_at: Timestamp | null; created_at: Timestamp; updated_at: Timestamp;
}
type AiJobsTable = TableDef<AiJob>;

export interface AiGenerationLog {
  id: string; job_id: string | null; user_id: string | null; model_id: string | null; prompt_snapshot: string | null; response_snapshot: string | null; tokens_prompt: number | null; tokens_completion: number | null; latency_ms: number | null; confidence_score: number | null; success: boolean; error_message: string | null; created_at: Timestamp;
}
type AiGenerationLogsTable = TableDef<AiGenerationLog>;

// --- 6. Products ---
export interface ProductCategory {
  id: string; name: string; slug: string; sort_order: number;
}
type ProductCategoriesTable = TableDef<ProductCategory>;

export interface ProductTag {
  id: string; name: string;
}
type ProductTagsTable = TableDef<ProductTag>;

export interface ProductSource {
  id: string; platform: string; is_active: boolean; last_sync_at: Timestamp | null; sync_interval_mins: number; config: Json | null; created_at: Timestamp;
}
type ProductSourcesTable = TableDef<ProductSource>;

export interface Product {
  id: string; name: string; description: string | null; image_url: string | null; price: number | null; currency: string; category_id: string | null; source_id: string | null; source_product_id: string | null; affiliate_url: string | null; commission_rate: number | null; is_active: boolean; is_featured: boolean; is_hidden: boolean; link_status: string; metadata: Json | null; created_at: Timestamp; updated_at: Timestamp;
}
type ProductsTable = TableDef<Product>;

export interface ProductSyncLog {
  id: string; source_id: string; status: string; products_found: number; products_updated: number; products_added: number; error_message: string | null; started_at: Timestamp; completed_at: Timestamp | null;
}
type ProductSyncLogsTable = TableDef<ProductSyncLog>;

export interface ProductClick {
  id: string; product_id: string; user_id: string | null; source: string | null; platform: string | null; clicked_at: Timestamp;
}
type ProductClicksTable = TableDef<ProductClick>;

// --- 7. Trends ---
export interface FashionTrend {
  id: string; title: string; slug: string; description: string | null; image_url: string | null; category: string; season: string | null; year: number; growth_pct: number | null; is_published: boolean; is_featured: boolean; ai_summary: string | null; published_at: Timestamp | null; created_at: Timestamp; updated_at: Timestamp;
}
type FashionTrendsTable = TableDef<FashionTrend>;

export interface TrendKeyword {
  id: string; trend_id: string | null; keyword: string; search_volume: string; created_at: Timestamp;
}
type TrendKeywordsTable = TableDef<TrendKeyword>;

export interface TrendColor {
  id: string; trend_id: string | null; name: string; hex: string; description: string | null; stat: string | null; created_at: Timestamp;
}
type TrendColorsTable = TableDef<TrendColor>;

export interface StylePreset {
  id: string; name: string; slug: string; description: string | null; image_url: string | null; characteristics: string[] | null; is_active: boolean; sort_order: number; created_at: Timestamp; updated_at: Timestamp;
}
type StylePresetsTable = TableDef<StylePreset>;

export interface TrendProduct {
  id: string; trend_id: string; product_id: string; note: string | null; sort_order: number;
}
type TrendProductsTable = TableDef<TrendProduct>;

// --- 8. Payments ---
export interface Payment {
  id: string; user_id: string; subscription_id: string | null; amount: number; currency: string; status: string; payment_method: string | null; provider: string | null; provider_payment_id: string | null; refund_amount: number | null; refund_reason: string | null; paid_at: Timestamp | null; created_at: Timestamp; updated_at: Timestamp;
}
type PaymentsTable = TableDef<Payment>;

export interface BillingEvent {
  id: string; user_id: string | null; event_type: string; data: Json | null; created_at: Timestamp;
}
type BillingEventsTable = TableDef<BillingEvent>;

export interface Invoice {
  id: string; user_id: string; subscription_id: string | null; invoice_number: string; amount: number; currency: string; status: string; due_date: string | null; paid_at: Timestamp | null; pdf_url: string | null; created_at: Timestamp;
}
type InvoicesTable = TableDef<Invoice>;

// --- 9. Analytics ---
export interface AnalyticsEvent {
  id: string; event_type: string; user_id: string | null; session_id: string | null; data: Json | null; created_at: Timestamp;
}
type AnalyticsEventsTable = TableDef<AnalyticsEvent>;

export interface DailyUserMetric {
  id: string; date: string; total_users: number; new_users: number; active_users: number; dau_mau_ratio: number | null; retention_d1: number | null; retention_d7: number | null; retention_d30: number | null; created_at: Timestamp;
}
type DailyUserMetricsTable = TableDef<DailyUserMetric>;

export interface DailyAiMetric {
  id: string; date: string; total_generations: number; successful_generations: number; failed_generations: number; avg_latency_ms: number; avg_confidence: number | null; unique_users: number; created_at: Timestamp;
}
type DailyAiMetricsTable = TableDef<DailyAiMetric>;

export interface DailyAffiliateMetric {
  id: string; date: string; total_clicks: number; unique_users: number; top_platform: string | null; total_estimated_commission: number; created_at: Timestamp;
}
type DailyAffiliateMetricsTable = TableDef<DailyAffiliateMetric>;

export interface DailyRevenueMetric {
  id: string; date: string; gross_revenue: number; net_revenue: number; refunds: number; new_subscriptions: number; cancelled_subscriptions: number; mrr: number | null; arr: number | null; created_at: Timestamp;
}
type DailyRevenueMetricsTable = TableDef<DailyRevenueMetric>;

// --- 10. Notifications ---
export interface DeviceToken {
  id: string; user_id: string; token: string; platform: string; is_active: boolean; created_at: Timestamp; updated_at: Timestamp;
}
type DeviceTokensTable = TableDef<DeviceToken>;

export interface Notification {
  id: string; title: string; body: string; type: string; target_type: string; target_ids: string[] | null; image_url: string | null; action_url: string | null; scheduled_at: Timestamp | null; sent_at: Timestamp | null; created_by: string | null; created_at: Timestamp;
}
type NotificationsTable = TableDef<Notification>;

export interface NotificationLog {
  id: string; notification_id: string; user_id: string; channel: string; status: string; error_message: string | null; clicked_at: Timestamp | null; created_at: Timestamp;
}
type NotificationLogsTable = TableDef<NotificationLog>;

export interface UserNotificationPreference {
  id: string; user_id: string; trend_alerts: boolean; outfit_suggestions: boolean; promotions: boolean; subscription_reminders: boolean; push_enabled: boolean; email_enabled: boolean; created_at: Timestamp; updated_at: Timestamp;
}
type UserNotificationPreferencesTable = TableDef<UserNotificationPreference>;

// --- 11. Reports & Moderation ---
export interface UserReport {
  id: string; reporter_id: string; reported_id: string | null; report_type: string; entity_type: string | null; entity_id: string | null; reason: string; description: string | null; status: string; created_at: Timestamp;
}
type UserReportsTable = TableDef<UserReport>;

export interface ReportAction {
  id: string; report_id: string; admin_id: string | null; action: string; note: string | null; created_at: Timestamp;
}
type ReportActionsTable = TableDef<ReportAction>;

export interface BlockedKeyword {
  id: string; keyword: string; category: string | null; is_active: boolean; created_at: Timestamp;
}
type BlockedKeywordsTable = TableDef<BlockedKeyword>;

export interface ModerationLog {
  id: string; user_id: string | null; content_type: string; content_id: string | null; content_snippet: string | null; moderation_type: string; is_blocked: boolean; confidence: number | null; matched_keyword: string | null; created_at: Timestamp;
}
type ModerationLogsTable = TableDef<ModerationLog>;

export interface ContentSafetyRule {
  id: string; name: string; rule_type: string; pattern: string | null; action: string; is_active: boolean; created_at: Timestamp; updated_at: Timestamp;
}
type ContentSafetyRulesTable = TableDef<ContentSafetyRule>;

// --- 12. System ---
export interface SystemSetting {
  id: string; key: string; value: Json; description: string | null; updated_by: string | null; created_at: Timestamp; updated_at: Timestamp;
}
type SystemSettingsTable = TableDef<SystemSetting>;

export interface FeatureFlag {
  id: string; key: string; enabled: boolean; description: string | null; updated_by: string | null; created_at: Timestamp; updated_at: Timestamp;
}
type FeatureFlagsTable = TableDef<FeatureFlag>;

export interface RateLimit {
  id: string; endpoint: string; requests_per_minute: number; requests_per_hour: number; is_active: boolean; created_at: Timestamp; updated_at: Timestamp;
}
type RateLimitsTable = TableDef<RateLimit>;

// --- Users ---
export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  date: string;
  plan: string;
  status: string;
  credits_balance: number;
  is_banned: boolean;
  ai_generations: number;
  last_active: string | null;
  revenue: number;
  high_ai_usage: boolean;
  suspicious: boolean;
}

export interface UserSubscription {
  plan_name: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
}

export interface UserCreditInfo {
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  recent_transactions: {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    created_at: string;
  }[];
}

export interface UserAiUsage {
  total_jobs: number;
  successful: number;
  failed: number;
  avg_confidence: number | null;
  recent_jobs: {
    id: string;
    job_type: string;
    status: string;
    created_at: string;
  }[];
}

export interface UserDetail {
  profile: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    style_dna: Record<string, number> | null;
    favorite_colors: string[];
    quiz_completed: boolean;
    is_banned: boolean;
    ban_reason: string | null;
    created_at: string;
    updated_at: string;
  };
  subscription: UserSubscription | null;
  credits: UserCreditInfo;
  ai_usage: UserAiUsage;
}

export interface AdminUserFilters {
  status?: "all" | "active" | "inactive";
  plan?: "all" | "free" | "premium" | "pro";
  search?: string;
  page?: number;
  page_size?: number;
}

export interface AdminUsersResponse {
  users: AdminUserRow[];
  total: number;
  page: number;
  page_size: number;
}

// --- Settings ---
export interface AdminSettingToggle {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface AdminPlatformInfo {
  platformName: string;
  supportEmail: string;
}

export interface AdminApiIntegration {
  name: string;
  status: string;
}

export interface AdminRoleSetting {
  role: string;
  users: number;
  access: string;
}

export interface AdminSettingsData {
  onboardingToggles: AdminSettingToggle[];
  platformInfo: AdminPlatformInfo;
  styleCategories: string[];
  occasionCategories: string[];
  colorPalette: string[];
  notificationTemplates: string[];
  apiIntegrations: AdminApiIntegration[];
  roles: AdminRoleSetting[];
}

// --- Feedback ---
export interface AdminFeedbackReport {
  id: string;
  type: string;
  user: string;
  priority: string;
  status: string;
  date: string;
  detail: string;
}

export interface AdminFeedbackData {
  reports: AdminFeedbackReport[];
  total: number;
}

// --- Notifications ---
export interface AdminNotificationTemplate {
  id: string;
  name: string;
  channel: string;
  trigger: string;
  status: string;
}

export interface AdminChannelSetting {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface AdminNotificationsData {
  templates: AdminNotificationTemplate[];
  emailSettings: AdminChannelSetting[];
  pushSettings: AdminChannelSetting[];
}

export interface AdminBroadcastPayload {
  target: string;
  title: string;
  body: string;
}

// --- Analytics ---
export interface AdminAnalyticsStats {
  totalGenerations: string;
  detectionAccuracy: string;
  avgConfidence: string;
  topStyle: string;
  mostSaved: string;
  failedDetections: string;
}

export interface DailyGeneration {
  day: string;
  count: number;
}

export interface AccuracyPoint {
  month: string;
  rate: number;
}

export interface TopPrompt {
  prompt: string;
  count: number;
}

export interface FailedDetection {
  item: string;
  count: number;
  rate: string;
}

export interface AdminAnalyticsData {
  stats: AdminAnalyticsStats;
  dailyGenerations: DailyGeneration[];
  accuracyTrend: AccuracyPoint[];
  topPrompts: TopPrompt[];
  failedDetections: FailedDetection[];
}

// --- Plans & Billing ---
export interface AdminPlanRow {
  id: string;
  name: string;
  price: string;
  users: number;
  revenue: string;
  credits: number;
  status: string;
}

export interface AdminTransaction {
  id: string;
  user: string;
  plan: string;
  amount: string;
  method: string;
  date: string;
  status: string;
}

export interface AdminPlansStats {
  monthlyRevenue: string;
  payingUsers: number;
  avgRevenuePerUser: string;
  conversionRate: string;
}

export interface AdminPlansData {
  stats: AdminPlansStats;
  plans: AdminPlanRow[];
  transactions: AdminTransaction[];
}

// --- Trends ---
export interface AdminTrendRow {
  id: string;
  title: string;
  category: string;
  season: string;
  status: string;
  date: string;
  growthPct: number | null;
}

export interface AdminTrendCreate {
  title: string;
  category: string;
  season: string;
  description?: string;
  growthPct?: number;
}

export interface AdminTrendsData {
  trends: AdminTrendRow[];
  published: number;
  drafts: number;
}

// --- Products ---
export interface AdminProductRow {
  id: string;
  title: string;
  platform: string;
  category: string;
  affiliate: string;
  linkHealth: string;
  featured: boolean;
  clicks: number;
  commission: number;
  image_url: string | null;
}

export interface AdminProductStats {
  totalProducts: number;
  activeAffiliates: number;
  brokenLinks: number;
  totalClicks: number;
}

export interface AdminProductsData {
  stats: AdminProductStats;
  products: AdminProductRow[];
}

export interface AdminProductClick {
  id: string;
  user: string;
  platform: string;
  clicked_at: string;
  source: string;
}

// --- AI Engine ---
export interface AdminAiStats {
  modelsActive: string;
  generationsToday: number;
  successRate: string;
  queueSize: number;
  failedJobs: number;
  avgLatency: string;
  aiCostToday: number;
}

export interface AdminAiModel {
  id: string;
  name: string;
  provider: string;
  task: string;
  status: string;
  latency: string;
  quotaUsed: string;
  tokens: string;
  mode: string;
  requests: number;
  cost: number;
}

export interface AdminPromptTemplate {
  id: string;
  name: string;
  task: string;
  version: number;
  status: string;
  updated: string;
  linkedModel: string;
  trafficPct: number;
}

export interface AdminAiJob {
  id: string;
  user: string;
  type: string;
  prompt: string;
  status: string;
  time: string;
  model: string;
  duration: string;
  cost: number;
  retryCount: number;
}

export interface QueueHealthItem {
  queue: string;
  waiting: number;
  running: number;
  failed: number;
}

export interface ProviderHealthItem {
  provider: string;
  status: string;
  errorRate: string;
  rateLimit: string;
}

export interface AdminAiData {
  stats: AdminAiStats;
  models: AdminAiModel[];
  templates: AdminPromptTemplate[];
  jobs: AdminAiJob[];
  queues: QueueHealthItem[];
  providers: ProviderHealthItem[];
}

// --- Dashboard ---
// --- 14. Wardrobe, Outfits & Activity ---
export interface WardrobeItem {
  id: string; user_id: string; name: string; category_id: string | null;
  style_preset_id: string | null; image_url: string | null; color: string | null;
  brand: string | null; is_favorite: boolean; created_at: Timestamp; updated_at: Timestamp;
}
type WardrobeItemsTable = TableDef<WardrobeItem>;

export interface Outfit {
  id: string; user_id: string; name: string | null; style_preset_id: string | null;
  image_url: string | null; source: string; is_saved: boolean; is_public: boolean;
  created_at: Timestamp; updated_at: Timestamp;
}
type OutfitsTable = TableDef<Outfit>;

export interface OutfitItem {
  id: string; outfit_id: string; wardrobe_item_id: string; sort_order: number;
}
type OutfitItemsTable = TableDef<OutfitItem>;

export interface UserActivityLog {
  id: string; user_id: string; activity_type: string; description: string;
  metadata: Json | null; created_at: Timestamp;
}
type UserActivityLogTable = TableDef<UserActivityLog>;

export interface DashboardStats {
  totalUsers: number;
  activeToday: number;
  outfitsGenerated: number;
  wardrobeUploads: number;
  savedOutfits: number;
  affiliateClicks: number;
  userGrowth: { month: string; users: number }[];
  outfitCategories: { name: string; value: number; color: string }[];
  topStyles: { style: string; count: number }[];
  recentActivity: { user: string; action: string; time: string }[];
}
