-- Migration to add contact name and phone number directly to public.houses table
alter table public.houses add column contact_name text;
alter table public.houses add column contact_phone text;
