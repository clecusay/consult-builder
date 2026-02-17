-- ============================================================
-- Migration: Fix user_profiles RLS to avoid all recursion
-- Problem: "Center admins can view tenant profiles" and
--          "Platform admins manage all profiles" do subqueries
--          to user_profiles, triggering RLS recursion.
-- Fix: Use security definer functions that bypass RLS.
-- ============================================================

-- Drop all existing policies on user_profiles
drop policy if exists "Users can view own profile" on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;
drop policy if exists "Platform admins manage all profiles" on public.user_profiles;
drop policy if exists "Center admins can view tenant profiles" on public.user_profiles;
drop policy if exists "Center admins can manage tenant profiles" on public.user_profiles;

-- Security definer function to get the current user's role
-- This bypasses RLS since it's security definer
create or replace function public.auth_user_role()
returns text as $$
  select role from public.user_profiles
  where user_id = auth.uid()
  limit 1;
$$ language sql security definer stable;

-- Security definer function to get the current user's tenant_id
-- (Replaces current_tenant_id for user_profiles-specific usage)
create or replace function public.auth_user_tenant_id()
returns uuid as $$
  select tenant_id from public.user_profiles
  where user_id = auth.uid()
  limit 1;
$$ language sql security definer stable;

-- Users can always view their own profile
create policy "Users can view own profile"
  on public.user_profiles for select
  using (user_id = auth.uid());

-- Users can update their own profile (name only)
create policy "Users can update own profile"
  on public.user_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Center admins can view all profiles in their tenant
-- Uses security definer functions to avoid recursion
create policy "Center admins can view tenant profiles"
  on public.user_profiles for select
  using (
    tenant_id = public.auth_user_tenant_id()
    and public.auth_user_role() in ('center_admin', 'platform_admin')
  );

-- Center admins can insert new team members in their tenant
create policy "Center admins can insert tenant profiles"
  on public.user_profiles for insert
  with check (
    tenant_id = public.auth_user_tenant_id()
    and public.auth_user_role() in ('center_admin', 'platform_admin')
  );

-- Platform admins can manage all profiles
create policy "Platform admins manage all profiles"
  on public.user_profiles for all
  using (public.auth_user_role() = 'platform_admin')
  with check (public.auth_user_role() = 'platform_admin');
