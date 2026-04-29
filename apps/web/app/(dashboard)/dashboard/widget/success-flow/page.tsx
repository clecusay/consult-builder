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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Heart, UserRound, CalendarDays } from 'lucide-react';
import { SaveButton } from '@/components/ui/save-button';
import { PageHeader } from '@/components/dashboard/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { SuccessFlowConfig } from '@treatment-builder/shared';

const DEFAULT_FLOW: SuccessFlowConfig = {
  thank_you: {
    enabled: true,
    heading: 'Thank You!',
    body: "Now is the best time to schedule a consultation. Based upon your concerns, this is the perfect time for us to help you get more freedom. You're gonna feel much better this season. With your new look and outlook on life, we are going to make sure your best view is showing.",
  },
  doctor_profile: {
    enabled: true,
    heading: "Meet Our Doctor",
    body: "Our doctor is double board certified and a lineage of plastic surgeons who are well-renowned throughout the world. You're going to love the practice, the bedside manner, and the team members who are going to make sure that you are chaperoned through an ideal experience before your procedure, and you're going to become one of our family.",
    doctor_name: '',
  },
  calendar: {
    enabled: true,
    heading: 'Schedule Your Consultation',
    calendar_url: '',
    calendar_embed_type: 'button',
  },
};

export default function SuccessFlowPage() {
  const { tenantId, supabase, loading } = useUserTenant();
  const [flow, setFlow] = useState<SuccessFlowConfig>(DEFAULT_FLOW);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    async function load() {
      const { data: config } = await supabase
        .from('widget_configs')
        .select('success_flow_config')
        .eq('tenant_id', tenantId)
        .single();

      if (config?.success_flow_config) {
        setFlow({
          ...DEFAULT_FLOW,
          ...(config.success_flow_config as SuccessFlowConfig),
        });
      }

      setConfigLoading(false);
    }

    load();
  }, [tenantId, supabase]);

  async function handleSave() {
    if (!tenantId) return;
    await updateWidgetConfig(supabase, tenantId, { success_flow_config: flow });
  }

  if (loading || configLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Success Flow" description="Configure the 3-page experience shown after form submission">
        <SaveButton onSave={handleSave} />
      </PageHeader>

      {/* Step 1: Thank You */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                1
              </div>
              <Heart className="h-4 w-4 text-muted-foreground" />
              Thank You Page
            </CardTitle>
            <Switch
              checked={flow.thank_you.enabled}
              onCheckedChange={(checked) =>
                setFlow({ ...flow, thank_you: { ...flow.thank_you, enabled: checked } })
              }
            />
          </div>
          <CardDescription>
            The first page visitors see after submitting. Your logo is shown at the top automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ty-heading">Heading</Label>
            <Input
              id="ty-heading"
              value={flow.thank_you.heading}
              onChange={(e) =>
                setFlow({
                  ...flow,
                  thank_you: { ...flow.thank_you, heading: e.target.value },
                })
              }
              placeholder="Thank You!"
            />
          </div>
          <div className="space-y-2">
            <Label>Body Text</Label>
            <RichTextEditor
              value={flow.thank_you.body}
              onChange={(html) =>
                setFlow({
                  ...flow,
                  thank_you: { ...flow.thank_you, body: html },
                })
              }
              placeholder="Sales copy or thank you message..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Doctor Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                2
              </div>
              <UserRound className="h-4 w-4 text-muted-foreground" />
              Doctor Profile Page
            </CardTitle>
            <Switch
              checked={flow.doctor_profile.enabled}
              onCheckedChange={(checked) =>
                setFlow({ ...flow, doctor_profile: { ...flow.doctor_profile, enabled: checked } })
              }
            />
          </div>
          <CardDescription>
            Introduce the doctor and build confidence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-heading">Heading</Label>
            <Input
              id="doc-heading"
              value={flow.doctor_profile.heading}
              onChange={(e) =>
                setFlow({
                  ...flow,
                  doctor_profile: {
                    ...flow.doctor_profile,
                    heading: e.target.value,
                  },
                })
              }
              placeholder="Meet Dr. Smith"
            />
          </div>
          <div className="space-y-2">
            <Label>Bio / Credentials</Label>
            <RichTextEditor
              value={flow.doctor_profile.body}
              onChange={(html) =>
                setFlow({
                  ...flow,
                  doctor_profile: {
                    ...flow.doctor_profile,
                    body: html,
                  },
                })
              }
              placeholder="Doctor credentials, bio, and practice details..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                3
              </div>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Calendar / Scheduling Page
            </CardTitle>
            <Switch
              checked={flow.calendar.enabled}
              onCheckedChange={(checked) =>
                setFlow({ ...flow, calendar: { ...flow.calendar, enabled: checked } })
              }
            />
          </div>
          <CardDescription>
            The final step where visitors can schedule their consultation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cal-heading">Heading</Label>
            <Input
              id="cal-heading"
              value={flow.calendar.heading}
              onChange={(e) =>
                setFlow({
                  ...flow,
                  calendar: { ...flow.calendar, heading: e.target.value },
                })
              }
              placeholder="Schedule Your Consultation"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cal-url">Calendar URL</Label>
            <Input
              id="cal-url"
              value={flow.calendar.calendar_url}
              onChange={(e) =>
                setFlow({
                  ...flow,
                  calendar: { ...flow.calendar, calendar_url: e.target.value },
                })
              }
              placeholder="https://calendly.com/your-practice"
            />
            <p className="text-xs text-muted-foreground">
              The URL for your scheduling tool (Calendly, Acuity, etc.)
            </p>
          </div>
          <div className="space-y-2">
            <Label>Display Type</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setFlow({
                    ...flow,
                    calendar: { ...flow.calendar, calendar_embed_type: 'iframe' },
                  })
                }
                className={`flex-1 rounded-lg border-2 p-3 text-center text-sm transition-colors ${
                  flow.calendar.calendar_embed_type === 'iframe'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-medium">Embed</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Show calendar inline
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFlow({
                    ...flow,
                    calendar: { ...flow.calendar, calendar_embed_type: 'button' },
                  })
                }
                className={`flex-1 rounded-lg border-2 p-3 text-center text-sm transition-colors ${
                  flow.calendar.calendar_embed_type === 'button'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-medium">Button</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Link opens in new tab
                </div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
