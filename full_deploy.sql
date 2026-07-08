-- ============================================================================
-- Redo AI Virtual Stylist — Full Database Schema
-- ============================================================================

-- 0. Extensions
-- ============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. Admin & Auth
-- ============================================================================
create table admin_roles (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique, -- 'super_admin', 'admin', 'moderator', 'finance'
  description text,
  created_at  timestamptz not null default now()
);

create table admin_users (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  role_id     uuid not null references admin_roles(id),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table admin_permissions (
  id          uuid primary key default uuid_generate_v4(),
  role_id     uuid not null references admin_roles(id) on delete cascade,
  module      text not null, -- 'dashboard','users','ai_engine','products','trends','plans','analytics','notifications','reports','settings'
  can_read    boolean not null default true,
  can_write   boolean not null default false,
  can_delete  boolean not null default false,
  unique(role_id, module)
);

create table admin_audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  admin_id    uuid not null references admin_users(id),
  action      text not null, -- 'login','user_suspend','plan_update','product_sync','ai_retry', etc.
  entity_type text,         -- 'user','plan','product','trend','job', etc.
  entity_id   text,
  details     jsonb,
  ip_address  text,
  created_at  timestamptz not null default now()
);

-- 2. User Profiles (extends auth.users)
-- ============================================================================
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  display_name    text,
  avatar_url      text,
  style_dna       jsonb,            -- { minimal: 70, streetwear: 15, ... }
  favorite_colors text[],           -- ['white','beige','black']
  quiz_completed  boolean not null default false,
  is_banned       boolean not null default false,
  ban_reason      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 3. Plans & Subscriptions
-- ============================================================================
create table plans (
  id                 uuid primary key default uuid_generate_v4(),
  name               text not null,           -- 'Free','Starter','Pro','Unlimited'
  slug               text not null unique,
  description        text,
  price_monthly      numeric(10,2) not null default 0,
  price_yearly       numeric(10,2) not null default 0,
  currency           text not null default 'VND',
  ai_generations_limit    int not null default 0,    -- 0 = unlimited
  wardrobe_limit          int not null default 50,
  saved_outfits_limit     int not null default 20,
  credits_per_month       int not null default 0,
  has_ai_analysis         boolean not null default false,
  has_affiliate_access    boolean not null default false,
  has_trend_insights      boolean not null default false,
  has_priority_support    boolean not null default false,
  trial_days              int not null default 0,
  is_active               boolean not null default true,
  sort_order              int not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create table subscriptions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  plan_id         uuid not null references plans(id),
  status          text not null default 'active', -- 'active','cancelled','past_due','expired','trialing'
  billing_cycle   text not null default 'monthly', -- 'monthly','yearly'
  current_period_start timestamptz not null default now(),
  current_period_end   timestamptz not null,
  trial_end       timestamptz,
  cancelled_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 4. Credits
-- ============================================================================
create table user_credits (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  balance         int not null default 0,
  lifetime_earned int not null default 0,
  lifetime_spent  int not null default 0,
  updated_at      timestamptz not null default now()
);

create table credit_transactions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  amount          int not null,               -- positive = earned, negative = spent
  type            text not null,              -- 'purchase','subscription','bonus','refund','generation','try_on'
  reference_type  text,                        -- 'subscription','ai_job','payment'
  reference_id    text,
  description     text,
  created_at      timestamptz not null default now()
);

-- 5. AI Engine
-- ============================================================================
create table ai_models (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,              -- 'gpt-4o','claude-3','stable-diffusion-xl', etc.
  provider        text not null,              -- 'openai','anthropic','stability','replicate'
  model_type      text not null,              -- 'generation','analysis','moderation'
  is_active       boolean not null default true,
  config          jsonb,                       -- model-specific params
  created_at      timestamptz not null default now()
);

create table ai_provider_configs (
  id              uuid primary key default uuid_generate_v4(),
  provider        text not null unique,        -- 'openai','anthropic','stability'
  api_key_encrypted text,
  base_url        text,
  default_model   text,
  rate_limit_rpm  int not null default 60,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table prompt_templates (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text not null unique,
  category        text not null,              -- 'outfit_generation','style_analysis','trend_analysis'
  template        text not null,              -- prompt with {{placeholders}}
  system_prompt   text,
  model_id        uuid references ai_models(id),
  parameters      jsonb,                       -- temperature, max_tokens, etc.
  is_active       boolean not null default true,
  version         int not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table ai_jobs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete set null,
  job_type        text not null,              -- 'generate_outfit','analyze_wardrobe','trend_analysis','style_fit_check'
  prompt          text,
  model_id        uuid references ai_models(id),
  template_id     uuid references prompt_templates(id),
  status          text not null default 'pending', -- 'pending','processing','completed','failed','cancelled'
  input_data      jsonb,
  output_data     jsonb,
  error_message   text,
  retry_count     int not null default 0,
  max_retries     int not null default 3,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table ai_generation_logs (
  id              uuid primary key default uuid_generate_v4(),
  job_id          uuid references ai_jobs(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  model_id        uuid references ai_models(id),
  prompt_snapshot text,
  response_snapshot text,
  tokens_prompt   int,
  tokens_completion int,
  latency_ms      int,
  confidence_score numeric(5,2),
  success         boolean not null default true,
  error_message   text,
  created_at      timestamptz not null default now()
);

-- 6. Products & Affiliate
-- ============================================================================
create table product_categories (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null unique,        -- 'Tops','Bottoms','Shoes','Outerwear','Accessories','Dresses'
  slug            text not null unique,
  sort_order      int not null default 0
);

create table product_tags (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null unique         -- 'casual','minimal','streetwear','office','party'
);

create table product_sources (
  id              uuid primary key default uuid_generate_v4(),
  platform        text not null,               -- 'shopee','lazada','tiki','zalora','tiktok_shop'
  is_active       boolean not null default true,
  last_sync_at    timestamptz,
  sync_interval_mins int not null default 1440, -- 24h
  config          jsonb,                        -- API keys, endpoints, etc.
  created_at      timestamptz not null default now()
);

create table products (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  image_url       text,
  price           numeric(12,2),
  currency        text not null default 'VND',
  category_id     uuid references product_categories(id),
  source_id       uuid references product_sources(id),
  source_product_id text,                       -- ID on the source platform
  affiliate_url   text,
  commission_rate numeric(5,2),                 -- e.g. 8.50 = 8.5%
  is_active       boolean not null default true,
  is_featured     boolean not null default false,
  is_hidden       boolean not null default false,
  link_status     text not null default 'healthy', -- 'healthy','broken','pending'
  metadata        jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table product_sync_logs (
  id              uuid primary key default uuid_generate_v4(),
  source_id       uuid references product_sources(id) on delete cascade,
  status          text not null,               -- 'running','completed','failed'
  products_found  int not null default 0,
  products_updated int not null default 0,
  products_added  int not null default 0,
  error_message   text,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create table product_clicks (
  id              uuid primary key default uuid_generate_v4(),
  product_id      uuid not null references products(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  source          text,                        -- 'recommender','trends','wardrobe'
  platform        text,
  clicked_at      timestamptz not null default now()
);

-- 7. Trends & Content
-- ============================================================================
create table fashion_trends (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  slug            text not null unique,
  description     text,
  image_url       text,
  category        text not null,               -- 'seasonal','style','color','premium','street','lifestyle'
  season          text,                        -- 'spring','summer','fall','winter','all_year'
  year            int not null default 2026,
  growth_pct      numeric(5,1),                -- popularity growth percentage
  is_published    boolean not null default false,
  is_featured     boolean not null default false,
  ai_summary      text,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table trend_keywords (
  id              uuid primary key default uuid_generate_v4(),
  trend_id        uuid references fashion_trends(id) on delete cascade,
  keyword         text not null,
  search_volume   text not null default 'medium', -- 'high','medium','low'
  created_at      timestamptz not null default now()
);

create table trend_colors (
  id              uuid primary key default uuid_generate_v4(),
  trend_id        uuid references fashion_trends(id) on delete set null,
  name            text not null,
  hex             text not null,
  description     text,
  stat            text,                        -- 'Xuất hiện trong 38% BST hè 2026'
  created_at      timestamptz not null default now()
);

create table style_presets (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text not null unique,
  description     text,
  image_url       text,
  characteristics text[],                      -- ['tối giản','trung tính','đường cắt sạch']
  is_active       boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table trend_products (
  id              uuid primary key default uuid_generate_v4(),
  trend_id        uuid references fashion_trends(id) on delete cascade,
  product_id      uuid references products(id) on delete cascade,
  note            text,
  sort_order      int not null default 0,
  unique(trend_id, product_id)
);

-- 8. Billing & Payments
-- ============================================================================
create table payments (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  amount          numeric(12,2) not null,
  currency        text not null default 'VND',
  status          text not null default 'pending', -- 'pending','completed','failed','refunded'
  payment_method  text,                        -- 'card','wallet','bank_transfer'
  provider        text,                        -- 'stripe','vnpay','momo'
  provider_payment_id text,
  refund_amount   numeric(12,2),
  refund_reason   text,
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table billing_events (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade,
  event_type      text not null,               -- 'payment_success','payment_failed','subscription_created','subscription_cancelled','refund'
  data            jsonb,
  created_at      timestamptz not null default now()
);

create table invoices (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  invoice_number  text not null unique,
  amount          numeric(12,2) not null,
  currency        text not null default 'VND',
  status          text not null default 'pending', -- 'pending','paid','overdue','cancelled','refunded'
  due_date        date,
  paid_at         timestamptz,
  pdf_url         text,
  created_at      timestamptz not null default now()
);

-- 9. Analytics
-- ============================================================================
create table analytics_events (
  id              uuid primary key default uuid_generate_v4(),
  event_type      text not null,               -- 'page_view','outfit_generate','affiliate_click','wardrobe_upload','save_outfit','search','quiz_complete'
  user_id         uuid references auth.users(id) on delete set null,
  session_id      text,
  data            jsonb,
  created_at      timestamptz not null default now()
);

create table daily_user_metrics (
  id              uuid primary key default uuid_generate_v4(),
  date            date not null unique,
  total_users     int not null default 0,
  new_users       int not null default 0,
  active_users    int not null default 0,
  dau_mau_ratio   numeric(5,2),                -- DAU/MAU
  retention_d1    numeric(5,2),
  retention_d7    numeric(5,2),
  retention_d30   numeric(5,2),
  created_at      timestamptz not null default now()
);

create table daily_ai_metrics (
  id              uuid primary key default uuid_generate_v4(),
  date            date not null unique,
  total_generations   int not null default 0,
  successful_generations int not null default 0,
  failed_generations   int not null default 0,
  avg_latency_ms      int not null default 0,
  avg_confidence      numeric(5,2),
  unique_users        int not null default 0,
  created_at          timestamptz not null default now()
);

create table daily_affiliate_metrics (
  id              uuid primary key default uuid_generate_v4(),
  date            date not null unique,
  total_clicks    int not null default 0,
  unique_users    int not null default 0,
  top_platform    text,
  total_estimated_commission numeric(12,2) default 0,
  created_at      timestamptz not null default now()
);

create table daily_revenue_metrics (
  id              uuid primary key default uuid_generate_v4(),
  date            date not null unique,
  gross_revenue   numeric(12,2) not null default 0,
  net_revenue     numeric(12,2) not null default 0,
  refunds         numeric(12,2) not null default 0,
  new_subscriptions  int not null default 0,
  cancelled_subscriptions int not null default 0,
  mrr             numeric(12,2) default 0,
  arr             numeric(12,2) default 0,
  created_at      timestamptz not null default now()
);

-- 10. Notifications
-- ============================================================================
create table device_tokens (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  token           text not null,
  platform        text not null,               -- 'ios','android','web'
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, token)
);

create table notifications (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  body            text not null,
  type            text not null,               -- 'promo','trend_alert','plan_reminder','system','daily_trend'
  target_type     text not null default 'all', -- 'all','role','specific_users','segment'
  target_ids      uuid[],                      -- user IDs if target_type = 'specific_users'
  image_url       text,
  action_url      text,
  scheduled_at    timestamptz,
  sent_at         timestamptz,
  created_by      uuid references admin_users(id),
  created_at      timestamptz not null default now()
);

create table notification_logs (
  id              uuid primary key default uuid_generate_v4(),
  notification_id uuid not null references notifications(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  channel         text not null,               -- 'push','in_app','email'
  status          text not null default 'sent', -- 'sent','delivered','failed','clicked'
  error_message   text,
  clicked_at      timestamptz,
  created_at      timestamptz not null default now()
);

-- 11. Reports & Moderation
-- ============================================================================
create table user_reports (
  id              uuid primary key default uuid_generate_v4(),
  reporter_id     uuid not null references auth.users(id) on delete cascade,
  reported_id     uuid references auth.users(id) on delete cascade,
  report_type     text not null,               -- 'user','outfit','item','content'
  entity_type     text,                        -- 'outfit','wardrobe_item','comment'
  entity_id       text,
  reason          text not null,
  description     text,
  status          text not null default 'pending', -- 'pending','resolved','rejected'
  created_at      timestamptz not null default now()
);

create table report_actions (
  id              uuid primary key default uuid_generate_v4(),
  report_id       uuid not null references user_reports(id) on delete cascade,
  admin_id        uuid references admin_users(id),
  action          text not null,               -- 'resolve','reject','ban_user','remove_content'
  note            text,
  created_at      timestamptz not null default now()
);

create table blocked_keywords (
  id              uuid primary key default uuid_generate_v4(),
  keyword         text not null unique,
  category        text,                        -- 'nsfw','spam','unsafe'
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table moderation_logs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete set null,
  content_type    text not null,               -- 'prompt','outfit','wardrobe_item','profile'
  content_id      text,
  content_snippet text,
  moderation_type text not null,               -- 'keyword_block','nsfw_detect','ai_safety'
  is_blocked      boolean not null default false,
  confidence      numeric(5,2),
  matched_keyword text,
  created_at      timestamptz not null default now()
);

create table content_safety_rules (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  rule_type       text not null,               -- 'keyword','pattern','threshold'
  pattern         text,
  action          text not null default 'block', -- 'block','flag','review'
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 12. System Settings
-- ============================================================================
create table system_settings (
  id              uuid primary key default uuid_generate_v4(),
  key             text not null unique,
  value           jsonb not null,
  description     text,
  updated_by      uuid references admin_users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table feature_flags (
  id              uuid primary key default uuid_generate_v4(),
  key             text not null unique,
  enabled         boolean not null default false,
  description     text,
  updated_by      uuid references admin_users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table rate_limits (
  id              uuid primary key default uuid_generate_v4(),
  endpoint        text not null unique,
  requests_per_minute int not null default 60,
  requests_per_hour   int not null default 1000,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================
create index idx_admin_audit_logs_admin on admin_audit_logs(admin_id, created_at desc);
create index idx_admin_audit_logs_action on admin_audit_logs(action);
create index idx_profiles_email on profiles(email);
create index idx_subscriptions_user on subscriptions(user_id);
create index idx_subscriptions_status on subscriptions(status);
create index idx_user_credits_user on user_credits(user_id);
create index idx_credit_tx_user on credit_transactions(user_id, created_at desc);
create index idx_credit_tx_type on credit_transactions(type);
create index idx_ai_jobs_status on ai_jobs(status);
create index idx_ai_jobs_user on ai_jobs(user_id);
create index idx_ai_jobs_type on ai_jobs(job_type);
create index idx_ai_jobs_created on ai_jobs(created_at desc);
create index idx_ai_generation_logs_job on ai_generation_logs(job_id);
create index idx_ai_generation_logs_user on ai_generation_logs(user_id, created_at desc);
create index idx_products_category on products(category_id);
create index idx_products_source on products(source_id);
create index idx_products_active on products(is_active);
create index idx_products_featured on products(is_featured) where is_featured = true;
create index idx_product_clicks_product on product_clicks(product_id);
create index idx_product_clicks_date on product_clicks(clicked_at);
create index idx_fashion_trends_published on fashion_trends(is_published, created_at desc);
create index idx_fashion_trends_season on fashion_trends(season, year);
create index idx_trend_keywords_keyword on trend_keywords(keyword);
create index idx_payments_user on payments(user_id);
create index idx_payments_status on payments(status);
create index idx_payments_date on payments(paid_at);
create index idx_invoices_user on invoices(user_id);
create index idx_analytics_events_type on analytics_events(event_type, created_at desc);
create index idx_analytics_events_date on analytics_events(created_at);
create index idx_daily_user_metrics_date on daily_user_metrics(date desc);
create index idx_daily_ai_metrics_date on daily_ai_metrics(date desc);
create index idx_daily_affiliate_metrics_date on daily_affiliate_metrics(date desc);
create index idx_daily_revenue_metrics_date on daily_revenue_metrics(date desc);
create index idx_user_reports_status on user_reports(status);
create index idx_user_reports_reporter on user_reports(reporter_id);
create index idx_moderation_logs_type on moderation_logs(moderation_type);
create index idx_moderation_logs_created on moderation_logs(created_at desc);
create index idx_notification_logs_user on notification_logs(user_id, created_at desc);
create index idx_notification_logs_notif on notification_logs(notification_id);

-- ============================================================================
-- Seed Data
-- ============================================================================
insert into admin_roles (name, description) values
  ('super_admin', 'Full system access — all modules, all actions'),
  ('admin',       'Operational access — can manage users, content, settings'),
  ('moderator',   'Content moderation only — reports, trends, products'),
  ('finance',     'Financial access — plans, payments, invoices, revenue analytics');

insert into admin_permissions (role_id, module, can_read, can_write, can_delete)
select r.id, m.module, true,
  case when r.name in ('super_admin','admin') then true
       when r.name = 'finance' and m.module in ('plans','analytics') then true
       else false end,
  case when r.name = 'super_admin' then true else false end
from admin_roles r
cross join (
  values ('dashboard'),('users'),('ai_engine'),('products'),('trends'),
         ('plans'),('analytics'),('notifications'),('reports'),('settings')
) as m(module);

insert into plans (name, slug, description, price_monthly, price_yearly, ai_generations_limit, wardrobe_limit, saved_outfits_limit, credits_per_month, has_ai_analysis, has_affiliate_access, has_trend_insights, has_priority_support, trial_days, sort_order) values
  ('Free',       'free',       'Try Redo with basic features',           0,      0,      10,  20, 10,  0,  false, true,  false, false, 0, 1),
  ('Starter',    'starter',    'For casual fashion explorers',          99000,  990000, 100, 100, 50,  50, true,  true,  true,  false, 7, 2),
  ('Pro',        'pro',        'For fashion enthusiasts',              199000, 1990000, 500, 500, 200, 200, true,  true,  true,  false, 0, 3),
  ('Unlimited',  'unlimited',  'For power users and stylists',          399000, 3990000, 0,   0,   0,   500, true,  true,  true,  true,  0, 4);

insert into content_safety_rules (name, rule_type, pattern, action) values
  ('NSFW keyword block',  'keyword', 'nsfw,explicit,adult,porn',       'block'),
  ('Hate speech filter',  'keyword', 'hate,discrimination,offensive', 'block'),
  ('Spam detection',      'keyword', 'spam,casino,earn money fast',    'block');

insert into blocked_keywords (keyword, category) values
  ('nsfw',         'nsfw'),
  ('explicit',     'nsfw'),
  ('porn',         'nsfw'),
  ('hate',         'unsafe'),
  ('discrimination','unsafe');

insert into feature_flags (key, enabled, description) values
  ('ai_generation',       true,  'Enable AI outfit generation'),
  ('affiliate_links',     true,  'Show affiliate purchase buttons'),
  ('trend_insights',      true,  'Show trend analysis features'),
  ('wardrobe_ai_scan',    true,  'Enable AI wardrobe item detection'),
  ('maintenance_mode',    false, 'Put site in maintenance mode'),
  ('social_login',        false, 'Enable Google/Facebook login');

insert into system_settings (key, value, description) values
  ('app_name',          '"Redo"',                      'Application display name'),
  ('app_description',   '"AI Virtual Stylist"',         'Application description'),
  ('default_currency',  '"VND"',                       'Default currency for pricing'),
  ('max_file_size_mb',  '10',                           'Maximum upload file size in MB'),
  ('allowed_image_types', '["jpg","jpeg","png","webp"]', 'Allowed image upload formats'),
  ('trial_credits',     '20',                           'Free credits given on signup'),
  ('referral_credits',  '10',                           'Credits given for referral'),
  ('support_email',     '"support@redo.ai"',             'Customer support email');
-- ============================================================================
-- Redo AI Virtual Stylist — Wardrobe, Outfits & Activity Tables
-- Provides real data for dashboard metrics: wardrobeUploads, savedOutfits,
-- outfitCategories, topStyles, recentActivity
-- ============================================================================

-- 1. Wardrobe Items
-- ============================================================================
create table wardrobe_items (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  category_id     uuid references product_categories(id),
  style_preset_id uuid references style_presets(id),
  image_url       text,
  color           text,
  brand           text,
  is_favorite     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_wardrobe_items_user on wardrobe_items(user_id);
create index idx_wardrobe_items_fav on wardrobe_items(user_id, is_favorite) where is_favorite = true;

-- 2. Outfits (AI-generated or user-created)
-- ============================================================================
create table outfits (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text,
  style_preset_id uuid references style_presets(id),
  image_url       text,
  source          text not null default 'ai',      -- 'ai','user','trend'
  is_saved        boolean not null default false,
  is_public       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_outfits_user on outfits(user_id, created_at desc);
create index idx_outfits_saved on outfits(user_id) where is_saved = true;
create index idx_outfits_style on outfits(style_preset_id);

-- 3. Outfit Items (junction: outfit → wardrobe items)
-- ============================================================================
create table outfit_items (
  id              uuid primary key default uuid_generate_v4(),
  outfit_id       uuid not null references outfits(id) on delete cascade,
  wardrobe_item_id uuid not null references wardrobe_items(id) on delete cascade,
  sort_order      int not null default 0,
  unique(outfit_id, wardrobe_item_id)
);

-- 4. User Activity Log (for dashboard recent activity feed)
-- ============================================================================
create table user_activity_log (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  activity_type   text not null,                   -- 'outfit_created','outfit_saved','wardrobe_upload','subscription_change','quiz_complete','trend_view'
  description     text not null,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

create index idx_user_activity_log_user on user_activity_log(user_id, created_at desc);
create index idx_user_activity_log_type on user_activity_log(activity_type);
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
-- ============================================================================
-- Foundation hardening: auth helpers, profile preferences, storage, and RLS
-- ============================================================================

-- 1. Profile/account fields used by the user profile screens
alter table if exists profiles
  add column if not exists body_size jsonb,
  add column if not exists preferred_styles text[] not null default '{}',
  add column if not exists preferred_occasions text[] not null default '{}',
  add column if not exists budget_min numeric(12,2),
  add column if not exists budget_max numeric(12,2),
  add column if not exists fashion_preferences jsonb not null default '{}'::jsonb,
  add column if not exists two_factor_enabled boolean not null default false;

create table if not exists user_notification_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  trend_alerts boolean not null default true,
  outfit_suggestions boolean not null default true,
  promotions boolean not null default false,
  subscription_reminders boolean not null default true,
  push_enabled boolean not null default true,
  email_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notification_preferences_user
  on user_notification_preferences(user_id);

-- 2. Storage bucket for public avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 3. Auth/admin helpers referenced by client services and RLS
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  );
$$;

drop function if exists public.is_admin_user();

create or replace function public.is_admin_user()
returns table (
  id uuid,
  user_id uuid,
  role_id uuid,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select au.id, au.user_id, au.role_id, au.is_active, au.created_at, au.updated_at
  from public.admin_users au
  where au.user_id = auth.uid()
    and au.is_active = true;
$$;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin_user() from public;
revoke all on function public.delete_my_account() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin_user() to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- 4. Remove MVP-wide permissive policies from 00003 and replace with scoped rules
drop policy if exists "rls_authenticated_all_admin_roles" on admin_roles;
drop policy if exists "rls_authenticated_all_admin_users" on admin_users;
drop policy if exists "rls_authenticated_all_admin_permissions" on admin_permissions;
drop policy if exists "rls_authenticated_all_admin_audit_logs" on admin_audit_logs;
drop policy if exists "rls_authenticated_all_profiles" on profiles;
drop policy if exists "rls_authenticated_all_plans" on plans;
drop policy if exists "rls_authenticated_all_subscriptions" on subscriptions;
drop policy if exists "rls_authenticated_all_user_credits" on user_credits;
drop policy if exists "rls_authenticated_all_credit_transactions" on credit_transactions;
drop policy if exists "rls_authenticated_all_ai_models" on ai_models;
drop policy if exists "rls_authenticated_all_ai_provider_configs" on ai_provider_configs;
drop policy if exists "rls_authenticated_all_prompt_templates" on prompt_templates;
drop policy if exists "rls_authenticated_all_ai_jobs" on ai_jobs;
drop policy if exists "rls_authenticated_all_ai_generation_logs" on ai_generation_logs;
drop policy if exists "rls_authenticated_all_product_categories" on product_categories;
drop policy if exists "rls_authenticated_all_product_tags" on product_tags;
drop policy if exists "rls_authenticated_all_product_sources" on product_sources;
drop policy if exists "rls_authenticated_all_products" on products;
drop policy if exists "rls_authenticated_all_product_sync_logs" on product_sync_logs;
drop policy if exists "rls_authenticated_all_product_clicks" on product_clicks;
drop policy if exists "rls_authenticated_all_fashion_trends" on fashion_trends;
drop policy if exists "rls_authenticated_all_trend_keywords" on trend_keywords;
drop policy if exists "rls_authenticated_all_trend_colors" on trend_colors;
drop policy if exists "rls_authenticated_all_style_presets" on style_presets;
drop policy if exists "rls_authenticated_all_trend_products" on trend_products;
drop policy if exists "rls_authenticated_all_payments" on payments;
drop policy if exists "rls_authenticated_all_billing_events" on billing_events;
drop policy if exists "rls_authenticated_all_invoices" on invoices;
drop policy if exists "rls_authenticated_all_analytics_events" on analytics_events;
drop policy if exists "rls_authenticated_all_daily_user_metrics" on daily_user_metrics;
drop policy if exists "rls_authenticated_all_daily_ai_metrics" on daily_ai_metrics;
drop policy if exists "rls_authenticated_all_daily_affiliate_metrics" on daily_affiliate_metrics;
drop policy if exists "rls_authenticated_all_daily_revenue_metrics" on daily_revenue_metrics;
drop policy if exists "rls_authenticated_all_device_tokens" on device_tokens;
drop policy if exists "rls_authenticated_all_notifications" on notifications;
drop policy if exists "rls_authenticated_all_notification_logs" on notification_logs;
drop policy if exists "rls_authenticated_all_user_reports" on user_reports;
drop policy if exists "rls_authenticated_all_report_actions" on report_actions;
drop policy if exists "rls_authenticated_all_blocked_keywords" on blocked_keywords;
drop policy if exists "rls_authenticated_all_moderation_logs" on moderation_logs;
drop policy if exists "rls_authenticated_all_content_safety_rules" on content_safety_rules;
drop policy if exists "rls_authenticated_all_system_settings" on system_settings;
drop policy if exists "rls_authenticated_all_feature_flags" on feature_flags;
drop policy if exists "rls_authenticated_all_rate_limits" on rate_limits;
drop policy if exists "rls_authenticated_all_wardrobe_items" on wardrobe_items;
drop policy if exists "rls_authenticated_all_outfits" on outfits;
drop policy if exists "rls_authenticated_all_outfit_items" on outfit_items;
drop policy if exists "rls_authenticated_all_user_activity_log" on user_activity_log;

alter table if exists user_notification_preferences enable row level security;

-- Drop scoped policies too so this migration can be rerun after a partial apply.
drop policy if exists "admin_roles_admin_all" on admin_roles;
drop policy if exists "admin_users_admin_all" on admin_users;
drop policy if exists "admin_permissions_admin_all" on admin_permissions;
drop policy if exists "admin_audit_logs_admin_all" on admin_audit_logs;
drop policy if exists "ai_models_admin_all" on ai_models;
drop policy if exists "ai_provider_configs_admin_all" on ai_provider_configs;
drop policy if exists "prompt_templates_admin_all" on prompt_templates;
drop policy if exists "daily_user_metrics_admin_all" on daily_user_metrics;
drop policy if exists "daily_ai_metrics_admin_all" on daily_ai_metrics;
drop policy if exists "daily_affiliate_metrics_admin_all" on daily_affiliate_metrics;
drop policy if exists "daily_revenue_metrics_admin_all" on daily_revenue_metrics;
drop policy if exists "product_sources_admin_all" on product_sources;
drop policy if exists "product_sync_logs_admin_all" on product_sync_logs;
drop policy if exists "billing_events_admin_all" on billing_events;
drop policy if exists "report_actions_admin_all" on report_actions;
drop policy if exists "blocked_keywords_admin_all" on blocked_keywords;
drop policy if exists "moderation_logs_admin_all" on moderation_logs;
drop policy if exists "content_safety_rules_admin_all" on content_safety_rules;
drop policy if exists "system_settings_admin_all" on system_settings;
drop policy if exists "rate_limits_admin_all" on rate_limits;
drop policy if exists "plans_public_read_active" on plans;
drop policy if exists "plans_admin_all" on plans;
drop policy if exists "product_categories_public_read" on product_categories;
drop policy if exists "product_categories_admin_all" on product_categories;
drop policy if exists "product_tags_public_read" on product_tags;
drop policy if exists "product_tags_admin_all" on product_tags;
drop policy if exists "products_public_read_active" on products;
drop policy if exists "products_admin_all" on products;
drop policy if exists "fashion_trends_public_read_published" on fashion_trends;
drop policy if exists "fashion_trends_admin_all" on fashion_trends;
drop policy if exists "trend_keywords_public_read_published" on trend_keywords;
drop policy if exists "trend_keywords_admin_all" on trend_keywords;
drop policy if exists "trend_colors_public_read_published" on trend_colors;
drop policy if exists "trend_colors_admin_all" on trend_colors;
drop policy if exists "style_presets_public_read_active" on style_presets;
drop policy if exists "style_presets_admin_all" on style_presets;
drop policy if exists "trend_products_public_read_published" on trend_products;
drop policy if exists "trend_products_admin_all" on trend_products;
drop policy if exists "feature_flags_read_enabled" on feature_flags;
drop policy if exists "feature_flags_admin_all" on feature_flags;
drop policy if exists "profiles_read_own_or_admin" on profiles;
drop policy if exists "profiles_insert_own_or_admin" on profiles;
drop policy if exists "profiles_update_own_or_admin" on profiles;
drop policy if exists "subscriptions_read_own_or_admin" on subscriptions;
drop policy if exists "subscriptions_admin_all" on subscriptions;
drop policy if exists "user_credits_read_own_or_admin" on user_credits;
drop policy if exists "user_credits_admin_all" on user_credits;
drop policy if exists "credit_transactions_read_own_or_admin" on credit_transactions;
drop policy if exists "credit_transactions_insert_own_or_admin" on credit_transactions;
drop policy if exists "credit_transactions_admin_all" on credit_transactions;
drop policy if exists "payments_read_own_or_admin" on payments;
drop policy if exists "payments_admin_all" on payments;
drop policy if exists "invoices_read_own_or_admin" on invoices;
drop policy if exists "invoices_admin_all" on invoices;
drop policy if exists "wardrobe_items_own_all" on wardrobe_items;
drop policy if exists "outfits_own_all" on outfits;
drop policy if exists "outfit_items_own_all" on outfit_items;
drop policy if exists "user_activity_log_own_all" on user_activity_log;
drop policy if exists "notification_preferences_own_all" on user_notification_preferences;
drop policy if exists "ai_jobs_own_create_read" on ai_jobs;
drop policy if exists "ai_jobs_own_insert" on ai_jobs;
drop policy if exists "ai_jobs_admin_all" on ai_jobs;
drop policy if exists "ai_generation_logs_read_own_or_admin" on ai_generation_logs;
drop policy if exists "ai_generation_logs_admin_all" on ai_generation_logs;
drop policy if exists "analytics_events_insert_own_or_anon" on analytics_events;
drop policy if exists "analytics_events_read_own_or_admin" on analytics_events;
drop policy if exists "analytics_events_admin_all" on analytics_events;
drop policy if exists "product_clicks_insert_own_or_anon" on product_clicks;
drop policy if exists "product_clicks_read_own_or_admin" on product_clicks;
drop policy if exists "product_clicks_admin_all" on product_clicks;
drop policy if exists "device_tokens_own_all" on device_tokens;
drop policy if exists "notifications_read_targeted" on notifications;
drop policy if exists "notifications_admin_all" on notifications;
drop policy if exists "notification_logs_own_all" on notification_logs;
drop policy if exists "user_reports_own_insert" on user_reports;
drop policy if exists "user_reports_read_own_or_admin" on user_reports;
drop policy if exists "user_reports_admin_all" on user_reports;

-- Admin-owned data
create policy "admin_roles_admin_all" on admin_roles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_users_admin_all" on admin_users for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_permissions_admin_all" on admin_permissions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_audit_logs_admin_all" on admin_audit_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "ai_models_admin_all" on ai_models for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "ai_provider_configs_admin_all" on ai_provider_configs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "prompt_templates_admin_all" on prompt_templates for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "daily_user_metrics_admin_all" on daily_user_metrics for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "daily_ai_metrics_admin_all" on daily_ai_metrics for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "daily_affiliate_metrics_admin_all" on daily_affiliate_metrics for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "daily_revenue_metrics_admin_all" on daily_revenue_metrics for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "product_sources_admin_all" on product_sources for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "product_sync_logs_admin_all" on product_sync_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "billing_events_admin_all" on billing_events for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "report_actions_admin_all" on report_actions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "blocked_keywords_admin_all" on blocked_keywords for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "moderation_logs_admin_all" on moderation_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "content_safety_rules_admin_all" on content_safety_rules for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "system_settings_admin_all" on system_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "rate_limits_admin_all" on rate_limits for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public catalog/content reads plus admin writes
create policy "plans_public_read_active" on plans for select to anon, authenticated using (is_active = true or public.is_admin());
create policy "plans_admin_all" on plans for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "product_categories_public_read" on product_categories for select to anon, authenticated using (true);
create policy "product_categories_admin_all" on product_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "product_tags_public_read" on product_tags for select to anon, authenticated using (true);
create policy "product_tags_admin_all" on product_tags for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "products_public_read_active" on products for select to anon, authenticated using ((is_active = true and is_hidden = false) or public.is_admin());
create policy "products_admin_all" on products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "fashion_trends_public_read_published" on fashion_trends for select to anon, authenticated using (is_published = true or public.is_admin());
create policy "fashion_trends_admin_all" on fashion_trends for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "trend_keywords_public_read_published" on trend_keywords for select to anon, authenticated using (
  public.is_admin()
  or exists (select 1 from fashion_trends t where t.id = trend_keywords.trend_id and t.is_published = true)
);
create policy "trend_keywords_admin_all" on trend_keywords for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "trend_colors_public_read_published" on trend_colors for select to anon, authenticated using (
  public.is_admin()
  or trend_id is null
  or exists (select 1 from fashion_trends t where t.id = trend_colors.trend_id and t.is_published = true)
);
create policy "trend_colors_admin_all" on trend_colors for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "style_presets_public_read_active" on style_presets for select to anon, authenticated using (is_active = true or public.is_admin());
create policy "style_presets_admin_all" on style_presets for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "trend_products_public_read_published" on trend_products for select to anon, authenticated using (
  public.is_admin()
  or exists (select 1 from fashion_trends t where t.id = trend_products.trend_id and t.is_published = true)
);
create policy "trend_products_admin_all" on trend_products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "feature_flags_read_enabled" on feature_flags for select to anon, authenticated using (enabled = true or public.is_admin());
create policy "feature_flags_admin_all" on feature_flags for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- User-owned profile, billing, credits, wardrobe, outfits
create policy "profiles_read_own_or_admin" on profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles_insert_own_or_admin" on profiles for insert to authenticated with check (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "subscriptions_read_own_or_admin" on subscriptions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "subscriptions_admin_all" on subscriptions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "user_credits_read_own_or_admin" on user_credits for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "user_credits_admin_all" on user_credits for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "credit_transactions_read_own_or_admin" on credit_transactions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "credit_transactions_insert_own_or_admin" on credit_transactions for insert to authenticated with check (user_id = auth.uid() or public.is_admin());
create policy "credit_transactions_admin_all" on credit_transactions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "payments_read_own_or_admin" on payments for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "payments_admin_all" on payments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "invoices_read_own_or_admin" on invoices for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "invoices_admin_all" on invoices for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "wardrobe_items_own_all" on wardrobe_items for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "outfits_own_all" on outfits for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "outfit_items_own_all" on outfit_items for all to authenticated using (
  public.is_admin()
  or exists (select 1 from outfits o where o.id = outfit_items.outfit_id and o.user_id = auth.uid())
) with check (
  public.is_admin()
  or exists (select 1 from outfits o where o.id = outfit_items.outfit_id and o.user_id = auth.uid())
);
create policy "user_activity_log_own_all" on user_activity_log for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "notification_preferences_own_all" on user_notification_preferences for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

-- AI jobs/logs
create policy "ai_jobs_own_create_read" on ai_jobs for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "ai_jobs_own_insert" on ai_jobs for insert to authenticated with check (user_id = auth.uid() or public.is_admin());
create policy "ai_jobs_admin_all" on ai_jobs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "ai_generation_logs_read_own_or_admin" on ai_generation_logs for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "ai_generation_logs_admin_all" on ai_generation_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Events, notifications, reports
create policy "analytics_events_insert_own_or_anon" on analytics_events for insert to anon, authenticated with check (user_id is null or user_id = auth.uid() or public.is_admin());
create policy "analytics_events_read_own_or_admin" on analytics_events for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "analytics_events_admin_all" on analytics_events for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "product_clicks_insert_own_or_anon" on product_clicks for insert to anon, authenticated with check (user_id is null or user_id = auth.uid() or public.is_admin());
create policy "product_clicks_read_own_or_admin" on product_clicks for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "product_clicks_admin_all" on product_clicks for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "device_tokens_own_all" on device_tokens for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "notifications_read_targeted" on notifications for select to authenticated using (
  public.is_admin()
  or target_type = 'all'
  or (target_type = 'specific_users' and auth.uid() = any(target_ids))
);
create policy "notifications_admin_all" on notifications for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "notification_logs_own_all" on notification_logs for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "user_reports_own_insert" on user_reports for insert to authenticated with check (reporter_id = auth.uid() or public.is_admin());
create policy "user_reports_read_own_or_admin" on user_reports for select to authenticated using (reporter_id = auth.uid() or reported_id = auth.uid() or public.is_admin());
create policy "user_reports_admin_all" on user_reports for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Storage policies for avatar files at avatars/{user_id}/filename
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
-- ============================================================================
-- Seed data fixes: trends images, product affiliate links, empty tables
-- Run this in Supabase SQL Editor after 00004
-- ============================================================================

-- 1. Update fashion_trends with image_url and description
update fashion_trends set
  image_url = 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=600&q=80',
  description = 'Màu sắc tương phản mạnh mẽ quay trở lại — phối 2-3 gam màu đối lập trong cùng một outfit để tạo điểm nhấn cá tính.',
  ai_summary = 'Xu hướng color blocking 2026 thiên về các cặp màu pastel + neon, đặc biệt phổ biến trong streetwear và công sở trẻ.'
where slug = 'color-blocking-returns';

update fashion_trends set
  image_url = 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
  description = 'Phối nhiều layers denim từ áo jacket, sơ mi denim đến quần jeans — mix cùng phụ kiện da hoặc kim loại.',
  ai_summary = 'Denim on denim không còn là tabu. Xu hướng 2026 ưu tiên different washes (trầm+sáng) và silhouette oversized.'
where slug = 'denim-on-denim-2';

update fashion_trends set
  image_url = 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80',
  description = 'Phụ kiện bản to, màu sắc nổi bật — từ kính mắt, dây chuyền đến belt và túi — làm điểm nhấn cho outfit tối giản.',
  ai_summary = 'Accessories được xem như "hero piece" của outfit 2026. Đầu tư vào 1-2 món bold accessories giúp nâng cấp mọi set đồ basic.'
where slug = 'bold-accessories-trend';

update fashion_trends set
  image_url = 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80',
  description = 'Sắc pastel dịu nhẹ — hồng baby, xanh mint, vàng butter, tím lilac — phủ khắp BST xuân hè.',
  ai_summary = 'Pastel 2026 không chỉ dành cho nữ. Các gam pastel trung tính như lavender, sage green, butter yellow được thiết kế unisex rộng rãi.'
where slug = 'spring-pastel-revival';

update fashion_trends set
  image_url = 'https://images.unsplash.com/photo-1581044777550-4c0a9e32f8c4?w=600&q=80',
  description = 'Tối giản nhưng không đơn điệu — tập trung vào chất liệu cao cấp, đường cắt tinh tế và phối màu monochrome.',
  ai_summary = 'Neo minimalism khác minimalism cổ điển ở chỗ chấp nhận texture và chi tiết kiến trúc, nhưng vẫn giữ bảng màu trung tính.'
where slug = 'neo-minimalism';

update fashion_trends set
  image_url = 'https://images.unsplash.com/photo-1544923246-77307dd270b6?w=600&q=80',
  description = 'Thời trang công nghệ với chất liệu kỹ thuật, túi đa năng, phối màu dark/silver và phụ kiện utility.',
  ai_summary = 'Tech-wear 2026 kết hợp giữa tính năng và thẩm mỹ — vải chống nước, khóa kéo ẩn, túi modular và đèn LED tích hợp.'
where slug = 'tech-wear-evolution';

update fashion_trends set
  image_url = 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&q=80',
  description = 'Sang trọng thầm lặng — không logo, chất liệu đắt tiền (cashmere, lụa, len mịn), đường may hoàn hảo.',
  ai_summary = 'Quiet luxury tập trung vào "investment pieces" — những món đồ đắt tiền nhưng kín đáo, có thể mặc nhiều năm và kết hợp linh hoạt.'
where slug = 'quiet-luxury-continues';

-- 2. Update products with affiliate_url, price, images
update products set
  affiliate_url = case source_id
    when '3873d9d5-cd89-4a88-83ca-907ba56972ef' then 'https://shopee.vn/search?keyword=' || replace(lower(name), ' ', '-')
    when '7fd01dff-045f-4922-ae62-7f7d67485f81' then 'https://www.lazada.vn/catalog/?q=' || replace(lower(name), ' ', '+')
    when '4edbe8de-2b76-4813-85a0-e1f97b3bcb9e' then 'https://tiki.vn/search?q=' || replace(lower(name), ' ', '+')
    when '2470c4ab-4b5c-4cb2-a158-1ef382b9bd7f' then 'https://www.zalora.vn/search?q=' || replace(lower(name), ' ', '+')
    when '99eec136-9c6f-48ff-a521-53cad2be3206' then 'https://shop.tiktok.com/search?q=' || replace(lower(name), ' ', '+')
    else null
  end,
  image_url = case name
    when 'Silk Midi Skirt' then 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80'
    when 'Chunky Sneakers' then 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80'
    when 'Oversized Blazer' then 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
    when 'Sequin Party Dress' then 'https://images.unsplash.com/photo-1581044777550-4c0a9e32f8c4?w=400&q=80'
    when 'Leather Belt' then 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&q=80'
    when 'Classic White Tee' then 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80'
    when 'Wide Leg Jeans' then 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80'
    when 'Canvas Tote Bag' then 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=400&q=80'
  end,
  price = case name
    when 'Silk Midi Skirt' then 850000
    when 'Chunky Sneakers' then 2200000
    when 'Oversized Blazer' then 1500000
    when 'Sequin Party Dress' then 1800000
    when 'Leather Belt' then 450000
    when 'Classic White Tee' then 299000
    when 'Wide Leg Jeans' then 680000
    when 'Canvas Tote Bag' then 520000
  end,
  commission_rate = 8.5;

-- 3. Seed user_credits for existing users
insert into user_credits (user_id, balance, lifetime_earned, lifetime_spent)
select id, 100, 100, 0
from profiles
where id not in (select user_id from user_credits)
on conflict (user_id) do nothing;

-- 4. Seed subscriptions for test users using the Free plan
do $$
declare
  free_plan_id uuid;
begin
  select id into free_plan_id from plans where slug = 'free';
  insert into subscriptions (user_id, plan_id, status, billing_cycle, current_period_start, current_period_end)
  select p.id, free_plan_id, 'active', 'monthly', now(), now() + interval '30 days'
  from profiles p
  where p.id not in (select user_id from subscriptions);
end $$;

-- 5. Seed ai_jobs (sample data for admin dashboard)
insert into ai_jobs (user_id, job_type, prompt, status, started_at, completed_at, created_at)
select
  p.id,
  'outfit_generation',
  'Generate a casual weekend outfit',
  'completed',
  now() - interval '1 hour' * (random() * 24)::int,
  now() - interval '1 hour' * (random() * 24 - 0.1)::int,
  now() - interval '1 day' * (random() * 7)::int
from profiles p
cross join generate_series(1, 3);

-- 6. Seed sample analytics_events
insert into analytics_events (event_type, user_id, session_id, created_at)
select
  (array['page_view','outfit_generate','wardrobe_upload','save_outfit'])[floor(random() * 4 + 1)],
  p.id,
  'seed-' || gen_random_uuid(),
  now() - interval '1 day' * (random() * 14)::int
from profiles p
cross join generate_series(1, 5);

-- 7. Seed prompt_templates if not enough
insert into prompt_templates (name, slug, category, template, system_prompt, is_active, version)
select * from (values
  ('Office Outfit Generator', 'office-outfit-generator', 'outfit_generation',
   'Generate a professional office outfit for {{gender}} in {{season}}. Style preference: {{style}}. Budget: {{budget}}.',
   'You are a professional fashion stylist. Suggest complete outfits appropriate for office environments.',
   true, 1),
  ('Style Analyzer', 'style-analyzer', 'style_analysis',
   'Analyze the style profile of a user who prefers {{styles}} and wears {{colors}}.',
   'You are a fashion data analyst. Provide insights about style preferences and wardrobe composition.',
   true, 1)
) as v
where not exists (select 1 from prompt_templates where slug = v.column2);

-- 8. Ensure style_presets have proper data
update style_presets set
  image_url = case slug
    when 'minimal' then 'https://images.unsplash.com/photo-1581044777550-4c0a9e32f8c4?w=200&q=80'
    when 'casual' then 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&q=80'
    when 'streetwear' then 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=200&q=80'
    when 'office' then 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&q=80'
    when 'athleisure' then 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=200&q=80'
    when 'party' then 'https://images.unsplash.com/photo-1583391733956-6c78276477e9?w=200&q=80'
    when 'bohemian' then 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&q=80'
    when 'datenight' then 'https://images.unsplash.com/photo-1583391733956-6c78276477e9?w=200&q=80'
  end,
  characteristics = case slug
    when 'minimal' then array['tối giản','trung tính','đường cắt sạch']::text[]
    when 'casual' then array['thoải mái','basic','dễ phối']::text[]
    when 'streetwear' then array['cá tính','oversized','sneakers']::text[]
    when 'office' then array['lịch sự','chuyên nghiệp','thanh lịch']::text[]
    when 'athleisure' then array['thể thao','năng động','thoáng mát']::text[]
    when 'party' then array['sang trọng','quyến rũ','nổi bật']::text[]
    when 'bohemian' then array['phóng khoáng','màu sắc','hoạ tiết']::text[]
    when 'datenight' then array['lãng mạn','thanh lịch','quyến rũ']::text[]
  end;

-- 9. Seed admin_audit_logs
insert into admin_audit_logs (admin_id, action, entity_type, entity_id, details, created_at)
select
  au.id,
  'seed_data_update',
  'system',
  null,
  '{"note": "Database seed completed"}',
  now()
from admin_users au
limit 1;

-- 10. Seed user_notification_preferences for any missing users
insert into user_notification_preferences (user_id, trend_alerts, outfit_suggestions, promotions, subscription_reminders, push_enabled, email_enabled)
select p.id, true, true, false, true, true, true
from profiles p
where p.id not in (select user_id from user_notification_preferences)
on conflict (user_id) do nothing;
-- ============================================================================
-- Migration 00006: order_code, payments_log, state machine, RLS
-- Run this in Supabase SQL Editor after 00005
-- ============================================================================

-- 1. Add order_code column (needed by PayOS API to verify payment status)
alter table payments add column if not exists order_code text;
create index if not exists idx_payments_order_code on payments(order_code);

-- 2. Create payments_log table
create table if not exists payments_log (
  id              uuid primary key default uuid_generate_v4(),
  payment_id      uuid references payments(id) on delete set null,
  event_type      text not null,               -- 'webhook_received','webhook_processed','api_verify','cron_check','frontend_return'
  status          text not null,               -- status of the payment at time of this event
  new_status      text,                        -- status after processing (null if no change)
  raw_payload     jsonb,                       -- full raw payload from PayOS webhook
  source          text not null,               -- 'webhook','verify_api','cron','frontend'
  idempotency_key text,                        -- for deduplication
  error           text,                        -- error message if processing failed
  created_at      timestamptz not null default now()
);

-- 3. Indexes for payments_log
create index if not exists idx_payments_log_payment on payments_log(payment_id);
create index if not exists idx_payments_log_source on payments_log(source);
create index if not exists idx_payments_log_created on payments_log(created_at desc);
create unique index if not exists idx_payments_log_idempotency on payments_log(idempotency_key) where idempotency_key is not null;

-- 4. Enable RLS
alter table payments_log enable row level security;

-- 5. RLS policies for payments_log
drop policy if exists "payments_log_read_own_or_admin" on payments_log;
create policy "payments_log_read_own_or_admin" on payments_log
  for select to authenticated using (
    payment_id in (select id from payments where user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "payments_log_admin_all" on payments_log;
create policy "payments_log_admin_all" on payments_log
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 6. Allow service_role (edge functions) to insert payments_log
drop policy if exists "payments_log_service_insert" on payments_log;
create policy "payments_log_service_insert" on payments_log
  for insert to authenticated with check (true);  -- service_role bypasses RLS anyway
-- ============================================================================
-- Migration 00007: Impact Affiliate Integration
-- pgvector, products embedding, clicks tracking, similarity search
-- ============================================================================

-- 1. Enable pgvector extension
create extension if not exists vector with schema extensions;

-- 2. Add embedding column to products (Gemini text-embedding-004 = 768 dimensions)
alter table products add column if not exists embedding vector(768);

-- 3. Clicks tracking table
create table if not exists clicks (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete set null,
  product_id      uuid references products(id) on delete set null,
  outfit_id       uuid references outfits(id) on delete set null,
  source          text not null default 'affiliate',  -- 'affiliate','organic','email'
  ip_address      text,
  user_agent      text,
  created_at      timestamptz not null default now()
);

-- 4. Indexes
create index if not exists idx_clicks_user on clicks(user_id, created_at desc);
create index if not exists idx_clicks_product on clicks(product_id);
create index if not exists idx_clicks_outfit on clicks(outfit_id);
create index if not exists idx_clicks_date on clicks(created_at desc);

-- 5. Enable RLS
alter table clicks enable row level security;

-- 6. VECTOR INDEX for similarity search on products
-- Using IVFFlat for approximate nearest neighbor (works on all plans)
create index if not exists idx_products_embedding on products
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 7. RLS for clicks
drop policy if exists "clicks_insert_authenticated" on clicks;
create policy "clicks_insert_authenticated" on clicks
  for insert to authenticated with check (true);

drop policy if exists "clicks_read_own_or_admin" on clicks;
create policy "clicks_read_own_or_admin" on clicks
  for select to authenticated using (
    user_id = auth.uid() or public.is_admin()
  );

drop policy if exists "clicks_admin_all" on clicks;
create policy "clicks_admin_all" on clicks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 8. Allow service_role to insert/read all clicks (for edge functions)
drop policy if exists "clicks_service_all" on clicks;
create policy "clicks_service_all" on clicks
  for all to service_role using (true) with check (true);

-- 9. Vector similarity search function (used by build-outfit Edge Function)
create or replace function search_products(
  query_embedding vector(768),
  match_count int default 20
)
returns table (
  id uuid,
  name text,
  description text,
  image_url text,
  price numeric,
  currency text,
  affiliate_url text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    p.id,
    p.name,
    p.description,
    p.image_url,
    p.price,
    p.currency,
    p.affiliate_url,
    p.metadata,
    1 - (p.embedding <=> query_embedding) as similarity
  from products p
  where p.embedding is not null
    and p.is_active = true
  order by p.embedding <=> query_embedding
  limit match_count;
end;
$$;
-- ============================================================================
-- Migration 00008: Outfit Engine — tags, source, match_products, click_count
-- ============================================================================

-- 1. Add columns to products
alter table products add column if not exists tags text[];
alter table products add column if not exists source text default 'manual';
alter table products add column if not exists click_count int not null default 0;
alter table products add column if not exists trending_score float not null default 0;

-- 2. GIN index for tag search fallback
create index if not exists idx_products_tags on products using gin(tags);

-- 3. Add traffic_source to clicks (for attribution)
alter table clicks add column if not exists traffic_source text default 'direct';

-- 4. match_products RPC — returns full product rows ordered by similarity
create or replace function match_products(
  query_embedding vector(768),
  match_count int default 20
)
returns setof products
language sql
as $$
  select *
  from products
  where embedding is not null
    and is_active = true
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- 5. Function to update trending_score (called by cron or after click)
create or replace function update_trending_score()
returns void
language plpgsql
as $$
begin
  update products p
  set trending_score = (
    select count(*)::float / nullif(extract(epoch from now() - min(c.created_at)), 0)
    from clicks c
    where c.product_id = p.id
      and c.created_at > now() - interval '7 days'
  )
  where exists (
    select 1 from clicks c
    where c.product_id = p.id
      and c.created_at > now() - interval '7 days'
  );
end;
$$;
-- RLS policies for wardrobe_items
drop policy if exists "Users can insert their own wardrobe items" on wardrobe_items;
create policy "Users can insert their own wardrobe items"
  on wardrobe_items for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own wardrobe items" on wardrobe_items;
create policy "Users can view their own wardrobe items"
  on wardrobe_items for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own wardrobe items" on wardrobe_items;
create policy "Users can update their own wardrobe items"
  on wardrobe_items for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own wardrobe items" on wardrobe_items;
create policy "Users can delete their own wardrobe items"
  on wardrobe_items for delete
  to authenticated
  using (auth.uid() = user_id);

-- Storage bucket for wardrobe images
insert into storage.buckets (id, name, public)
values ('wardrobe', 'wardrobe', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload wardrobe images" on storage.objects;
create policy "Authenticated users can upload wardrobe images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'wardrobe');

drop policy if exists "Anyone can view wardrobe images" on storage.objects;
create policy "Anyone can view wardrobe images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'wardrobe');
-- ============================================================================
-- 00010: Notification Inbox — In-App Per-User Inbox
-- ============================================================================
-- Bảng notification_inbox lưu trạng thái đọc/chưa đọc per-user.
-- Tách biệt với notification_logs (delivery tracking) để phục vụ UX inbox.

create table if not exists notification_inbox (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  notification_id uuid not null references notifications(id) on delete cascade,
  is_read         boolean not null default false,
  read_at         timestamptz,
  created_at      timestamptz not null default now(),
  unique(user_id, notification_id)
);

create index if not exists idx_notification_inbox_user
  on notification_inbox(user_id, created_at desc);

create index if not exists idx_notification_inbox_unread
  on notification_inbox(user_id, is_read) where is_read = false;

-- RLS
alter table notification_inbox enable row level security;

drop policy if exists "notification_inbox_own_all" on notification_inbox;
create policy "notification_inbox_own_all"
  on notification_inbox for all
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ============================================================================
-- Trigger: Fan-out notification to inbox for all targeted users
-- Khi admin insert vào bảng notifications, tự động tạo inbox entry cho user.
-- ============================================================================
create or replace function public.fn_fanout_notification_to_inbox()
returns trigger
language plpgsql
security definer
as $$
begin
  -- target_type = 'all': gửi cho tất cả user có push_enabled hoặc email_enabled
  if new.target_type = 'all' then
    insert into notification_inbox (user_id, notification_id)
    select p.id, new.id
    from profiles p
    left join user_notification_preferences unp on unp.user_id = p.id
    where (unp.push_enabled is null or unp.push_enabled = true
           or unp.email_enabled is null or unp.email_enabled = true)
    on conflict (user_id, notification_id) do nothing;

  -- target_type = 'specific_users': gửi cho danh sách user IDs cụ thể
  elsif new.target_type = 'specific_users' and new.target_ids is not null then
    insert into notification_inbox (user_id, notification_id)
    select unnest(new.target_ids), new.id
    on conflict (user_id, notification_id) do nothing;

  -- target_type = 'premium': gửi cho user có gói premium/pro
  elsif new.target_type = 'premium' then
    insert into notification_inbox (user_id, notification_id)
    select s.user_id, new.id
    from subscriptions s
    join plans pl on pl.id = s.plan_id
    where lower(pl.name) in ('premium', 'pro')
      and s.status = 'active'
    on conflict (user_id, notification_id) do nothing;

  -- target_type = 'free': gửi cho user chưa có gói trả phí
  elsif new.target_type = 'free' then
    insert into notification_inbox (user_id, notification_id)
    select p.id, new.id
    from profiles p
    where p.id not in (
      select user_id from subscriptions
      where status = 'active'
        and plan_id in (select id from plans where lower(name) in ('premium','pro'))
    )
    on conflict (user_id, notification_id) do nothing;

  -- target_type = 'active': gửi cho user đăng nhập trong 30 ngày qua
  elsif new.target_type = 'active' then
    insert into notification_inbox (user_id, notification_id)
    select distinct user_id, new.id
    from analytics_events
    where created_at >= now() - interval '30 days'
    on conflict (user_id, notification_id) do nothing;
  end if;

  -- Cập nhật sent_at trên notification
  update notifications set sent_at = now() where id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_fanout_notification on notifications;
create trigger trg_fanout_notification
  after insert on notifications
  for each row
  execute function public.fn_fanout_notification_to_inbox();
