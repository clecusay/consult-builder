import { createServiceRoleClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import type { Metadata } from 'next';
import { PreviewBanner } from './preview-banner';
import { buildWidgetAttrs } from '@/lib/widget/build-attrs';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ flow?: string; layout?: string; region_style?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServiceRoleClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  return {
    title: tenant ? `Widget Preview — ${tenant.name}` : 'Widget Preview',
  };
}

export default async function WidgetStandalonePreview({ params, searchParams }: Props) {
  const { slug } = await params;
  const { flow, layout, region_style } = await searchParams;

  const supabase = await createServiceRoleClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!tenant) notFound();

  const attrs = buildWidgetAttrs({
    tenantId: tenant.id,
    flow,
    layout,
    regionStyle: region_style,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
      {/* Preview banner with controls */}
      <PreviewBanner
        slug={slug}
        tenantName={tenant.name}
        currentFlow={flow}
        currentLayout={layout}
        currentRegionStyle={region_style}
      />

      {/* Widget mount */}
      <div className="mx-auto max-w-[800px] px-5 py-10">
        <div
          dangerouslySetInnerHTML={{
            __html: `<treatment-builder ${attrs}></treatment-builder>`,
          }}
        />
      </div>

      <Script src={`/widget.js?v=${Date.now()}`} strategy="lazyOnload" />
    </div>
  );
}
