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
