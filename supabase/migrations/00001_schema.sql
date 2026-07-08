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
  platform        text not null,               -- 'shopee','tiktok_shop'
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
