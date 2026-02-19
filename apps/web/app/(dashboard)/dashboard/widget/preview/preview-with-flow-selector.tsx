'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import type { WidgetMode } from '@treatment-builder/shared';
import { WidgetPreviewClient } from './preview-client';

const FLOW_OPTIONS: {
  mode: WidgetMode;
  label: string;
  description: string;
  steps: string[];
}[] = [
  {
    mode: 'regions_concerns_services',
    label: 'Full Journey',
    description: 'Body regions → concerns → services → form. Best for full-service plastic surgery centers.',
    steps: ['Body Region', 'Concerns', 'Services', 'Form'],
  },
  {
    mode: 'regions_services',
    label: 'Direct Services',
    description: 'Body regions → services → form. Ideal for practices focused on specific procedures.',
    steps: ['Body Region', 'Services', 'Form'],
  },
  {
    mode: 'regions_concerns',
    label: 'Concerns Only',
    description: 'Body regions → concerns → form. Great for general consultation lead capture.',
    steps: ['Body Region', 'Concerns', 'Form'],
  },
{
    mode: 'services_only',
    label: 'Service Menu',
    description: 'Service catalog → form. Perfect for med spas with a clear service menu.',
    steps: ['Services', 'Form'],
  },
];

interface Props {
  slug: string;
}

export function PreviewWithFlowSelector({ slug }: Props) {
  const [selectedFlow, setSelectedFlow] = useState<WidgetMode>('regions_concerns');

  const selectedOption = FLOW_OPTIONS.find((o) => o.mode === selectedFlow)!;

  return (
    <div className="space-y-4">
      {/* Flow Selector Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Widget Flow</CardTitle>
          <CardDescription>
            Preview how visitors interact with your widget in different modes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {FLOW_OPTIONS.map((opt) => (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setSelectedFlow(opt.mode)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  selectedFlow === opt.mode
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2">
            <p className="text-sm text-muted-foreground">{selectedOption.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {selectedOption.steps.map((step, index) => (
                <span key={step} className="flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {step}
                  </span>
                  {index < selectedOption.steps.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-indigo-400" />
                  )}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Browser Preview Frame */}
      <Card className="py-0 overflow-hidden">
        {/* Mock Browser Chrome */}
        <div className="rounded-t-xl border-b bg-slate-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1">
              <div className="mx-auto max-w-md rounded-md border bg-white px-3 py-1.5 text-center text-xs text-muted-foreground">
                yourwebsite.com — preview of{' '}
                <span className="font-mono font-medium">{slug}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <WidgetPreviewClient slug={slug} widgetModeOverride={selectedFlow} />
      </Card>
    </div>
  );
}
