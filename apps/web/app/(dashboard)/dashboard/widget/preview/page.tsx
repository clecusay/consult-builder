import { Suspense } from 'react';
import { requireSession } from '@/lib/auth/session';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Code2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { WidgetPreviewClient } from './preview-client';
import { PreviewErrorBoundary } from './preview-error-boundary';

export default async function WidgetPreviewPage() {
  const session = await requireSession();
  const slug = session.tenant.slug;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Widget Preview</h1>
          <p className="text-muted-foreground">
            See how your widget looks with your current configuration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/widget/embed">
              <Code2 className="h-4 w-4" />
              Embed Code
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href={`/widget/preview/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </a>
          </Button>
        </div>
      </div>

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

          {/* Live Preview Area */}
          <PreviewErrorBoundary>
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-24 bg-white">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading widget preview...</span>
                  </div>
                </div>
              }
            >
              <WidgetPreviewClient slug={slug} />
            </Suspense>
          </PreviewErrorBoundary>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding</CardTitle>
            <CardDescription>Colors, fonts, and CTA text</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/widget/branding">Edit Branding</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Services</CardTitle>
            <CardDescription>Enable/disable treatments</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/widget/services">Manage Services</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Form Fields</CardTitle>
            <CardDescription>Customize the contact form</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/widget/form">Edit Form</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
