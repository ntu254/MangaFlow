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
