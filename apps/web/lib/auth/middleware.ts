import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { UserRole } from '@treatment-builder/shared';

/**
 * Higher-order function for protecting API routes with role-based access control.
 * Usage:
 *   export const GET = withAuth(['center_admin', 'platform_admin'], async (req, session) => { ... })
 */
export function withAuth(
  allowedRoles: UserRole[],
  handler: (
    request: Request,
    session: {
      user_id: string;
      tenant_id: string;
      role: UserRole;
    }
  ) => Promise<NextResponse>
) {
  return async (request: Request) => {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id, role')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
      }

      if (!allowedRoles.includes(profile.role as UserRole)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return handler(request, {
        user_id: user.id,
        tenant_id: profile.tenant_id,
        role: profile.role as UserRole,
      });
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
