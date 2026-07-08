-- ============================================================================
-- Enable row level security for application tables.
-- Scoped policies are defined in 00004_foundation_auth_profile_rls.sql.
-- ============================================================================

alter table if exists admin_roles enable row level security;
alter table if exists admin_users enable row level security;
alter table if exists admin_permissions enable row level security;
alter table if exists admin_audit_logs enable row level security;
alter table if exists profiles enable row level security;
alter table if exists plans enable row level security;
alter table if exists subscriptions enable row level security;
alter table if exists user_credits enable row level security;
alter table if exists credit_transactions enable row level security;
alter table if exists ai_models enable row level security;
alter table if exists ai_provider_configs enable row level security;
alter table if exists prompt_templates enable row level security;
alter table if exists ai_jobs enable row level security;
alter table if exists ai_generation_logs enable row level security;
alter table if exists product_categories enable row level security;
alter table if exists product_tags enable row level security;
alter table if exists product_sources enable row level security;
alter table if exists products enable row level security;
alter table if exists product_sync_logs enable row level security;
alter table if exists product_clicks enable row level security;
alter table if exists fashion_trends enable row level security;
alter table if exists trend_keywords enable row level security;
alter table if exists trend_colors enable row level security;
alter table if exists style_presets enable row level security;
alter table if exists trend_products enable row level security;
alter table if exists payments enable row level security;
alter table if exists billing_events enable row level security;
alter table if exists invoices enable row level security;
alter table if exists analytics_events enable row level security;
alter table if exists daily_user_metrics enable row level security;
alter table if exists daily_ai_metrics enable row level security;
alter table if exists daily_affiliate_metrics enable row level security;
alter table if exists daily_revenue_metrics enable row level security;
alter table if exists device_tokens enable row level security;
alter table if exists notifications enable row level security;
alter table if exists notification_logs enable row level security;
alter table if exists user_reports enable row level security;
alter table if exists report_actions enable row level security;
alter table if exists blocked_keywords enable row level security;
alter table if exists moderation_logs enable row level security;
alter table if exists content_safety_rules enable row level security;
alter table if exists system_settings enable row level security;
alter table if exists feature_flags enable row level security;
alter table if exists rate_limits enable row level security;
alter table if exists wardrobe_items enable row level security;
alter table if exists outfits enable row level security;
alter table if exists outfit_items enable row level security;
alter table if exists user_activity_log enable row level security;
