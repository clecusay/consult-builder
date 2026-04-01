-- Remove the overly permissive anonymous insert policy on form_submissions.
-- All public submissions go through the API route which uses the service role
-- client (bypasses RLS). Authenticated tenant members + platform admins already
-- have their own policies.

DROP POLICY IF EXISTS "Anyone can submit forms" ON public.form_submissions;

-- Allow authenticated users belonging to the tenant to insert (for any future
-- dashboard-initiated submissions or imports):
CREATE POLICY "Authenticated users can insert own tenant submissions"
  ON public.form_submissions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND tenant_id = public.current_tenant_id()
  );
