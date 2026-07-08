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
