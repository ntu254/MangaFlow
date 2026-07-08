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
