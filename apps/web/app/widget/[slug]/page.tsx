import { createServiceRoleClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import type { Metadata } from 'next';
import { buildWidgetAttrs } from '@/lib/widget/build-attrs';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ flow?: string; layout?: string; region_style?: string; location?: string }>;
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
    title: tenant ? `${tenant.name} — Consultation` : 'Consultation',
  };
}

export default async function WidgetFullPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { flow, layout, region_style, location } = await searchParams;

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
    fullpage: true,
    flow,
    layout,
    location,
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: 'html,body{margin:0;padding:0;height:100%}#__next{height:100%}' }} />
      <div
        style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
        dangerouslySetInnerHTML={{
          __html: `<treatment-builder ${attrs} style="flex:1;display:flex;flex-direction:column"></treatment-builder>`,
        }}
      />
      <Script src={"/widget.js"} strategy="lazyOnload" />
    </>
  );
}
