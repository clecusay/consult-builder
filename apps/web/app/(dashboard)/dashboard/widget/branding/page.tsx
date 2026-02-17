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
import { Loader2, Save, Check } from 'lucide-react';

interface BrandingConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  cta_text: string;
  success_message: string;
}

const fontOptions = [
  { label: 'System Default', value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'Open Sans', value: "'Open Sans', sans-serif" },
  { label: 'Lato', value: "'Lato', sans-serif" },
  { label: 'Montserrat', value: "'Montserrat', sans-serif" },
  { label: 'Poppins', value: "'Poppins', sans-serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
];

function ColorField({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-sm"
        />
      </div>
    </div>
  );
}

function WidgetPreview({ config }: { config: BrandingConfig }) {
  const fontLabel =
    fontOptions.find((f) => f.value === config.font_family)?.label ||
    'System Default';

  return (
    <div className="sticky top-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Live Preview</CardTitle>
          <CardDescription>
            How your widget form will look to visitors
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mock widget */}
          <div
            className="border-t p-6"
            style={{ fontFamily: config.font_family }}
          >
            {/* Widget header */}
            <div
              className="rounded-t-lg px-5 py-4"
              style={{ backgroundColor: config.primary_color }}
            >
              <h3 className="text-base font-semibold text-white">
                Book a Consultation
              </h3>
              <p className="mt-0.5 text-xs text-white/70">
                Tell us about your goals
              </p>
            </div>

            {/* Form body */}
            <div className="space-y-3 rounded-b-lg border border-t-0 bg-white p-5">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    First Name
                  </label>
                  <div className="h-8 rounded-md border border-slate-200 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Last Name
                  </label>
                  <div className="h-8 rounded-md border border-slate-200 bg-slate-50" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Email
                </label>
                <div className="h-8 rounded-md border border-slate-200 bg-slate-50" />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Phone
                </label>
                <div className="h-8 rounded-md border border-slate-200 bg-slate-50" />
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Tell us about your goals
                </label>
                <div className="h-16 rounded-md border border-slate-200 bg-slate-50" />
              </div>

              {/* CTA Button */}
              <button
                className="w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: config.accent_color }}
              >
                {config.cta_text}
              </button>

              {/* Font label */}
              <p className="text-center text-[10px] text-slate-400">
                Font: {fontLabel}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WidgetBrandingPage() {
  const [config, setConfig] = useState<BrandingConfig>({
    primary_color: '#1a1a2e',
    secondary_color: '#16213e',
    accent_color: '#0f3460',
    font_family: 'system-ui, -apple-system, sans-serif',
    cta_text: 'Book Your Consultation',
    success_message: 'Thank you! We will be in touch shortly.',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

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
          'primary_color, secondary_color, accent_color, font_family, cta_text, success_message'
        )
        .eq('tenant_id', profile.tenant_id)
        .single();

      if (widgetConfig) {
        setConfig({
          primary_color: widgetConfig.primary_color,
          secondary_color: widgetConfig.secondary_color,
          accent_color: widgetConfig.accent_color,
          font_family: widgetConfig.font_family,
          cta_text: widgetConfig.cta_text,
          success_message: widgetConfig.success_message,
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
        primary_color: config.primary_color,
        secondary_color: config.secondary_color,
        accent_color: config.accent_color,
        font_family: config.font_family,
        cta_text: config.cta_text,
        success_message: config.success_message,
      })
      .eq('tenant_id', tenantId);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
          <h1 className="text-2xl font-bold tracking-tight">
            Widget Branding
          </h1>
          <p className="text-muted-foreground">
            Customize your widget&apos;s appearance
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

      {/* Two-column: Config left, Preview right */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left — Config */}
        <div className="space-y-6 lg:col-span-3">
          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
              <CardDescription>
                Set the color palette for your widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorField
                label="Primary Color"
                id="primary_color"
                value={config.primary_color}
                onChange={(v) => setConfig({ ...config, primary_color: v })}
              />
              <Separator />
              <ColorField
                label="Secondary Color"
                id="secondary_color"
                value={config.secondary_color}
                onChange={(v) => setConfig({ ...config, secondary_color: v })}
              />
              <Separator />
              <ColorField
                label="Accent Color"
                id="accent_color"
                value={config.accent_color}
                onChange={(v) => setConfig({ ...config, accent_color: v })}
              />
            </CardContent>
          </Card>

          {/* Typography & Content */}
          <Card>
            <CardHeader>
              <CardTitle>Typography &amp; Content</CardTitle>
              <CardDescription>
                Set fonts and text content for your widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="font_family">Font Family</Label>
                <select
                  id="font_family"
                  value={config.font_family}
                  onChange={(e) =>
                    setConfig({ ...config, font_family: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  {fontOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="cta_text">CTA Button Text</Label>
                <Input
                  id="cta_text"
                  value={config.cta_text}
                  onChange={(e) =>
                    setConfig({ ...config, cta_text: e.target.value })
                  }
                  placeholder="Book Your Consultation"
                />
                <p className="text-xs text-muted-foreground">
                  The text shown on the main call-to-action button
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="success_message">Success Message</Label>
                <Input
                  id="success_message"
                  value={config.success_message}
                  onChange={(e) =>
                    setConfig({ ...config, success_message: e.target.value })
                  }
                  placeholder="Thank you! We will be in touch shortly."
                />
                <p className="text-xs text-muted-foreground">
                  Displayed after a visitor submits the form
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — Live Preview */}
        <div className="lg:col-span-2">
          <WidgetPreview config={config} />
        </div>
      </div>
    </div>
  );
}
