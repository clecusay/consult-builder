'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Script from 'next/script';
import type { WidgetMode, RegionStyle } from '@treatment-builder/shared';

const FLOW_OPTIONS: { mode: WidgetMode; label: string }[] = [
  { mode: 'regions_services', label: 'Direct Services' },
  { mode: 'regions_concerns', label: 'Concerns Focus' },
  { mode: 'treatment_builder', label: 'Treatment Builder' },
];

const LAYOUT_OPTIONS: { value: 'split' | 'guided'; label: string }[] = [
  { value: 'split', label: 'Split View' },
  { value: 'guided', label: 'Guided Flow' },
];

const REGION_STYLE_OPTIONS: { value: RegionStyle; label: string }[] = [
  { value: 'diagram', label: 'Body Diagram' },
  { value: 'cards', label: 'Card Grid' },
];

interface Props {
  tenantId: string;
  slug: string;
}

export function PreviewWithFlowSelector({ tenantId, slug }: Props) {
  const [selectedFlow, setSelectedFlow] = useState<WidgetMode>('regions_concerns');
  const [selectedLayout, setSelectedLayout] = useState<'split' | 'guided'>('split');
  const [selectedRegionStyle, setSelectedRegionStyle] = useState<RegionStyle>('diagram');
  const [widgetKey, setWidgetKey] = useState(0);
  const [ceReady, setCeReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Wait for the custom element to be defined
  useEffect(() => {
    if (customElements.get('treatment-builder')) {
      setCeReady(true);
      return;
    }
    customElements.whenDefined('treatment-builder').then(() => setCeReady(true));
  }, []);

  // Re-mount the widget when options change
  useEffect(() => {
    setWidgetKey((k) => k + 1);
  }, [selectedFlow, selectedLayout, selectedRegionStyle]);

  // Inject the widget element once CE is defined
  useEffect(() => {
    if (!ceReady) return;
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';
    const el = document.createElement('treatment-builder');
    el.setAttribute('data-tenant-id', tenantId);
    el.setAttribute('data-flow', selectedFlow);
    el.setAttribute('data-layout', selectedLayout);
    container.appendChild(el);
  }, [widgetKey, ceReady, tenantId, selectedFlow, selectedLayout]);

  const selectClass =
    'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400';

  return (
    <div className="space-y-4">
      {/* Flow & Layout Selector Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Widget Flow & Layout</CardTitle>
          <CardDescription>
            Preview how visitors interact with your widget in different modes and layouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Flow Mode</label>
              <select
                value={selectedFlow}
                onChange={(e) => setSelectedFlow(e.target.value as WidgetMode)}
                className={selectClass}
              >
                {FLOW_OPTIONS.map((opt) => (
                  <option key={opt.mode} value={opt.mode}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Layout</label>
              <select
                value={selectedLayout}
                onChange={(e) => setSelectedLayout(e.target.value as 'split' | 'guided')}
                className={selectClass}
              >
                {LAYOUT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Body Area Selection</label>
              <select
                value={selectedRegionStyle}
                onChange={(e) => setSelectedRegionStyle(e.target.value as RegionStyle)}
                className={selectClass}
              >
                {REGION_STYLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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

        {/* Live Widget Preview */}
        <div
          key={widgetKey}
          ref={containerRef}
          className="min-h-[500px] bg-white"
        />
      </Card>

      <Script src="/widget.js" strategy="afterInteractive" />
    </div>
  );
}
