import { createServiceRoleClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
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

export default async function WidgetStandalonePreview({ params }: Props) {
  const { slug } = await params;

  const supabase = await createServiceRoleClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
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

      {/* Placeholder */}
      <div className="mx-auto max-w-[800px] px-5 py-10">
        <div className="rounded-xl border border-slate-200 bg-white px-10 py-16 text-center">
          <h2 className="text-xl font-semibold mb-2">Consult Builder Widget</h2>
          <p className="text-sm text-slate-500 max-w-[400px] mx-auto">
            This is where the embeddable widget will render. Once the Vite
            widget is built, it will load here automatically.
          </p>

          <div className="mt-6 rounded-lg bg-slate-800 p-4 text-left font-mono text-[13px] text-slate-400 overflow-x-auto">
            <span className="text-sky-300">&lt;treatment-builder</span>{' '}
            <span className="text-amber-200">data-tenant</span>=
            <span className="text-green-300">&quot;{slug}&quot;</span>
            <span className="text-sky-300">&gt;&lt;/treatment-builder&gt;</span>
            <br />
            <span className="text-sky-300">&lt;script</span>{' '}
            <span className="text-amber-200">src</span>=
            <span className="text-green-300">&quot;/widget.js&quot;</span>{' '}
            <span className="text-amber-200">defer</span>
            <span className="text-sky-300">&gt;&lt;/script&gt;</span>
          </div>
        </div>
      </div>

      {/* Widget mount point */}
      <div
        className="mx-auto max-w-[800px] px-5"
        dangerouslySetInnerHTML={{
          __html: `<treatment-builder data-tenant="${slug}"></treatment-builder>`,
        }}
      />
    </div>
  );
}
