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
import {
  ArrowRight,
  MessageSquare,
  GitBranch,
  LayoutGrid,
  Bone,
} from 'lucide-react';
import { logAuditClient } from '@/lib/audit/client';
import { SaveButton } from '@/components/ui/save-button';
import { PageHeader } from '@/components/dashboard/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

type WidgetMode =
  | 'regions_services'
  | 'regions_concerns'
  | 'treatment_builder';

interface FlowOption {
  mode: WidgetMode;
  label: string;
  description: string;
  icon: React.ElementType;
  steps: string[];
}

const flowOptions: FlowOption[] = [
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
    label: 'Concerns Focus',
    description:
      'Visitors select body regions and concerns without service matching. Great for general consultation lead capture.',
    icon: MessageSquare,
    steps: ['Body Region', 'Concerns', 'Form'],
  },
  {
    mode: 'treatment_builder',
    label: 'Treatment Builder',
    description:
      'A guided, consultative experience. Visitors share their concerns, desired outcomes, and barriers before connecting with your team.',
    icon: GitBranch,
    steps: ['Body Area', 'Pain Points', 'Outcomes', 'Barriers', 'Bridge', 'Lead Capture'],
  },
];

type RegionStyle = 'diagram' | 'cards';

const regionStyleOptions: { value: RegionStyle; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: 'diagram',
    label: 'Body Diagram',
    description: 'Interactive SVG silhouette with clickable body regions',
    icon: Bone,
  },
  {
    value: 'cards',
    label: 'Card Grid',
    description: 'Clean card layout for selecting body areas — modern and mobile-friendly',
    icon: LayoutGrid,
  },
];

export default function WidgetFlowPage() {
  const { tenantId, supabase, loading } = useUserTenant();
  const [selected, setSelected] = useState<WidgetMode>('regions_concerns');
  const [regionStyle, setRegionStyle] = useState<RegionStyle>('diagram');
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    async function load() {
      const { data: config } = await supabase
        .from('widget_configs')
        .select('widget_mode, region_style')
        .eq('tenant_id', tenantId)
        .single();

      if (config?.widget_mode) {
        setSelected(config.widget_mode as WidgetMode);
      }
      if (config?.region_style) {
        setRegionStyle(config.region_style as RegionStyle);
      }
      setConfigLoading(false);
    }

    load();
  }, [tenantId, supabase]);

  async function handleSave() {
    if (!tenantId) return;
    await updateWidgetConfig(supabase, tenantId, { widget_mode: selected, region_style: regionStyle });

    logAuditClient({
      action: 'widget_config.flow_updated',
      entity_type: 'widget_config',
      new_data: { widget_mode: selected, region_style: regionStyle },
    });
  }

  if (loading || configLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Widget Flow" description="Choose how visitors interact with your widget">
        <SaveButton onSave={handleSave} />
      </PageHeader>

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

      {/* Region Selection Style */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Body Area Selection</h2>
        <p className="text-sm text-muted-foreground">
          Choose how visitors select their body areas
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {regionStyleOptions.map((option) => {
          const isActive = regionStyle === option.value;
          const Icon = option.icon;
          return (
            <Card
              key={option.value}
              className={`cursor-pointer transition-all ${
                isActive
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'hover:border-slate-300 hover:shadow-sm'
              }`}
              onClick={() => setRegionStyle(option.value)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  {isActive && (
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
            The widget mode determines the steps visitors go through when using
            your treatment builder. All modes end with the consultation form.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
