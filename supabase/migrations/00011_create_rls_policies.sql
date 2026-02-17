-- ============================================================
-- Migration: Helper functions + RLS policies for all tables
-- Must run after user_profiles table exists (migration 00003)
-- ============================================================

-- Helper function: check if current user is platform admin
create or replace function public.is_platform_admin()
returns boolean as $$
  select exists (
    select 1 from public.user_profiles
    where user_id = auth.uid()
      and role = 'platform_admin'
  );
$$ language sql security definer stable;

-- Helper function: get current user's tenant_id
create or replace function public.current_tenant_id()
returns uuid as $$
  select tenant_id from public.user_profiles
  where user_id = auth.uid()
  limit 1;
$$ language sql security definer stable;


-- ========================
-- tenants
-- ========================
create policy "Platform admins can manage all tenants"
  on public.tenants for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "Tenant members can view own tenant"
  on public.tenants for select
  using (id = public.current_tenant_id());

create policy "Center admins can update own tenant"
  on public.tenants for update
  using (
    id = public.current_tenant_id()
    and exists (
      select 1 from public.user_profiles
      where user_id = auth.uid()
        and role = 'center_admin'
    )
  );


-- ========================
-- tenant_locations
-- ========================
create policy "Platform admins manage all locations"
  on public.tenant_locations for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "Tenant members can view own locations"
  on public.tenant_locations for select
  using (tenant_id = public.current_tenant_id());

create policy "Center admins can manage own locations"
  on public.tenant_locations for all
  using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'center_admin'
    )
  )
  with check (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'center_admin'
    )
  );


-- ========================
-- user_profiles
-- ========================
create policy "Users can view own profile"
  on public.user_profiles for select
  using (user_id = auth.uid());

create policy "Users can update own profile"
  on public.user_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Platform admins manage all profiles"
  on public.user_profiles for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "Center admins can view tenant profiles"
  on public.user_profiles for select
  using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_profiles up
      where up.user_id = auth.uid() and up.role = 'center_admin'
    )
  );

create policy "Center admins can manage tenant profiles"
  on public.user_profiles for insert
  with check (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_profiles up
      where up.user_id = auth.uid() and up.role = 'center_admin'
    )
  );


-- ========================
-- widget_configs
-- ========================
create policy "Widget configs are publicly readable"
  on public.widget_configs for select
  using (true);

create policy "Platform admins manage all widget configs"
  on public.widget_configs for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "Center admins manage own widget config"
  on public.widget_configs for update
  using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'center_admin'
    )
  );


-- ========================
-- body_regions
-- ========================
create policy "Body regions are publicly readable"
  on public.body_regions for select
  using (true);

create policy "Platform admins manage all body regions"
  on public.body_regions for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "Center admins manage own body regions"
  on public.body_regions for all
  using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'center_admin'
    )
  )
  with check (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'center_admin'
    )
  );


-- ========================
-- concerns
-- ========================
create policy "Concerns are publicly readable"
  on public.concerns for select
  using (true);

create policy "Platform admins manage all concerns"
  on public.concerns for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "Center admins manage own concerns"
  on public.concerns for all
  using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'center_admin'
    )
  )
  with check (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'center_admin'
    )
  );


-- ========================
-- form_fields
-- ========================
create policy "Form fields are publicly readable"
  on public.form_fields for select
  using (true);

create policy "Platform admins manage all form fields"
  on public.form_fields for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "Center admins manage own form fields"
  on public.form_fields for all
  using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'center_admin'
    )
  )
  with check (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'center_admin'
    )
  );


-- ========================
-- form_submissions
-- ========================
create policy "Anyone can submit forms"
  on public.form_submissions for insert
  with check (true);

create policy "Platform admins manage all submissions"
  on public.form_submissions for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "Tenant members can view own submissions"
  on public.form_submissions for select
  using (tenant_id = public.current_tenant_id());

create policy "Tenant members can update own submissions"
  on public.form_submissions for update
  using (tenant_id = public.current_tenant_id());


-- ========================
-- api_keys
-- ========================
create policy "Platform admins manage all api keys"
  on public.api_keys for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "Center admins manage own api keys"
  on public.api_keys for all
  using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'center_admin'
    )
  )
  with check (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'center_admin'
    )
  );


-- ========================
-- audit_logs
-- ========================
create policy "Platform admins can view all audit logs"
  on public.audit_logs for select
  using (public.is_platform_admin());

create policy "Center admins can view own audit logs"
  on public.audit_logs for select
  using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'center_admin'
    )
  );

create policy "Authenticated users can create audit logs"
  on public.audit_logs for insert
  with check (auth.uid() is not null);
