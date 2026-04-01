import { createServiceRoleClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ flow?: string; layout?: string }>;
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
  const { flow, layout } = await searchParams;

  const supabase = await createServiceRoleClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!tenant) notFound();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
      {/* Preview banner */}
      <div className="bg-slate-900 text-slate-400 text-center px-4 py-2 text-xs">
        Preview mode for <strong className="text-white">{tenant.name}</strong> ({slug})
      </div>

      {/* Widget mount */}
      <div className="mx-auto max-w-[800px] px-5 py-10">
        <div
          dangerouslySetInnerHTML={{
            __html: `<treatment-builder data-tenant-id="${tenant.id}"${flow ? ` data-flow="${flow}"` : ''}${layout ? ` data-layout="${layout}"` : ''}></treatment-builder>`,
          }}
        />
      </div>

      {/* Embed code reference */}
      <div className="mx-auto max-w-[800px] px-5 pb-10">
        <details className="rounded-lg border border-slate-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-xs font-medium text-slate-500 hover:text-slate-700">Embed Code</summary>
          <div className="rounded-b-lg bg-slate-800 p-4 font-mono text-[13px] text-slate-400 overflow-x-auto">
            <span className="text-sky-300">&lt;treatment-builder</span>{' '}
            <span className="text-amber-200">data-tenant-id</span>=
            <span className="text-green-300">&quot;{tenant.id}&quot;</span>
            <span className="text-sky-300">&gt;&lt;/treatment-builder&gt;</span>
            <br />
            <span className="text-sky-300">&lt;script</span>{' '}
            <span className="text-amber-200">src</span>=
            <span className="text-green-300">&quot;/widget.js&quot;</span>{' '}
            <span className="text-amber-200">defer</span>
            <span className="text-sky-300">&gt;&lt;/script&gt;</span>
          </div>
        </details>
      </div>

      <Script src={`/widget.js?v=${Date.now()}`} strategy="lazyOnload" />
    </div>
  );
}
