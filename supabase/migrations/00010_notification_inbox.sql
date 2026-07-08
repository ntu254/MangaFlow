-- ============================================================================
-- 00010: Notification Inbox — In-App Per-User Inbox
-- ============================================================================
-- Bảng notification_inbox lưu trạng thái đọc/chưa đọc per-user.
-- Tách biệt với notification_logs (delivery tracking) để phục vụ UX inbox.

create table if not exists notification_inbox (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  notification_id uuid not null references notifications(id) on delete cascade,
  is_read         boolean not null default false,
  read_at         timestamptz,
  created_at      timestamptz not null default now(),
  unique(user_id, notification_id)
);

create index if not exists idx_notification_inbox_user
  on notification_inbox(user_id, created_at desc);

create index if not exists idx_notification_inbox_unread
  on notification_inbox(user_id, is_read) where is_read = false;

-- RLS
alter table notification_inbox enable row level security;

drop policy if exists "notification_inbox_own_all" on notification_inbox;
create policy "notification_inbox_own_all"
  on notification_inbox for all
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ============================================================================
-- Trigger: Fan-out notification to inbox for all targeted users
-- Khi admin insert vào bảng notifications, tự động tạo inbox entry cho user.
-- ============================================================================
create or replace function public.fn_fanout_notification_to_inbox()
returns trigger
language plpgsql
security definer
as $$
begin
  -- target_type = 'all': gửi cho tất cả user có push_enabled hoặc email_enabled
  if new.target_type = 'all' then
    insert into notification_inbox (user_id, notification_id)
    select p.id, new.id
    from profiles p
    left join user_notification_preferences unp on unp.user_id = p.id
    where (unp.push_enabled is null or unp.push_enabled = true
           or unp.email_enabled is null or unp.email_enabled = true)
    on conflict (user_id, notification_id) do nothing;

  -- target_type = 'specific_users': gửi cho danh sách user IDs cụ thể
  elsif new.target_type = 'specific_users' and new.target_ids is not null then
    insert into notification_inbox (user_id, notification_id)
    select unnest(new.target_ids), new.id
    on conflict (user_id, notification_id) do nothing;

  -- target_type = 'premium': gửi cho user có gói premium/pro
  elsif new.target_type = 'premium' then
    insert into notification_inbox (user_id, notification_id)
    select s.user_id, new.id
    from subscriptions s
    join plans pl on pl.id = s.plan_id
    where lower(pl.name) in ('premium', 'pro')
      and s.status = 'active'
    on conflict (user_id, notification_id) do nothing;

  -- target_type = 'free': gửi cho user chưa có gói trả phí
  elsif new.target_type = 'free' then
    insert into notification_inbox (user_id, notification_id)
    select p.id, new.id
    from profiles p
    where p.id not in (
      select user_id from subscriptions
      where status = 'active'
        and plan_id in (select id from plans where lower(name) in ('premium','pro'))
    )
    on conflict (user_id, notification_id) do nothing;

  -- target_type = 'active': gửi cho user đăng nhập trong 30 ngày qua
  elsif new.target_type = 'active' then
    insert into notification_inbox (user_id, notification_id)
    select distinct user_id, new.id
    from analytics_events
    where created_at >= now() - interval '30 days'
    on conflict (user_id, notification_id) do nothing;
  end if;

  -- Cập nhật sent_at trên notification
  update notifications set sent_at = now() where id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_fanout_notification on notifications;
create trigger trg_fanout_notification
  after insert on notifications
  for each row
  execute function public.fn_fanout_notification_to_inbox();
