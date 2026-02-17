import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { UserRole } from '@treatment-builder/shared';

export interface SessionUser {
  id: string;
  email: string;
  profile: {
    id: string;
    tenant_id: string;
    role: UserRole;
    full_name: string | null;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select(`
      id,
      tenant_id,
      role,
      full_name,
      tenants (
        id,
        name,
        slug
      )
    `)
    .eq('user_id', user.id)
    .single();

  if (!profile) return null;

  const tenant = (profile as Record<string, unknown>).tenants as {
    id: string;
    name: string;
    slug: string;
  };

  return {
    id: user.id,
    email: user.email!,
    profile: {
      id: profile.id,
      tenant_id: profile.tenant_id,
      role: profile.role as UserRole,
      full_name: profile.full_name,
    },
    tenant,
  };
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireRole(roles: UserRole[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!roles.includes(session.profile.role)) {
    throw new Error('Forbidden');
  }
  return session;
}
