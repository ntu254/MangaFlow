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
