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
