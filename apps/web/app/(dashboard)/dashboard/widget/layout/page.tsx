'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Save,
  Check,
  Columns2,
  ListOrdered,
} from 'lucide-react';
import { logAuditClient } from '@/lib/audit/client';

type WidgetLayout = 'split' | 'guided';

interface LayoutOption {
  value: WidgetLayout;
  label: string;
  description: string;
  icon: React.ElementType;
}

const layoutOptions: LayoutOption[] = [
  {
    value: 'split',
    label: 'Split View',
    description:
      'Body diagram and concerns panel shown side by side. Visitors can browse areas and concerns at the same time. Best for desktop-first experiences.',
    icon: Columns2,
  },
  {
    value: 'guided',
    label: 'Guided Flow',
    description:
      'A focused step-by-step experience. Each step fills the screen — select areas, then pick concerns, then fill out the form. Great for mobile and simpler journeys.',
    icon: ListOrdered,
  },
];

export default function WidgetLayoutPage() {
  const [selected, setSelected] = useState<WidgetLayout>('split');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
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

      const { data: config } = await supabase
        .from('widget_configs')
        .select('widget_layout')
        .eq('tenant_id', profile.tenant_id)
        .single();

      if (config?.widget_layout) {
        setSelected(config.widget_layout as WidgetLayout);
      }
      setLoading(false);
    }

    load();
  }, [supabase]);

  async function handleSave() {
    if (!tenantId) return;
    setSaving(true);
    setSaved(false);

    await supabase
      .from('widget_configs')
      .update({ widget_layout: selected })
      .eq('tenant_id', tenantId);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    logAuditClient({
      action: 'widget_config.layout_updated',
      entity_type: 'widget_config',
      new_data: { widget_layout: selected },
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
          <h1 className="text-2xl font-bold tracking-tight">Widget Layout</h1>
          <p className="text-muted-foreground">
            Choose how the widget presents content to visitors
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

      {/* Layout selection cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {layoutOptions.map((option) => {
          const isSelected = selected === option.value;
          const Icon = option.icon;
          return (
            <Card
              key={option.value}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'hover:border-slate-300 hover:shadow-sm'
              }`}
              onClick={() => setSelected(option.value)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                      isSelected
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  {isSelected && (
                    <Badge className="bg-indigo-500 text-white">
                      Selected
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-3 text-base">
                  {option.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {option.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            The widget layout controls how content is arranged on screen. Split
            View works best on wider screens, while Guided Flow is optimized for
            mobile devices and simpler user journeys.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
