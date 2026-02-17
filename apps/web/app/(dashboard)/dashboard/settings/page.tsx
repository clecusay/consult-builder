'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Copy, Check, Building2, CreditCard } from 'lucide-react';

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  billing_plan: string;
}

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  suspended: 'bg-red-100 text-red-700',
};

const planStyles: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  starter: 'bg-blue-100 text-blue-700',
  professional: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

export default function SettingsPage() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadTenant() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id, name, slug, status, billing_plan')
        .eq('id', profile.tenant_id)
        .single();

      if (tenantData) {
        setTenant(tenantData);
      }
      setLoading(false);
    }

    loadTenant();
  }, [supabase]);

  async function copyToClipboard(text: string, setter: (v: boolean) => void) {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        Unable to load settings.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your center profile</p>
      </div>

      {/* Center Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Center Profile
          </CardTitle>
          <CardDescription>
            Basic information about your practice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Center Name */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Center Name
            </p>
            <p className="text-lg font-semibold">{tenant.name}</p>
          </div>

          <Separator />

          {/* Slug */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Slug</p>
            <div className="flex items-center gap-2">
              <code className="rounded-md border bg-muted px-3 py-1.5 font-mono text-sm">
                {tenant.slug}
              </code>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => copyToClipboard(tenant.slug, setCopiedSlug)}
              >
                {copiedSlug ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used in widget embed code and API calls
            </p>
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Badge
              variant="secondary"
              className={statusStyles[tenant.status] ?? ''}
            >
              {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
            </Badge>
          </div>

          <Separator />

          {/* Billing Plan */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Billing Plan
            </p>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={planStyles[tenant.billing_plan] ?? ''}
              >
                <CreditCard className="mr-1 h-3 w-3" />
                {tenant.billing_plan.charAt(0).toUpperCase() +
                  tenant.billing_plan.slice(1)}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Tenant ID */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Tenant ID
            </p>
            <div className="flex items-center gap-2">
              <code className="rounded-md border bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
                {tenant.id}
              </code>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => copyToClipboard(tenant.id, setCopiedId)}
              >
                {copiedId ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
