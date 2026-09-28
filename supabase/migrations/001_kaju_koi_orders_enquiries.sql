-- Applied to Supabase project kaju-koi (rekeliwflholllekqias) on 27 Sep 2026.
create table public.orders (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  reference text unique not null, status text not null default 'pre-order request (unpaid, to confirm)',
  items jsonb not null, total_inr integer not null check (total_inr >= 0),
  customer_name text not null, phone text not null, email text not null, address text not null,
  city text not null, pincode text not null, preferred_date date, gift_card boolean not null default false,
  gift_message text, notes text, is_test boolean not null default false,
  email_notified boolean not null default false, email_error text, user_agent text);
create table public.enquiries (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  reference text unique not null, status text not null default 'new', occasion text not null,
  event_date date, gift_count integer check (gift_count is null or gift_count > 0), budget_per_gift text,
  city text, personalisation text[] not null default '{}', name text not null, company text,
  phone text not null, email text not null, notes text, is_test boolean not null default false,
  email_notified boolean not null default false, email_error text, user_agent text);
create index orders_created_idx on public.orders (created_at desc);
create index enquiries_created_idx on public.enquiries (created_at desc);
alter table public.orders enable row level security;
alter table public.enquiries enable row level security;
revoke all on public.orders from anon, authenticated;
revoke all on public.enquiries from anon, authenticated;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.config (key text primary key, value text not null);
revoke all on private.config from public, anon, authenticated;
create or replace function public.kk_get_config() returns table(key text, value text)
language sql security definer set search_path = '' as $$ select c.key, c.value from private.config c $$;
revoke all on function public.kk_get_config() from public, anon, authenticated;
grant execute on function public.kk_get_config() to service_role;
-- Email notifications are disabled. Optional private.config keys (currently none set):
-- notify_to, notify_from, resend_api_key. The function only emails when all three are present.
