'use client';

import { useEffect, useState } from 'react';
import { useUserTenant } from '@/hooks/use-user-tenant';
import { updateWidgetConfig } from '@/lib/queries/widget-config';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Loader2,
  Webhook,
  Mail,
  Globe,
  Plus,
  X,
  Zap,
  BarChart3,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { SaveButton } from '@/components/ui/save-button';
import { PageHeader } from '@/components/dashboard/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

import { formatWebhookPayload, shouldSkipSigning, type WebhookFormat } from '@/lib/webhooks/format';

interface IntegrationConfig {
  webhook_url: string;
  webhook_secret: string;
  webhook_format: WebhookFormat;
  notification_emails: string[];
  allowed_origins: string[];
  gtm_container_id: string;
  forward_to_webhook: boolean;
  store_submissions: boolean;
}

export default function IntegrationSettingsPage() {
  const { tenantId, supabase, loading } = useUserTenant();
  const [config, setConfig] = useState<IntegrationConfig>({
    webhook_url: '',
    webhook_secret: '',
    webhook_format: 'generic',
    notification_emails: [],
    allowed_origins: [],
    gtm_container_id: '',
    forward_to_webhook: false,
    store_submissions: true,
  });
  const [configLoading, setConfigLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newOrigin, setNewOrigin] = useState('');

  useEffect(() => {
    if (!tenantId) return;
    async function loadConfig() {
      const { data: widgetConfig } = await supabase
        .from('widget_configs')
        .select(
          'webhook_url, webhook_secret, webhook_format, notification_emails, allowed_origins, gtm_container_id, forward_to_webhook, store_submissions'
        )
        .eq('tenant_id', tenantId)
        .single();

      if (widgetConfig) {
        setConfig({
          webhook_url: widgetConfig.webhook_url ?? '',
          webhook_secret: widgetConfig.webhook_secret ?? '',
          webhook_format: (widgetConfig.webhook_format as WebhookFormat) ?? 'generic',
          notification_emails: widgetConfig.notification_emails ?? [],
          allowed_origins: widgetConfig.allowed_origins ?? [],
          gtm_container_id: widgetConfig.gtm_container_id ?? '',
          forward_to_webhook: widgetConfig.forward_to_webhook === true,
          store_submissions: widgetConfig.store_submissions !== false,
        });
      }
      setConfigLoading(false);
    }

    loadConfig();
  }, [tenantId, supabase]);

  async function handleSave() {
    if (!tenantId) return;

    const forward = config.forward_to_webhook;
    const store = config.store_submissions;

    // Every submission must have somewhere to go.
    if (!forward && !store) {
      throw new Error('Choose at least one destination: forward to webhook or store leads in your dashboard.');
    }
    if (forward && !config.webhook_url.trim()) {
      throw new Error('Add a webhook URL to forward submissions, or turn forwarding off.');
    }

    await updateWidgetConfig(supabase, tenantId, {
      webhook_url: config.webhook_url || null,
      webhook_secret: config.webhook_secret || null,
      webhook_format: config.webhook_format,
      notification_emails: config.notification_emails,
      allowed_origins: config.allowed_origins,
      gtm_container_id: config.gtm_container_id.trim() || null,
      forward_to_webhook: forward,
      store_submissions: store,
    });
  }

  async function handleTestWebhook() {
    if (!config.webhook_url) return;
    setTesting(true);
    setTestResult(null);

    try {
      const testPayload = formatWebhookPayload(config.webhook_format, {
        event: 'submission.created',
        submission: {
          id: '00000000-0000-0000-0000-000000000000',
          tenant_id: tenantId,
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane.doe@example.com',
          phone: '(555) 555-1234',
          date_of_birth: '1990-01-15',
          location: 'Main Office',
          location_id: null,
          gender: 'female',
          area_of_concern: 'Upper Face, Lips',
          concerns: 'Wrinkles, Fine Lines, Lip Volume',
          selected_regions: [
            { region_id: '00000000-0000-0000-0000-000000000001', region_name: 'Upper Face', region_slug: 'upper-face' },
            { region_id: '00000000-0000-0000-0000-000000000002', region_name: 'Lips', region_slug: 'lips' },
          ],
          selected_concerns: [
            { concern_id: '00000000-0000-0000-0000-000000000003', concern_name: 'Wrinkles', region_id: '00000000-0000-0000-0000-000000000001', region_name: 'Upper Face' },
            { concern_id: '00000000-0000-0000-0000-000000000004', concern_name: 'Fine Lines', region_id: '00000000-0000-0000-0000-000000000001', region_name: 'Upper Face' },
            { concern_id: '00000000-0000-0000-0000-000000000005', concern_name: 'Lip Volume', region_id: '00000000-0000-0000-0000-000000000002', region_name: 'Lips' },
          ],
          selected_services: [],
          custom_fields: {},
          sms_opt_in: true,
          email_opt_in: true,
          source_url: 'https://example.com/treatments',
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'spring-promo',
          utm_content: 'banner-ad',
          utm_term: 'botox near me',
          submitted_at: new Date().toISOString(),
        },
      });
      const response = await fetch(config.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });
      setTestResult(
        response.ok
          ? `Success (${response.status})`
          : `Failed (${response.status})`
      );
    } catch {
      setTestResult('Failed - could not reach the URL');
    }
    setTesting(false);
  }

  function addEmail() {
    const email = newEmail.trim();
    if (email && !config.notification_emails.includes(email)) {
      setConfig({
        ...config,
        notification_emails: [...config.notification_emails, email],
      });
      setNewEmail('');
    }
  }

  function removeEmail(email: string) {
    setConfig({
      ...config,
      notification_emails: config.notification_emails.filter(
        (e) => e !== email
      ),
    });
  }

  function addOrigin() {
    const origin = newOrigin.trim();
    if (origin && !config.allowed_origins.includes(origin)) {
      setConfig({
        ...config,
        allowed_origins: [...config.allowed_origins, origin],
      });
      setNewOrigin('');
    }
  }

  function removeOrigin(origin: string) {
    setConfig({
      ...config,
      allowed_origins: config.allowed_origins.filter((o) => o !== origin),
    });
  }

  if (loading || configLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Integration" description="Configure webhooks and notifications">
        <SaveButton onSave={handleSave} />
      </PageHeader>

      {/* Submission Destination */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Submission Destination
          </CardTitle>
          <CardDescription>
            Choose what happens when a visitor submits the form. At least one
            must be enabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Forward to webhook</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send each submission to the webhook URL below (e.g. your CRM).
              </p>
            </div>
            <Switch
              checked={config.forward_to_webhook}
              onCheckedChange={(v) => setConfig({ ...config, forward_to_webhook: v })}
            />
          </div>
          <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Store leads in your dashboard</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Save submissions to your Submissions tab (where you can view and
                delete them). Turn off if you only want leads in your CRM.
              </p>
            </div>
            <Switch
              checked={config.store_submissions}
              onCheckedChange={(v) => setConfig({ ...config, store_submissions: v })}
            />
          </div>
          {!config.forward_to_webhook && !config.store_submissions && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-900">
                With both off, submissions have nowhere to go and the form will
                reject them. Enable at least one before saving.
              </p>
            </div>
          )}
          {config.forward_to_webhook && !config.webhook_url.trim() && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-900">
                Add a Webhook URL below for forwarding to work.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhook
          </CardTitle>
          <CardDescription>
            Where submissions are forwarded when &ldquo;Forward to webhook&rdquo; is on
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook_url">Webhook URL</Label>
            <Input
              id="webhook_url"
              type="url"
              value={config.webhook_url}
              onChange={(e) =>
                setConfig({ ...config, webhook_url: e.target.value })
              }
              placeholder="https://your-api.com/webhooks/treatment-builder"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhook_secret">Webhook Secret</Label>
            <Input
              id="webhook_secret"
              type="password"
              value={config.webhook_secret}
              onChange={(e) =>
                setConfig({ ...config, webhook_secret: e.target.value })
              }
              placeholder="whsec_..."
            />
            <p className="text-xs text-muted-foreground">
              Used to verify the webhook payload signature
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhook_format">Payload Format</Label>
            <select
              id="webhook_format"
              value={config.webhook_format}
              onChange={(e) =>
                setConfig({ ...config, webhook_format: e.target.value as WebhookFormat })
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="generic">Generic JSON</option>
              <option value="crm_flat">CRM (flat)</option>
              <option value="discord">Discord</option>
              <option value="slack">Slack</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Choose the format that matches your webhook receiver. CRM (flat) sends the same flat lead shape as the browser-direct submission. Discord and Slack skip HMAC signing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestWebhook}
              disabled={testing || !config.webhook_url}
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Test Webhook
            </Button>
            {testResult && (
              <span
                className={`text-sm ${testResult.startsWith('Success') ? 'text-green-600' : 'text-red-600'}`}
              >
                {testResult}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Emails */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Notification Emails
          </CardTitle>
          <CardDescription>
            Receive email notifications for new submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.notification_emails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.notification_emails.map((email) => (
                <Badge
                  key={email}
                  variant="secondary"
                  className="gap-1.5 py-1.5 pl-3 pr-1.5"
                >
                  {email}
                  <button
                    onClick={() => removeEmail(email)}
                    className="rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="team@example.com"
              onKeyDown={(e) => e.key === 'Enter' && addEmail()}
            />
            <Button variant="outline" onClick={addEmail}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Allowed Origins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Allowed Origins
          </CardTitle>
          <CardDescription>
            Domains where your widget is expected to load (for your reference
            only — the widget uses permissive CORS to work on any website)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.allowed_origins.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.allowed_origins.map((origin) => (
                <Badge
                  key={origin}
                  variant="secondary"
                  className="gap-1.5 py-1.5 pl-3 pr-1.5 font-mono text-xs"
                >
                  {origin}
                  <button
                    onClick={() => removeOrigin(origin)}
                    className="rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              placeholder="https://www.yourwebsite.com"
              onKeyDown={(e) => e.key === 'Enter' && addOrigin()}
            />
            <Button variant="outline" onClick={addOrigin}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This list is for your records. The widget will function on any
            domain. Include the full origin with protocol (e.g.,
            https://example.com).
          </p>
        </CardContent>
      </Card>

      {/* Analytics / GTM */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </CardTitle>
          <CardDescription>
            Track conversions on the hosted consultation page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gtm_container_id">Google Tag Manager Container ID</Label>
            <Input
              id="gtm_container_id"
              value={config.gtm_container_id}
              onChange={(e) =>
                setConfig({ ...config, gtm_container_id: e.target.value })
              }
              placeholder="GTM-XXXXXXX"
            />
            {config.gtm_container_id.trim() &&
              !/^GTM-[A-Z0-9]+$/i.test(config.gtm_container_id.trim()) && (
                <p className="text-xs text-red-600">
                  Must be a valid GTM container ID, e.g. GTM-XXXXXXX.
                </p>
              )}
            <p className="text-xs text-muted-foreground">
              Only needed for the hosted consultation page. When set, that page
              loads this container and fires a{' '}
              <code className="font-mono">consultBuilder.formSubmission</code>{' '}
              dataLayer event on submit. Embeds use your own site&apos;s GTM, so
              this isn&apos;t required for them.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
