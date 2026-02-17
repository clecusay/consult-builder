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
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Check, User, ScanFace, PersonStanding } from 'lucide-react';

type DiagramType = 'face' | 'body' | 'full_body';

interface DiagramOption {
  type: DiagramType;
  label: string;
  description: string;
  icon: React.ElementType;
  regions: string;
}

const diagramOptions: DiagramOption[] = [
  {
    type: 'face',
    label: 'Face & Neck',
    description:
      'Focused on facial regions — forehead, eyes, cheeks, nose, lips, jawline, and neck. Ideal for med spas and practices that specialize in facial treatments.',
    icon: ScanFace,
    regions: 'Upper Face, Midface, Lower Face, Neck, Lips',
  },
  {
    type: 'body',
    label: 'Body',
    description:
      'Focused on body regions — abdomen, arms, back, buttocks, chest, flanks, thighs, and legs. Best for body contouring and surgical practices.',
    icon: User,
    regions: 'Abdomen, Arms, Back, Buttocks, Chest, Flanks, Thighs, Lower Legs',
  },
  {
    type: 'full_body',
    label: 'Full Body',
    description:
      'Head-to-toe coverage combining both face and body regions. Best for full-service plastic surgery centers offering a wide range of treatments.',
    icon: PersonStanding,
    regions: 'All face and body regions',
  },
];

export default function DiagramSettingsPage() {
  const [selected, setSelected] = useState<DiagramType>('full_body');
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
        .select('diagram_type')
        .eq('tenant_id', profile.tenant_id)
        .single();

      if (config?.diagram_type) {
        setSelected(config.diagram_type as DiagramType);
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
      .update({ diagram_type: selected })
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
            Diagram Settings
          </h1>
          <p className="text-muted-foreground">
            Choose which body diagram your widget displays
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

      {/* Diagram selection cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {diagramOptions.map((option) => {
          const isSelected = selected === option.type;
          const Icon = option.icon;
          return (
            <Card
              key={option.type}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'hover:border-slate-300 hover:shadow-sm'
              }`}
              onClick={() => setSelected(option.type)}
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
                  <p className="text-xs font-medium text-slate-500">
                    Regions included
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {option.regions}
                  </p>
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
            The selected diagram determines which body outline is shown in your
            widget. Visitors click on regions of the diagram to indicate their
            areas of interest. You can further customize which specific regions
            are active on the{' '}
            <a
              href="/dashboard/widget/regions"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Body Regions
            </a>{' '}
            page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
