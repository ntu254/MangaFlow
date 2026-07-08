-- Atomic credit deduction function to prevent race conditions.
-- Returns TRUE if credits were successfully deducted, FALSE if insufficient balance.
create or replace function public.deduct_credits(p_user_id uuid, p_cost int default 1)
returns boolean as $$
declare
  rows_affected int;
begin
  update public.user_credits
  set balance = balance - p_cost,
      lifetime_spent = lifetime_spent + p_cost,
      updated_at = now()
  where user_id = p_user_id
    and balance >= p_cost;
  
  get diagnostics rows_affected = row_count;
  return rows_affected > 0;
end;
$$ language plpgsql security definer;

-- Atomic credit refund (used when AI call fails after pre-deduction)
create or replace function public.refund_credits(p_user_id uuid, p_cost int default 1)
returns void as $$
begin
  update public.user_credits
  set balance = balance + p_cost,
      lifetime_spent = greatest(0, lifetime_spent - p_cost),
      updated_at = now()
  where user_id = p_user_id;
end;
$$ language plpgsql security definer;
