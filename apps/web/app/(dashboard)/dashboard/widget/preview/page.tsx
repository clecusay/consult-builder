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
import { PreviewErrorBoundary } from './preview-error-boundary';
import { PreviewWithFlowSelector } from './preview-with-flow-selector';

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

      {/* Browser Preview Frame with Flow Selector */}
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
          <PreviewWithFlowSelector slug={slug} />
        </Suspense>
      </PreviewErrorBoundary>

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
