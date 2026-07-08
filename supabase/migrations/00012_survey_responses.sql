-- Survey Responses Table
create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),

  user_id uuid null,
  session_id text null,

  feature text not null check (feature in ('quiz', 'recommender', 'tryon')),
  survey_version text not null default 'v1',

  context jsonb not null default '{}',
  responses jsonb not null default '{}',

  sheets_synced boolean not null default false,
  sheets_row int null,
  sheets_error text null,

  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_survey_user_feature
on public.survey_responses(user_id, feature, survey_version);

create index if not exists idx_survey_session_feature
on public.survey_responses(session_id, feature, survey_version);

create index if not exists idx_survey_feature_created
on public.survey_responses(feature, created_at desc);

-- Unique constraints to prevent duplicate submissions
-- For logged-in users: unique per user + feature + version
create unique index if not exists uq_survey_user_feature_version
on public.survey_responses(user_id, feature, survey_version)
where user_id is not null;

-- For anonymous users: unique per session + feature + version
create unique index if not exists uq_survey_session_feature_version
on public.survey_responses(session_id, feature, survey_version)
where user_id is null;

-- RLS Policies
alter table public.survey_responses enable row level security;

-- Users can insert their own responses (with session_id)
create policy "Users can insert own survey responses"
on public.survey_responses
for insert
with check (
  (user_id is not null and auth.uid() = user_id)
  or (user_id is null and session_id is not null)
);

-- Users can view their own responses
create policy "Users can view own survey responses"
on public.survey_responses
for select
using (
  (user_id is not null and auth.uid() = user_id)
  or (user_id is null and session_id is not null)
);

-- Admins can view all responses
create policy "Admins can view all survey responses"
on public.survey_responses
for select
using (
  exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid() and au.is_active = true
  )
);

-- Admins can update (for sync status)
create policy "Admins can update survey responses"
on public.survey_responses
for update
using (
  exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid() and au.is_active = true
  )
);

-- System setting for survey version
insert into public.system_settings (key, value, description, updated_by)
values (
  'survey_version',
  '"v1"',
  'Current survey version for all features',
  (select id from public.profiles where email = 'admin@redo.vn' limit 1)
)
on conflict (key) do update set value = excluded.value, updated_at = now();