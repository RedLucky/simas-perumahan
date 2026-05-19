-- SiMas initial schema
-- Date: 2026-05-12

create extension if not exists pgcrypto;

create type public.expense_category as enum (
  'GAJI_SATPAM_FULLTIME',
  'GAJI_SATPAM_MINGGU',
  'GAJI_TUKANG_SAMPAH',
  'THR_SATPAM',
  'THR_TUKANG_SAMPAH',
  'UANG_KEMATIAN',
  'IURAN_17_AGUSTUS',
  'IURAN_HALAL_BIHALAL',
  'LAIN_LAIN'
);

create type public.incidental_event_type as enum (
  'AGUSTUS_17',
  'HALAL_BIHALAL'
);

create type public.ramadan_assignment_type as enum (
  'TAKJIL_MUSHOLA',
  'SAHUR_SATPAM',
  'BUKA_SATPAM'
);

create table public.houses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  period_label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dues_rates (
  id uuid primary key default gen_random_uuid(),
  amount numeric(14,2) not null check (amount >= 0),
  effective_month date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id),
  created_by_name_snapshot text not null
);
create unique index dues_rates_effective_month_uidx on public.dues_rates(effective_month);

create table public.monthly_dues_payments (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id),
  month_key date not null,
  paid_amount numeric(14,2) not null check (paid_amount >= 0),
  paid_at date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id),
  created_by_name_snapshot text not null
);
create index monthly_dues_payments_house_month_idx on public.monthly_dues_payments(house_id, month_key);
create index monthly_dues_payments_month_key_idx on public.monthly_dues_payments(month_key);

create table public.incidental_events (
  id uuid primary key default gen_random_uuid(),
  event_year int not null check (event_year between 2000 and 2100),
  event_type public.incidental_event_type not null,
  amount numeric(14,2) not null check (amount >= 0),
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id),
  created_by_name_snapshot text not null,
  unique (event_year, event_type)
);

create table public.incidental_payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.incidental_events(id) on delete cascade,
  house_id uuid not null references public.houses(id),
  paid_amount numeric(14,2) not null check (paid_amount >= 0),
  paid_at date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id),
  created_by_name_snapshot text not null
);
create index incidental_payments_event_house_idx on public.incidental_payments(event_id, house_id);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category public.expense_category not null,
  amount numeric(14,2) not null check (amount >= 0),
  expense_date date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id),
  created_by_name_snapshot text not null
);
create index expenses_date_idx on public.expenses(expense_date);
create index expenses_category_date_idx on public.expenses(category, expense_date);

create table public.ramadan_schedules (
  id uuid primary key default gen_random_uuid(),
  ramadan_year int not null check (ramadan_year between 2000 and 2100),
  day_number int not null check (day_number > 0 and day_number <= 31),
  assignment_type public.ramadan_assignment_type not null,
  house_id uuid not null references public.houses(id),
  is_published boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id),
  created_by_name_snapshot text not null,
  unique (ramadan_year, day_number, assignment_type)
);
create index ramadan_schedules_year_publish_idx on public.ramadan_schedules(ramadan_year, is_published);

create table public.agenda_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  event_date date not null,
  location text,
  category text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id),
  created_by_name_snapshot text not null
);
create index agenda_posts_event_date_idx on public.agenda_posts(event_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_houses_updated_at
before update on public.houses
for each row
execute function public.set_updated_at();

create trigger trg_admin_profiles_updated_at
before update on public.admin_profiles
for each row
execute function public.set_updated_at();

create trigger trg_dues_rates_updated_at
before update on public.dues_rates
for each row
execute function public.set_updated_at();

create trigger trg_monthly_dues_payments_updated_at
before update on public.monthly_dues_payments
for each row
execute function public.set_updated_at();

create trigger trg_incidental_events_updated_at
before update on public.incidental_events
for each row
execute function public.set_updated_at();

create trigger trg_incidental_payments_updated_at
before update on public.incidental_payments
for each row
execute function public.set_updated_at();

create trigger trg_expenses_updated_at
before update on public.expenses
for each row
execute function public.set_updated_at();

create trigger trg_ramadan_schedules_updated_at
before update on public.ramadan_schedules
for each row
execute function public.set_updated_at();

create trigger trg_agenda_posts_updated_at
before update on public.agenda_posts
for each row
execute function public.set_updated_at();

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.user_id = auth.uid()
      and ap.is_active = true
  );
$$;

create or replace function public.get_dues_amount_for_month(target_month date)
returns numeric
language sql
stable
as $$
  select coalesce((
    select dr.amount
    from public.dues_rates dr
    where dr.effective_month <= date_trunc('month', target_month)::date
    order by dr.effective_month desc
    limit 1
  ), 0)::numeric;
$$;

create or replace view public.cash_summary as
select
  coalesce((select sum(mdp.paid_amount) from public.monthly_dues_payments mdp), 0)::numeric(14,2) as total_monthly_dues,
  coalesce((select sum(ip.paid_amount) from public.incidental_payments ip), 0)::numeric(14,2) as total_incidental_income,
  coalesce((select sum(e.amount) from public.expenses e), 0)::numeric(14,2) as total_expenses,
  (
    coalesce((select sum(mdp.paid_amount) from public.monthly_dues_payments mdp), 0)
    + coalesce((select sum(ip.paid_amount) from public.incidental_payments ip), 0)
    - coalesce((select sum(e.amount) from public.expenses e), 0)
  )::numeric(14,2) as current_balance;

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
  select h.id as house_id, h.code, h.display_name, m.month_key
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

alter table public.houses enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.dues_rates enable row level security;
alter table public.monthly_dues_payments enable row level security;
alter table public.incidental_events enable row level security;
alter table public.incidental_payments enable row level security;
alter table public.expenses enable row level security;
alter table public.ramadan_schedules enable row level security;
alter table public.agenda_posts enable row level security;

create policy houses_public_read
on public.houses
for select
using (true);

create policy houses_admin_write
on public.houses
for all
using (public.is_admin_user())
with check (public.is_admin_user());

create policy admin_profiles_self_or_admin_read
on public.admin_profiles
for select
using (auth.uid() = user_id or public.is_admin_user());

create policy admin_profiles_admin_write
on public.admin_profiles
for all
using (public.is_admin_user())
with check (public.is_admin_user());

create policy dues_rates_public_read
on public.dues_rates
for select
using (true);

create policy dues_rates_admin_write
on public.dues_rates
for all
using (public.is_admin_user())
with check (public.is_admin_user());

create policy monthly_dues_payments_public_read
on public.monthly_dues_payments
for select
using (true);

create policy monthly_dues_payments_admin_write
on public.monthly_dues_payments
for all
using (public.is_admin_user())
with check (public.is_admin_user());

create policy incidental_events_public_read
on public.incidental_events
for select
using (true);

create policy incidental_events_admin_write
on public.incidental_events
for all
using (public.is_admin_user())
with check (public.is_admin_user());

create policy incidental_payments_public_read
on public.incidental_payments
for select
using (true);

create policy incidental_payments_admin_write
on public.incidental_payments
for all
using (public.is_admin_user())
with check (public.is_admin_user());

create policy expenses_public_read
on public.expenses
for select
using (true);

create policy expenses_admin_write
on public.expenses
for all
using (public.is_admin_user())
with check (public.is_admin_user());

create policy ramadan_schedules_public_read_published
on public.ramadan_schedules
for select
using (is_published = true or public.is_admin_user());

create policy ramadan_schedules_admin_write
on public.ramadan_schedules
for all
using (public.is_admin_user())
with check (public.is_admin_user());

create policy agenda_posts_public_read_published
on public.agenda_posts
for select
using (is_published = true or public.is_admin_user());

create policy agenda_posts_admin_write
on public.agenda_posts
for all
using (public.is_admin_user())
with check (public.is_admin_user());

grant select on public.cash_summary to anon, authenticated;
grant select on public.monthly_dues_arrears_by_house to anon, authenticated;
