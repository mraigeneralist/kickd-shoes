-- ===========================================================================
-- Kickd — Supabase schema
-- Run this entire file in the Supabase SQL Editor (Dashboard → SQL Editor →
-- New query → paste → Run). Safe to re-run: it uses IF NOT EXISTS / OR REPLACE.
-- After running schema.sql, run supabase/seed.sql to load the 9 demo products.
-- ===========================================================================

-- gen_random_uuid() lives in pgcrypto (enabled by default on Supabase).
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Saved shipping address (one per user). Prefilled at checkout and updated
-- whenever a user places an order, so they don't re-enter it every time.
-- alter ... if not exists keeps this safe to run on an existing profiles table.
alter table public.profiles add column if not exists shipping_line1   text;
alter table public.profiles add column if not exists shipping_line2   text;
alter table public.profiles add column if not exists shipping_city    text;
alter table public.profiles add column if not exists shipping_state   text;
alter table public.profiles add column if not exists shipping_pincode text;

-- ---------------------------------------------------------------------------
-- Helper: is_admin(uid)
-- SECURITY DEFINER so RLS policies can check admin status without recursing
-- into the profiles table's own policies. Defined AFTER profiles so the
-- SQL function body can resolve the table reference at creation time.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent a normal logged-in user from making themselves an admin.
-- (auth.uid() is null for SQL Editor / service-role calls, which are trusted.)
create or replace function public.guard_admin_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and new.is_admin is distinct from old.is_admin
     and not public.is_admin(auth.uid()) then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_admin_flag_trg on public.profiles;
create trigger guard_admin_flag_trg
  before update on public.profiles
  for each row execute function public.guard_admin_flag();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name        text not null,
  slug        text not null unique,
  description text,
  price       numeric(10, 2) not null check (price >= 0),  -- INR rupees
  image_url   text,
  is_featured boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx on public.products (is_active);
create index if not exists products_featured_idx on public.products (is_featured);

-- ---------------------------------------------------------------------------
-- product_sizes  (per-size stock)
-- ---------------------------------------------------------------------------
create table if not exists public.product_sizes (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  size        text not null,
  stock       integer not null default 0 check (stock >= 0),
  unique (product_id, size)
);
create index if not exists product_sizes_product_idx on public.product_sizes (product_id);

-- ---------------------------------------------------------------------------
-- cart_items  (per-user persistent cart)
-- ---------------------------------------------------------------------------
create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  size        text not null,
  quantity    integer not null default 1 check (quantity > 0),
  created_at  timestamptz not null default now(),
  unique (user_id, product_id, size)
);
create index if not exists cart_items_user_idx on public.cart_items (user_id);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  status              text not null default 'pending'
                        check (status in ('pending','paid','failed','shipped','delivered')),
  total_amount        numeric(10, 2) not null,
  currency            text not null default 'INR',
  razorpay_order_id   text,
  razorpay_payment_id text,
  razorpay_signature  text,
  shipping_name       text not null,
  shipping_phone      text not null,
  shipping_line1      text not null,
  shipping_line2      text,
  shipping_city       text not null,
  shipping_state      text not null,
  shipping_pincode    text not null,
  created_at          timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_rzp_order_idx on public.orders (razorpay_order_id);

-- ---------------------------------------------------------------------------
-- order_items  (line items with price/name snapshots)
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price   numeric(10, 2) not null,
  size         text not null,
  quantity     integer not null check (quantity > 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- decrement_stock(order_id)
-- Atomically reduce per-size stock for every line in a paid order.
-- Called server-side (service role) inside the payment-verify step.
-- ---------------------------------------------------------------------------
create or replace function public.decrement_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  for item in
    select product_id, size, quantity
    from public.order_items
    where order_id = p_order_id
  loop
    update public.product_sizes
       set stock = greatest(stock - item.quantity, 0)
     where product_id = item.product_id
       and size = item.size;
  end loop;
end;
$$;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.profiles      enable row level security;
alter table public.categories    enable row level security;
alter table public.products      enable row level security;
alter table public.product_sizes enable row level security;
alter table public.cart_items    enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;

-- ---- profiles ----
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---- categories (public read, admin write) ----
drop policy if exists "categories_read" on public.categories;
create policy "categories_read" on public.categories
  for select using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---- products (public read active, admin write/read all) ----
drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products
  for select using (is_active or public.is_admin(auth.uid()));

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---- product_sizes (public read, admin write) ----
drop policy if exists "product_sizes_read" on public.product_sizes;
create policy "product_sizes_read" on public.product_sizes
  for select using (true);

drop policy if exists "product_sizes_admin_write" on public.product_sizes;
create policy "product_sizes_admin_write" on public.product_sizes
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---- cart_items (owner only) ----
drop policy if exists "cart_owner_all" on public.cart_items;
create policy "cart_owner_all" on public.cart_items
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---- orders (owner read only; writes via service role) ----
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- ---- order_items (read if parent order is owned; writes via service role) ----
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

-- ===========================================================================
-- Storage: product-images bucket (admin-uploaded product photos)
-- ===========================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_write" on storage.objects;
create policy "product_images_admin_write" on storage.objects
  for all
  using (bucket_id = 'product-images' and public.is_admin(auth.uid()))
  with check (bucket_id = 'product-images' and public.is_admin(auth.uid()));

-- ===========================================================================
-- Done. Next: run supabase/seed.sql, then make yourself an admin with:
--   update public.profiles set is_admin = true where id = auth.uid();
-- (or replace auth.uid() with your user id from Authentication → Users)
-- ===========================================================================
