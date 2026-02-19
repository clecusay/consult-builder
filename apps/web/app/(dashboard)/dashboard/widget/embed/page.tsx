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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Copy,
  Check,
  Code2,
  Globe,
  Blocks,
  FileCode,
  MapPin,
} from 'lucide-react';
import type { WidgetMode } from '@treatment-builder/shared';

interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  is_primary: boolean;
}

const FLOW_OPTIONS: { mode: WidgetMode; label: string }[] = [
  { mode: 'regions_concerns_services', label: 'Full Journey' },
  { mode: 'regions_services', label: 'Direct Services' },
  { mode: 'regions_concerns', label: 'Concerns Only' },
{ mode: 'services_only', label: 'Service Menu' },
];

function FlowSelect({ value, onChange }: { value: WidgetMode; onChange: (v: WidgetMode) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as WidgetMode)}
      className="h-8 rounded-md border border-input bg-transparent px-2 text-xs font-medium"
    >
      {FLOW_OPTIONS.map((opt) => (
        <option key={opt.mode} value={opt.mode}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default function EmbedCodePage() {
  const [slug, setSlug] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [defaultMode, setDefaultMode] = useState<WidgetMode>('regions_concerns');
  const [universalFlow, setUniversalFlow] = useState<WidgetMode>('regions_concerns');
  const [locationFlows, setLocationFlows] = useState<Record<string, WidgetMode>>({});

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id, tenants (slug)')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const tenant = (profile as Record<string, unknown>).tenants as {
          slug: string;
        };
        setSlug(tenant.slug);

        const tenantId = profile.tenant_id;
        const { data: locs } = await supabase
          .from('tenant_locations')
          .select('id, name, address, city, state, is_primary')
          .eq('tenant_id', tenantId)
          .order('is_primary', { ascending: false })
          .order('name');

        if (locs) setLocations(locs);

        const { data: config } = await supabase
          .from('widget_configs')
          .select('widget_mode')
          .eq('tenant_id', tenantId)
          .single();

        if (config?.widget_mode) {
          const mode = config.widget_mode as WidgetMode;
          setDefaultMode(mode);
          setUniversalFlow(mode);
        }
      }
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  function getLocationFlow(locationId: string) {
    return locationFlows[locationId] ?? defaultMode;
  }

  function setLocationFlow(locationId: string, flow: WidgetMode) {
    setLocationFlows((prev) => ({ ...prev, [locationId]: flow }));
  }

  function embedCode(flow: WidgetMode) {
    return `<treatment-builder data-tenant="${slug ?? 'YOUR_SLUG'}" data-flow="${flow}"></treatment-builder>
<script src="https://widget.treatmentbuilder.com/widget.js" defer></script>`;
  }

  function locationSnippet(locationId: string, flow: WidgetMode) {
    return `<treatment-builder data-tenant="${slug ?? 'YOUR_SLUG'}" data-location="${locationId}" data-flow="${flow}"></treatment-builder>
<script src="https://widget.treatmentbuilder.com/widget.js" defer></script>`;
  }

  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Embed Code</h1>
        <p className="text-muted-foreground">
          Add the treatment builder widget to your website
        </p>
      </div>

      {/* Universal Snippet */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Universal Embed Code
              </CardTitle>
              <CardDescription>
                {locations.length >= 2
                  ? 'Visitors will choose their location when the widget loads'
                  : 'Copy and paste this into your website\u2019s HTML'}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleCopy(embedCode(universalFlow), 'universal')}>
              {copiedId === 'universal' ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copiedId === 'universal' ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Flow:</span>
            <FlowSelect value={universalFlow} onChange={setUniversalFlow} />
          </div>
          <div className="relative rounded-lg bg-slate-950 p-4">
            <pre className="overflow-x-auto text-sm leading-relaxed text-slate-200">
              <code>{embedCode(universalFlow)}</code>
            </pre>
          </div>
          <p className="text-xs text-muted-foreground">
            Your tenant slug:{' '}
            <Badge variant="secondary" className="font-mono">
              {slug}
            </Badge>
          </p>
        </CardContent>
      </Card>

      {/* Per-Location Snippets */}
      {locations.length > 0 && (
        <>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Per-Location Snippets</h2>
            <p className="text-sm text-muted-foreground">
              Use these to pin a widget to a specific location — services will be filtered automatically
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {locations.map((loc) => {
              const flow = getLocationFlow(loc.id);
              const snippet = locationSnippet(loc.id, flow);
              const copyId = `loc-${loc.id}`;
              return (
                <Card key={loc.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="h-4 w-4" />
                        {loc.name}
                        {loc.is_primary && (
                          <Badge variant="secondary" className="text-xs">Primary</Badge>
                        )}
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => handleCopy(snippet, copyId)}>
                        {copiedId === copyId ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copiedId === copyId ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    {(loc.city || loc.state) && (
                      <CardDescription>
                        {[loc.address, loc.city, loc.state].filter(Boolean).join(', ')}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">Flow:</span>
                      <FlowSelect value={flow} onChange={(v) => setLocationFlow(loc.id, v)} />
                    </div>
                    <div className="relative rounded-lg bg-slate-950 p-3">
                      <pre className="overflow-x-auto text-xs leading-relaxed text-slate-200">
                        <code>{snippet}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Separator />

      {/* Platform Instructions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Webflow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              Webflow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-inside list-decimal space-y-2">
              <li>Open your Webflow project and select the page</li>
              <li>
                Add an <strong>Embed</strong> element where you want the widget
              </li>
              <li>Paste the embed code above into the HTML embed box</li>
              <li>Publish your site to see the changes live</li>
            </ol>
          </CardContent>
        </Card>

        {/* WordPress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Blocks className="h-4 w-4" />
              WordPress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-inside list-decimal space-y-2">
              <li>Edit the page or post where you want the widget</li>
              <li>
                Add a <strong>Custom HTML</strong> block
              </li>
              <li>Paste the embed code into the block</li>
              <li>Save and preview the page</li>
            </ol>
          </CardContent>
        </Card>

        {/* Custom HTML */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCode className="h-4 w-4" />
              Custom HTML
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-inside list-decimal space-y-2">
              <li>Open your HTML file in a code editor</li>
              <li>
                Paste the embed code where you want the widget to appear
              </li>
              <li>
                The script loads asynchronously with <code className="rounded bg-muted px-1">defer</code>
              </li>
              <li>Upload the updated file to your hosting</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
