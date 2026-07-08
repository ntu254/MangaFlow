alter table payments add column if not exists plan_id uuid references plans(id);
alter table payments add column if not exists billing_cycle text not null default 'monthly';
alter table payments add column if not exists order_code text;
alter table payments add column if not exists provider_payment_id text;

create index if not exists idx_payments_order_code on payments(order_code);
create index if not exists idx_payments_plan_id on payments(plan_id);
