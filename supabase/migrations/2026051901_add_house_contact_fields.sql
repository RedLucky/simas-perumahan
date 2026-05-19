-- Migration to add contact name, phone number, and order number directly to public.houses table
alter table public.houses add column contact_name text;
alter table public.houses add column contact_phone text;
alter table public.houses add column order_number integer not null default 0;

-- Initialize order_number for existing houses based on their MR code sequence
update public.houses
set order_number = cast(substring(code from '[0-9]+') as integer)
where code is not null and code ~ '^[A-Za-z]+-[0-9]+$';

-- Re-create the monthly_dues_arrears_by_house view to include and support sorting by order_number
drop view if exists public.monthly_dues_arrears_by_house cascade;

create or replace view public.monthly_dues_arrears_by_house as
with bounds as (
  select
    coalesce((
      select min(val) from (
        select min(dr.effective_month)::date as val from public.dues_rates dr
        union all
        select min(mdp.month_key)::date as val from public.monthly_dues_payments mdp
      ) s
      where val is not null
    ), date_trunc('month', now())::date) as min_month,
    date_trunc('month', now())::date as max_month
),
months as (
  select generate_series(min_month, max_month, interval '1 month')::date as month_key
  from bounds
),
house_months as (
  select h.id as house_id, h.code, h.display_name, h.order_number, m.month_key
  from public.houses h
  cross join months m
  where h.is_active = true
),
payments as (
  select mdp.house_id, mdp.month_key, sum(mdp.paid_amount)::numeric(14,2) as paid_in_month
  from public.monthly_dues_payments mdp
  group by mdp.house_id, mdp.month_key
),
combined as (
  select
    hm.house_id,
    hm.code,
    hm.display_name,
    hm.order_number,
    hm.month_key,
    public.get_dues_amount_for_month(hm.month_key)::numeric(14,2) as due_in_month,
    coalesce(p.paid_in_month, 0)::numeric(14,2) as paid_in_month
  from house_months hm
  left join payments p
    on p.house_id = hm.house_id
   and p.month_key = hm.month_key
),
cumulative as (
  select
    c.*,
    sum(c.due_in_month) over (partition by c.house_id order by c.month_key) as cumulative_due,
    sum(c.paid_in_month) over (partition by c.house_id order by c.month_key) as cumulative_paid
  from combined c
)
select
  house_id,
  code,
  display_name,
  order_number,
  month_key,
  due_in_month,
  paid_in_month,
  greatest(cumulative_due - cumulative_paid, 0)::numeric(14,2) as arrears_balance,
  case
    when paid_in_month >= greatest((cumulative_due - (cumulative_paid - paid_in_month)), 0) and greatest(cumulative_due - cumulative_paid, 0) = 0 then 'LUNAS'
    when paid_in_month > 0 then 'SEBAGIAN'
    else 'BELUM_BAYAR'
  end as payment_status
from cumulative;

grant select on public.monthly_dues_arrears_by_house to anon, authenticated;

-- SECURITY FIX: Resolve infinite recursion in RLS policies on the admin_profiles table.
-- Redefining public.is_admin_user() as SECURITY DEFINER with set search_path so it
-- executes with privileges of the owner (postgres), safely bypassing the RLS check
-- on admin_profiles while preventing search path hijacking.
create or replace function public.is_admin_user()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1
    from public.admin_profiles ap
    where ap.user_id = auth.uid()
      and ap.is_active = true
  );
end;
$$;

