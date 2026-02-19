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
  ArrowRight,
  Layers,
  MessageSquare,
  GitBranch,
} from 'lucide-react';
import { logAuditClient } from '@/lib/audit/client';

type WidgetMode =
  | 'regions_concerns_services'
  | 'regions_services'
  | 'regions_concerns'
  | 'concerns_only'
  | 'services_only';

interface FlowOption {
  mode: WidgetMode;
  label: string;
  description: string;
  icon: React.ElementType;
  steps: string[];
}

const flowOptions: FlowOption[] = [
  {
    mode: 'regions_concerns_services',
    label: 'Full Journey',
    description:
      'Visitors select body regions, then choose their concerns, then see recommended services. Best for full-service plastic surgery centers.',
    icon: GitBranch,
    steps: ['Body Region', 'Concerns', 'Services', 'Form'],
  },
  {
    mode: 'regions_services',
    label: 'Direct Services',
    description:
      'Visitors select body regions, then browse available services for those areas. Ideal for practices focused on specific procedures.',
    icon: ArrowRight,
    steps: ['Body Region', 'Services', 'Form'],
  },
  {
    mode: 'regions_concerns',
    label: 'Concerns Only',
    description:
      'Visitors select body regions and concerns without service matching. Great for general consultation lead capture.',
    icon: MessageSquare,
    steps: ['Body Region', 'Concerns', 'Form'],
  },
{
    mode: 'services_only',
    label: 'Service Menu',
    description:
      'Visitors browse your service catalog directly. Perfect for med spas and practices with a clear service menu.',
    icon: Layers,
    steps: ['Services', 'Form'],
  },
];

export default function WidgetFlowPage() {
  const [selected, setSelected] = useState<WidgetMode>('regions_concerns');
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
        .select('widget_mode')
        .eq('tenant_id', profile.tenant_id)
        .single();

      if (config?.widget_mode) {
        setSelected(config.widget_mode as WidgetMode);
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
      .update({ widget_mode: selected })
      .eq('tenant_id', tenantId);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    logAuditClient({
      action: 'widget_config.flow_updated',
      entity_type: 'widget_config',
      new_data: { widget_mode: selected },
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
          <h1 className="text-2xl font-bold tracking-tight">Widget Flow</h1>
          <p className="text-muted-foreground">
            Choose how visitors interact with your widget
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

      {/* Flow selection cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {flowOptions.map((option) => {
          const isSelected = selected === option.mode;
          const Icon = option.icon;
          return (
            <Card
              key={option.mode}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'hover:border-slate-300 hover:shadow-sm'
              }`}
              onClick={() => setSelected(option.mode)}
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
                <div className="mt-4 rounded-md bg-slate-50 px-3 py-2">
                  <p className="text-xs font-medium text-slate-500 mb-1.5">
                    Flow
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {option.steps.map((step, index) => (
                      <span key={step} className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            isSelected
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {step}
                        </span>
                        {index < option.steps.length - 1 && (
                          <ArrowRight
                            className={`h-3 w-3 ${
                              isSelected
                                ? 'text-indigo-400'
                                : 'text-slate-400'
                            }`}
                          />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            The widget mode determines the steps visitors go through when using
            your treatment builder. All modes end with the consultation form.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
