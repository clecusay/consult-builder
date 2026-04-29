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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, Building2, CreditCard, Globe } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SaveButton } from '@/components/ui/save-button';
import { toast } from 'sonner';
import { TENANT_STATUS_STYLES, PLAN_STYLES } from '@/lib/constants/badge-styles';

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  billing_plan: string;
  website_url: string | null;
}

export default function SettingsPage() {
  const { tenantId, supabase, loading } = useUserTenant();
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');

  useEffect(() => {
    if (!tenantId) return;
    async function loadTenant() {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id, name, slug, status, billing_plan, website_url')
        .eq('id', tenantId)
        .single();

      if (tenantData) {
        setTenant(tenantData);
        setWebsiteUrl(tenantData.website_url || '');
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

  async function handleSaveWebsite() {
    if (!tenantId) return;
    const { error } = await supabase
      .from('tenants')
      .update({ website_url: websiteUrl.trim() || null })
      .eq('id', tenantId);
    if (error) throw new Error(error.message);
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

          {/* Website URL */}
          <div className="space-y-2">
            <Label htmlFor="website-url" className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Website URL
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="website-url"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://www.yourpractice.com"
                className="max-w-sm"
              />
              <SaveButton onSave={handleSaveWebsite} />
            </div>
            <p className="text-xs text-muted-foreground">
              Shown as a &quot;Return to website&quot; link in your widget
            </p>
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
