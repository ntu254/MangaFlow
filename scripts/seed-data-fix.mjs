import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://trywdfggzrzbwndwrerg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyeXdkZmdnenJ6YnduZHdyZXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NzY3NzQsImV4cCI6MjA5NTM1Mjc3NH0.LEzQDVBy9AvNqAzdr2hH4Be8t5g8F4rW6UUdY7g8-Sk'
);

async function exec() {
  await supabase.auth.signInWithPassword({ email: 'test@redo.ai', password: 'Test123456!' });

  // 1. Updates
  const updates = [
    { slug: 'color-blocking-returns', image_url: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=600&q=80', description: 'Mau sac tuong phan manh me quay tro lai.', ai_summary: 'Color blocking 2026 thien ve pastel + neon.' },
    { slug: 'denim-on-denim-2', image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80', description: 'Phoi nhieu layers denim tu jacket, so mi denim den jeans.', ai_summary: 'Denim on denim 2026 uu tien different washes.' },
    { slug: 'bold-accessories-trend', image_url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80', description: 'Phu kien ban to, mau sac noi bat.', ai_summary: 'Accessories la hero piece cua outfit 2026.' },
    { slug: 'spring-pastel-revival', image_url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80', description: 'Sac pastel diu nhang — hong baby, xanh mint.', ai_summary: 'Pastel 2026 khong chi danh cho nu.' },
    { slug: 'neo-minimalism', image_url: 'https://images.unsplash.com/photo-1581044777550-4c0a9e32f8c4?w=600&q=80', description: 'Toi gian nhung khong don dieu.', ai_summary: 'Neo minimalism chap nhan texture vai.' },
    { slug: 'tech-wear-evolution', image_url: 'https://images.unsplash.com/photo-1544923246-77307dd270b6?w=600&q=80', description: 'Thoi trang cong nghe voi chat lieu ky thuat.', ai_summary: 'Tech-wear 2026 ket hop tinh nang va tham my.' },
    { slug: 'quiet-luxury-continues', image_url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&q=80', description: 'Sang trong tham lang — khong logo.', ai_summary: 'Quiet luxury tap trung vao investment pieces.' },
  ];
  for (const u of updates) {
    const { error } = await supabase.from('fashion_trends').update(u).eq('slug', u.slug);
    if (error) console.log('ERR trend ' + u.slug + ': ' + error.message);
  }
  console.log('1. fashion_trends: updated ' + updates.length);

  // 2. Products
  const products = await supabase.from('products').select('id, name, source_id');
  const platformMap = {
    '3873d9d5-cd89-4a88-83ca-907ba56972ef': 'shopee.vn',
    '99eec136-9c6f-48ff-a521-53cad2be3206': 'tiktok.com',
  };
  const imgMap = {
    'Silk Midi Skirt': 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80',
    'Chunky Sneakers': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80',
    'Oversized Blazer': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    'Sequin Party Dress': 'https://images.unsplash.com/photo-1581044777550-4c0a9e32f8c4?w=400&q=80',
    'Leather Belt': 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&q=80',
    'Classic White Tee': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
    'Wide Leg Jeans': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80',
    'Canvas Tote Bag': 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=400&q=80',
  };
  const priceMap = {
    'Silk Midi Skirt': 850000, 'Chunky Sneakers': 2200000, 'Oversized Blazer': 1500000,
    'Sequin Party Dress': 1800000, 'Leather Belt': 450000, 'Classic White Tee': 299000,
    'Wide Leg Jeans': 680000, 'Canvas Tote Bag': 520000,
  };
  for (const p of products.data || []) {
    const platform = platformMap[p.source_id] || 'shopee.vn';
    const { error } = await supabase.from('products').update({
      affiliate_url: 'https://' + platform + '/search?q=' + encodeURIComponent(p.name),
      image_url: imgMap[p.name] || null,
      price: priceMap[p.name] || 500000,
      commission_rate: 8.5,
    }).eq('id', p.id);
    if (error) console.log('ERR product ' + p.name + ': ' + error.message);
  }
  console.log('2. products: updated ' + (products.data?.length || 0));

  // 3. user_credits
  const profiles = await supabase.from('profiles').select('id');
  for (const prof of (profiles.data || [])) {
    const { data: cred } = await supabase.from('user_credits').select('id').eq('user_id', prof.id).maybeSingle();
    if (!cred) {
      await supabase.from('user_credits').insert({ user_id: prof.id, balance: 100, lifetime_earned: 100, lifetime_spent: 0 });
    }
  }
  console.log('3. user_credits: done');

  // 4. subscriptions
  const { data: freePlan } = await supabase.from('plans').select('id').eq('slug', 'free').single();
  for (const prof of (profiles.data || [])) {
    const { data: sub } = await supabase.from('subscriptions').select('id').eq('user_id', prof.id).maybeSingle();
    if (!sub && freePlan) {
      await supabase.from('subscriptions').insert({
        user_id: prof.id, plan_id: freePlan.id, status: 'active',
        billing_cycle: 'monthly',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      });
    }
  }
  console.log('4. subscriptions: done');

  // 5. notification preferences
  for (const prof of (profiles.data || [])) {
    const { data: np } = await supabase.from('user_notification_preferences').select('id').eq('user_id', prof.id).maybeSingle();
    if (!np) {
      await supabase.from('user_notification_preferences').insert({ user_id: prof.id });
    }
  }
  console.log('5. notification_prefs: done');

  // 6. style_presets images
  const styleImgs = {
    minimal: 'https://images.unsplash.com/photo-1581044777550-4c0a9e32f8c4?w=200&q=80',
    casual: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&q=80',
    streetwear: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=200&q=80',
    office: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&q=80',
    athleisure: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=200&q=80',
    party: 'https://images.unsplash.com/photo-1583391733956-6c78276477e9?w=200&q=80',
    bohemian: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&q=80',
    datenight: 'https://images.unsplash.com/photo-1583391733956-6c78276477e9?w=200&q=80',
  };
  for (const [slug, url] of Object.entries(styleImgs)) {
    await supabase.from('style_presets').update({ image_url: url }).eq('slug', slug);
  }
  console.log('6. style_presets images: updated');

  console.log('\n=== ALL DONE ===');
}

exec().catch(e => console.log('FATAL:', e.message));
