/**
 * Run migration 00002 via direct PostgreSQL connection.
 * Also updates seed data for new tables.
 */
import postgres from 'postgres';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PASSWORD = 'Toitenlatu123@';
const PROJECT_REF = 'trywdfggzrzbwndwrerg';

// Try pooler connection (session mode)
const connStr = `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(PASSWORD)}@${PROJECT_REF}.pooler.supabase.com:5432/postgres`;

async function run() {
  console.log('Connecting to Supabase database...');
  const sql = postgres(connStr, {
    ssl: 'require',
    connect_timeout: 30,
  });

  try {
    // Read SQL migration
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '00002_wardrobe_outfits_activity.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');

    console.log('Running migration 00002...');
    await sql.unsafe(migrationSql);
    console.log('Migration 00002 complete!');

    // Verify tables
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('wardrobe_items','outfits','outfit_items','user_activity_log')
      ORDER BY table_name
    `;
    console.log('Tables created:', tables.map(t => t.table_name).join(', '));

    // --- Seed data ---
    console.log('\nSeeding new tables...');

    // Seed wardrobe_items
    const wardrobes = [
      { name: 'Áo thun trắng basic', color: 'Trắng', brand: 'Uniqlo', category: 'Tops', style: 'Casual' },
      { name: 'Quần jeans ống rộng', color: 'Xanh denim', brand: 'Levi\'s', category: 'Bottoms', style: 'Casual' },
      { name: 'Áo blazer đen', color: 'Đen', brand: 'Zara', category: 'Outerwear', style: 'Office' },
      { name: 'Váy midi hoa nhí', color: 'Hoa', brand: 'Mango', category: 'Dresses', style: 'Date Night' },
      { name: 'Giày sneaker trắng', color: 'Trắng', brand: 'Nike', category: 'Shoes', style: 'Athleisure' },
      { name: 'Áo hoodie xám', color: 'Xám', brand: 'Adidas', category: 'Outerwear', style: 'Streetwear' },
      { name: 'Quần tây đen', color: 'Đen', brand: 'H&M', category: 'Bottoms', style: 'Office' },
      { name: 'Túi tote canvas', color: 'Beige', brand: 'Maison', category: 'Accessories', style: 'Minimal' },
      { name: 'Áo sơ mi lụa hồng', color: 'Hồng', brand: 'G2000', category: 'Tops', style: 'Date Night' },
      { name: 'Giày cao gót đen', color: 'Đen', brand: 'Charles & Keith', category: 'Shoes', style: 'Party' },
    ];

    // Get foreign key mappings
    const cats = await sql`SELECT id, slug FROM product_categories`;
    const styles = await sql`SELECT id, slug FROM style_presets`;
    const catMap = Object.fromEntries(cats.map(c => [c.slug.toLowerCase(), c.id]));
    const styleMap = Object.fromEntries(styles.map(s => [s.slug.toLowerCase(), s.id]));

    for (const w of wardrobes) {
      await sql`
        INSERT INTO wardrobe_items (user_id, name, category_id, style_preset_id, color, brand, is_favorite)
        VALUES (
          (SELECT id FROM auth.users LIMIT 1),
          ${w.name},
          ${catMap[w.category.toLowerCase()] || null},
          ${styleMap[w.style.toLowerCase()] || null},
          ${w.color},
          ${w.brand},
          ${Math.random() > 0.5}
        )
      `;
    }
    console.log('  wardrobe_items ✅');

    // Seed outfits
    const outfitData = [
      { name: 'Dạo phố cuối tuần', style: 'Casual', source: 'ai' },
      { name: 'Hẹn hò tối thứ 7', style: 'Date Night', source: 'ai' },
      { name: 'Họp công sở', style: 'Office', source: 'user' },
      { name: 'Tập gym sáng', style: 'Athleisure', source: 'user' },
      { name: 'Tiệc sinh nhật', style: 'Party', source: 'ai' },
      { name: 'Phong cách đường phố', style: 'Streetwear', source: 'trend' },
      { name: 'Cà phê cuối tuần', style: 'Casual', source: 'user' },
      { name: 'Tối giản sang trọng', style: 'Minimal', source: 'ai' },
    ];

    const outfitIds = [];
    for (const o of outfitData) {
      const result = await sql`
        INSERT INTO outfits (user_id, name, style_preset_id, source, is_saved)
        VALUES (
          (SELECT id FROM auth.users LIMIT 1),
          ${o.name},
          ${styleMap[o.style.toLowerCase()] || null},
          ${o.source},
          ${Math.random() > 0.3}
        )
        RETURNING id
      `;
      outfitIds.push(result[0].id);
    }
    console.log('  outfits ✅');

    // Link outfits to wardrobe items (outfit_items)
    const itemIds = await sql`SELECT id FROM wardrobe_items ORDER BY created_at`;
    for (let i = 0; i < outfitIds.length; i++) {
      const itemCount = 2 + Math.floor(Math.random() * 3); // 2-4 items per outfit
      const shuffled = [...itemIds].sort(() => Math.random() - 0.5).slice(0, itemCount);
      for (let j = 0; j < shuffled.length; j++) {
        await sql`
          INSERT INTO outfit_items (outfit_id, wardrobe_item_id, sort_order)
          VALUES (${outfitIds[i]}, ${shuffled[j].id}, ${j})
          ON CONFLICT DO NOTHING
        `;
      }
    }
    console.log('  outfit_items ✅');

    // Seed user_activity_log
    const activities = [
      { type: 'outfit_created', desc: 'Tạo outfit mới: Dạo phố cuối tuần' },
      { type: 'outfit_saved', desc: 'Lưu outfit: Hẹn hò tối thứ 7' },
      { type: 'wardrobe_upload', desc: 'Thêm 3 món đồ vào tủ đồ' },
      { type: 'subscription_change', desc: 'Nâng cấp lên gói Pro' },
      { type: 'quiz_complete', desc: 'Hoàn thành Style Quiz' },
      { type: 'outfit_created', desc: 'Tạo outfit: Phong cách đường phố' },
      { type: 'trend_view', desc: 'Xem xu hướng hè 2026' },
      { type: 'outfit_saved', desc: 'Lưu outfit: Tối giản sang trọng' },
      { type: 'wardrobe_upload', desc: 'Thêm áo blazer vào tủ đồ' },
      { type: 'trend_view', desc: 'Xem bảng màu xu hướng' },
    ];

    // Insert activities with staggered timestamps
    for (let i = 0; i < activities.length; i++) {
      const minutesAgo = i * 15; // each 15 min apart
      await sql`
        INSERT INTO user_activity_log (user_id, activity_type, description, created_at)
        VALUES (
          (SELECT id FROM auth.users LIMIT 1),
          ${activities[i].type},
          ${activities[i].desc},
          now() - interval '${sql(minutesAgo)} minutes'
        )
      `;
    }
    console.log('  user_activity_log ✅');

    console.log('\n=== Migration + Seed complete ===');
  } finally {
    await sql.end();
  }
}

run().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
