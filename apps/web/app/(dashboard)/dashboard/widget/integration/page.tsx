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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Save,
  Check,
  Webhook,
  Mail,
  Globe,
  Plus,
  X,
  Zap,
} from 'lucide-react';

interface IntegrationConfig {
  webhook_url: string;
  webhook_secret: string;
  notification_emails: string[];
  allowed_origins: string[];
}

export default function IntegrationSettingsPage() {
  const [config, setConfig] = useState<IntegrationConfig>({
    webhook_url: '',
    webhook_secret: '',
    notification_emails: [],
    allowed_origins: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newOrigin, setNewOrigin] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function loadConfig() {
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
      setTenantId(profile.tenant_id);

      const { data: widgetConfig } = await supabase
        .from('widget_configs')
        .select(
          'webhook_url, webhook_secret, notification_emails, allowed_origins'
        )
        .eq('tenant_id', profile.tenant_id)
        .single();

      if (widgetConfig) {
        setConfig({
          webhook_url: widgetConfig.webhook_url ?? '',
          webhook_secret: widgetConfig.webhook_secret ?? '',
          notification_emails: widgetConfig.notification_emails ?? [],
          allowed_origins: widgetConfig.allowed_origins ?? [],
        });
      }
      setLoading(false);
    }

    loadConfig();
  }, [supabase]);

  async function handleSave() {
    if (!tenantId) return;
    setSaving(true);
    setSaved(false);

    await supabase
      .from('widget_configs')
      .update({
        webhook_url: config.webhook_url || null,
        webhook_secret: config.webhook_secret || null,
        notification_emails: config.notification_emails,
        allowed_origins: config.allowed_origins,
      })
      .eq('tenant_id', tenantId);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleTestWebhook() {
    if (!config.webhook_url) return;
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(config.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test',
          timestamp: new Date().toISOString(),
          message: 'This is a test webhook from Consult Builder.',
        }),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integration</h1>
          <p className="text-muted-foreground">
            Configure webhooks and notifications
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
        </Button>
      </div>

      {/* Webhook Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhook
          </CardTitle>
          <CardDescription>
            Receive real-time notifications when new submissions arrive
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
            Domains where your widget is allowed to load (CORS)
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
            Leave empty to allow all origins. Include the full origin with
            protocol (e.g., https://example.com).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
