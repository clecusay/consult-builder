'use client';

import { useEffect, useState } from 'react';
import { useUserTenant } from '@/hooks/use-user-tenant';
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
import { Copy, Check, Building2, CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { TENANT_STATUS_STYLES, PLAN_STYLES } from '@/lib/constants/badge-styles';

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  billing_plan: string;
}

export default function SettingsPage() {
  const { tenantId, supabase, loading } = useUserTenant();
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    async function loadTenant() {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id, name, slug, status, billing_plan')
        .eq('id', tenantId)
        .single();

      if (tenantData) {
        setTenant(tenantData);
      }
      setDataLoading(false);
    }

    loadTenant();
  }, [tenantId, supabase]);

  async function copyToClipboard(text: string, setter: (v: boolean) => void) {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  if (loading || dataLoading) {
    return <LoadingSpinner />;
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
      <PageHeader title="Settings" description="Manage your center profile" />

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
              Used in widget preview URL
            </p>
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Badge
              variant="secondary"
              className={TENANT_STATUS_STYLES[tenant.status] ?? ''}
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
                className={PLAN_STYLES[tenant.billing_plan] ?? ''}
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
