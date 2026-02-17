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
} from 'lucide-react';

export default function EmbedCodePage() {
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadSlug() {
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
      }
      setLoading(false);
    }

    loadSlug();
  }, [supabase]);

  const embedCode = `<treatment-builder data-tenant="${slug ?? 'YOUR_SLUG'}"></treatment-builder>
<script src="https://widget.treatmentbuilder.com/widget.js" defer></script>`;

  async function handleCopy() {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      {/* Code Snippet */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                HTML Embed Code
              </CardTitle>
              <CardDescription>
                Copy and paste this into your website&apos;s HTML
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-lg bg-slate-950 p-4">
            <pre className="overflow-x-auto text-sm leading-relaxed text-slate-200">
              <code>{embedCode}</code>
            </pre>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Your tenant slug:{' '}
            <Badge variant="secondary" className="font-mono">
              {slug}
            </Badge>
          </p>
        </CardContent>
      </Card>

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
