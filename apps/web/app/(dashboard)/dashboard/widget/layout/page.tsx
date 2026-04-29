'use client';

import { useEffect, useState } from 'react';
import { useUserTenant } from '@/hooks/use-user-tenant';
import { updateWidgetConfig } from '@/lib/queries/widget-config';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Columns2, ListOrdered } from 'lucide-react';
import { logAuditClient } from '@/lib/audit/client';
import { SaveButton } from '@/components/ui/save-button';
import { PageHeader } from '@/components/dashboard/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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
  const { tenantId, supabase, loading } = useUserTenant();
  const [selected, setSelected] = useState<WidgetLayout>('split');
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    async function load() {
      const { data: config } = await supabase
        .from('widget_configs')
        .select('widget_layout')
        .eq('tenant_id', tenantId)
        .single();

      if (config?.widget_layout) {
        setSelected(config.widget_layout as WidgetLayout);
      }
      setConfigLoading(false);
    }

    load();
  }, [tenantId, supabase]);

  async function handleSave() {
    if (!tenantId) return;
    await updateWidgetConfig(supabase, tenantId, { widget_layout: selected });

    logAuditClient({
      action: 'widget_config.layout_updated',
      entity_type: 'widget_config',
      new_data: { widget_layout: selected },
    });
  }

  if (loading || configLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Widget Layout" description="Choose how the widget presents content to visitors">
        <SaveButton onSave={handleSave} />
      </PageHeader>

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
