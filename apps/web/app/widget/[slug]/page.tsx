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

  const { data: widgetConfig } = await supabase
    .from('widget_configs')
    .select('gtm_container_id')
    .eq('tenant_id', tenant.id)
    .single();

  // Only accept a strict GTM container id; this value is interpolated into an
  // inline script below, so anything else is dropped to avoid HTML injection.
  const rawGtmId = widgetConfig?.gtm_container_id?.trim() ?? '';
  const gtmId = /^GTM-[A-Z0-9]+$/i.test(rawGtmId) ? rawGtmId : null;

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
      {gtmId && (
        <>
          {/* Per-tenant Google Tag Manager. The widget pushes
              consultBuilder.formSubmission to window.dataLayer on submit; this
              container is what consumes it on the hosted page. */}
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
          {/* First-touch attribution helper, mirrors the embed setup so paid
              campaign data survives cross-page navigation on the hosted page. */}
          <Script src="/track.js" strategy="afterInteractive" />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}
      <div
        style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
        dangerouslySetInnerHTML={{
          __html: `<treatment-builder ${attrs} style="flex:1;display:flex;flex-direction:column"></treatment-builder>`,
        }}
      />
      <Script src={`/widget.js?v=${Date.now()}`} strategy="lazyOnload" />
    </>
  );
}
