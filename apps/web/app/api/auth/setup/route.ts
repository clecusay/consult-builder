import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

const setupSchema = z.object({
  user_id: z.string().uuid(),
  center_name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100),
  full_name: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = setupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { user_id, center_name, slug, full_name } = parsed.data;
    const supabase = await createServiceRoleClient();

    // Check if slug is taken
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    const finalSlug = existingTenant
      ? `${slug}-${Date.now().toString(36)}`
      : slug;

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: center_name,
        slug: finalSlug,
      })
      .select()
      .single();

    if (tenantError) {
      return NextResponse.json(
        { error: 'Failed to create center', details: tenantError.message },
        { status: 500 }
      );
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id,
        tenant_id: tenant.id,
        role: 'center_admin',
        full_name,
      });

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to create profile', details: profileError.message },
        { status: 500 }
      );
    }

    // Create default widget config
    const { error: configError } = await supabase
      .from('widget_configs')
      .insert({
        tenant_id: tenant.id,
      });

    if (configError) {
      return NextResponse.json(
        { error: 'Failed to create widget config', details: configError.message },
        { status: 500 }
      );
    }

    // Create default primary location
    const { error: locationError } = await supabase
      .from('tenant_locations')
      .insert({
        tenant_id: tenant.id,
        name: 'Main Office',
        is_primary: true,
      });

    if (locationError) {
      console.error('Failed to create default location:', locationError);
    }

    return NextResponse.json({ tenant_id: tenant.id, slug: finalSlug });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
