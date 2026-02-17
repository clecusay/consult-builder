-- ============================================================
-- Migration: Fix infinite recursion in user_profiles RLS
-- The is_platform_admin() and current_tenant_id() functions
-- query user_profiles, so user_profiles policies can't use them.
-- Use direct auth.uid() checks instead.
-- ============================================================

-- Drop the recursive policies
drop policy if exists "Platform admins manage all profiles" on public.user_profiles;
drop policy if exists "Center admins can view tenant profiles" on public.user_profiles;
drop policy if exists "Center admins can manage tenant profiles" on public.user_profiles;

-- Platform admins: check role directly without helper function
create policy "Platform admins manage all profiles"
  on public.user_profiles for all
  using (
    (select role from public.user_profiles where user_id = auth.uid()) = 'platform_admin'
  )
  with check (
    (select role from public.user_profiles where user_id = auth.uid()) = 'platform_admin'
  );

-- Center admins can view team members in their tenant
create policy "Center admins can view tenant profiles"
  on public.user_profiles for select
  using (
    tenant_id = (select tenant_id from public.user_profiles where user_id = auth.uid())
  );

-- Center admins can insert new team members
create policy "Center admins can manage tenant profiles"
  on public.user_profiles for insert
  with check (
    tenant_id = (select tenant_id from public.user_profiles where user_id = auth.uid())
    and (select role from public.user_profiles where user_id = auth.uid()) = 'center_admin'
  );
