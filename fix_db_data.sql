-- 1. Đảm bảo mọi user đều có Profile (để nhận thông báo)
INSERT INTO public.profiles (id, display_name, email, created_at, updated_at)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', 'Người dùng mới'), email, created_at, updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Nạp dữ liệu giả (Seed Data) cho Dashboard Admin
INSERT INTO public.daily_user_metrics (date, total_users, new_users, active_users)
VALUES 
  (current_date - interval '4 days', 1500, 10, 450),
  (current_date - interval '3 days', 1520, 20, 500),
  (current_date - interval '2 days', 1550, 30, 600),
  (current_date - interval '1 day', 1600, 50, 750),
  (current_date, 1650, 50, 800)
ON CONFLICT (date) DO NOTHING;

INSERT INTO public.daily_ai_metrics (date, total_generations, unique_users)
VALUES 
  (current_date - interval '4 days', 1200, 200),
  (current_date - interval '3 days', 1350, 250),
  (current_date - interval '2 days', 1600, 320),
  (current_date - interval '1 day', 2100, 400),
  (current_date, 2500, 450)
ON CONFLICT (date) DO NOTHING;

INSERT INTO public.daily_revenue_metrics (date, total_revenue, paying_users, new_subscriptions)
VALUES 
  (current_date - interval '2 days', 5000000, 100, 5),
  (current_date - interval '1 day', 7500000, 120, 10),
  (current_date, 10000000, 150, 15)
ON CONFLICT (date) DO NOTHING;

INSERT INTO public.daily_affiliate_metrics (date, total_clicks, total_conversions, total_commission)
VALUES 
  (current_date - interval '2 days', 300, 15, 150000),
  (current_date - interval '1 day', 450, 25, 250000),
  (current_date, 600, 35, 350000)
ON CONFLICT (date) DO NOTHING;
