# Supabase SQL Setup (Epic 1)

## Files
- `migrations/2026051201_init_simas.sql`
- `seeds/2026051201_seed_houses.sql`

## Run Order
1. Jalankan migration schema terlebih dulu.
2. Jalankan seed houses.
3. (Opsional) Insert 1 row awal `dues_rates` agar view tunggakan langsung bermakna.

## Optional bootstrap data
Contoh insert iuran awal:

```sql
insert into public.dues_rates (amount, effective_month, note, created_by_name_snapshot)
values (100000, date '2026-01-01', 'Nominal awal', 'System Init');
```

## Quick checks

```sql
select count(*) as total_houses from public.houses;
select * from public.cash_summary;
select * from public.monthly_dues_arrears_by_house limit 33;
```

## Notes
- Akses write seluruh tabel domain dibatasi oleh `is_admin_user()` (berbasis `admin_profiles`).
- Untuk admin pertama: buat user melalui Supabase Auth lalu insert row ke `admin_profiles`.
- `created_by_name_snapshot` disiapkan agar histori transaksi tetap akurat saat pergantian ketua.
