-- ===========================================================================
-- Migration: saved shipping address on profiles
-- Run this in the Supabase SQL Editor if you already ran schema.sql before the
-- "save my address" feature was added. Safe to re-run.
-- (Fresh installs get these columns from schema.sql automatically.)
-- ===========================================================================

alter table public.profiles add column if not exists shipping_line1   text;
alter table public.profiles add column if not exists shipping_line2   text;
alter table public.profiles add column if not exists shipping_city    text;
alter table public.profiles add column if not exists shipping_state   text;
alter table public.profiles add column if not exists shipping_pincode text;
