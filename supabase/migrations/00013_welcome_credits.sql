-- Auto-grant 2 free credits (1 try-on) when a new profile is created
create or replace function public.grant_welcome_credits()
returns trigger as $$
begin
  insert into public.user_credits (user_id, balance, lifetime_earned, lifetime_spent)
  values (new.id, 2, 2, 0)
  on conflict (user_id) do nothing;

  insert into public.credit_transactions (user_id, amount, type, reference_type, description)
  values (new.id, 2, 'bonus', 'welcome', 'Chào mừng! Bạn nhận 2 credits miễn phí để dùng Try-On');

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row
  execute function public.grant_welcome_credits();
