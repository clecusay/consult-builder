'use client';

import { useRouter, usePathname } from 'next/navigation';

interface Props {
  slug: string;
  tenantName: string;
  currentFlow?: string;
  currentLayout?: string;
  currentRegionStyle?: string;
}

export function PreviewBanner({ slug, tenantName, currentFlow, currentLayout, currentRegionStyle }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams();
    if (currentFlow) params.set('flow', currentFlow);
    if (currentLayout) params.set('layout', currentLayout);
    if (currentRegionStyle) params.set('region_style', currentRegionStyle);
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  const selectStyle: React.CSSProperties = {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#e2e8f0',
    fontSize: 11,
    padding: '3px 8px',
    cursor: 'pointer',
  };

  return (
    <div style={{
      background: '#0f172a',
      color: '#94a3b8',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
      fontSize: 12,
    }}>
      <span>
        Preview for <strong style={{ color: '#fff' }}>{tenantName}</strong> ({slug})
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Flow
          <select
            value={currentFlow || 'regions_concerns'}
            onChange={(e) => updateParam('flow', e.target.value)}
            style={selectStyle}
          >
            <option value="regions_concerns">Concerns</option>
            <option value="regions_services">Services</option>
            <option value="treatment_builder">Treatment Builder</option>
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Layout
          <select
            value={currentLayout || 'split'}
            onChange={(e) => updateParam('layout', e.target.value)}
            style={selectStyle}
          >
            <option value="split">Split</option>
            <option value="guided">Guided</option>
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Style
          <select
            value={currentRegionStyle || 'diagram'}
            onChange={(e) => updateParam('region_style', e.target.value)}
            style={selectStyle}
          >
            <option value="diagram">Diagram</option>
            <option value="cards">Cards</option>
          </select>
        </label>
      </div>
    </div>
  );
}
