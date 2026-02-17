import type { WidgetConfigResponse } from '@treatment-builder/shared';

const WIDGET_TAG = 'treatment-builder';
const API_BASE = '__API_BASE__'; // Replaced at build time or configured

class TreatmentBuilderWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private config: WidgetConfigResponse | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    const tenantSlug = this.getAttribute('data-tenant');
    if (!tenantSlug) {
      this.shadow.innerHTML = '<p style="color:red;">Missing data-tenant attribute</p>';
      return;
    }

    // Show loading skeleton
    this.shadow.innerHTML = `
      <style>
        :host { display: block; font-family: system-ui, -apple-system, sans-serif; }
        .tb-loading { padding: 2rem; text-align: center; color: #666; }
        .tb-loading-spinner {
          width: 32px; height: 32px; margin: 0 auto 1rem;
          border: 3px solid #e5e7eb; border-top-color: #3b82f6;
          border-radius: 50%; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
      <div class="tb-loading">
        <div class="tb-loading-spinner"></div>
        <p>Loading treatment builder...</p>
      </div>
    `;

    try {
      const apiBase = this.getAttribute('data-api') || (API_BASE !== '__API_BASE__' ? API_BASE : '');
      const res = await fetch(`${apiBase}/api/widget/config?slug=${encodeURIComponent(tenantSlug)}`);
      if (!res.ok) throw new Error(`Failed to load config: ${res.status}`);
      this.config = await res.json();
      this.render();
    } catch (err) {
      this.shadow.innerHTML = `<p style="color:red;padding:1rem;">Failed to load treatment builder. Please try again later.</p>`;
      console.error('[TreatmentBuilder]', err);
    }
  }

  private render() {
    if (!this.config) return;

    const { branding } = this.config;

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: ${branding.font_family || 'system-ui, -apple-system, sans-serif'};
          --tb-primary: ${branding.primary_color};
          --tb-secondary: ${branding.secondary_color};
          --tb-accent: ${branding.accent_color};
        }
        .tb-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 1.5rem;
        }
        .tb-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--tb-primary);
        }
        ${branding.custom_css || ''}
      </style>
      <div class="tb-container">
        <h2 class="tb-title">Select Your Areas of Concern</h2>
        <p>Widget loaded for: ${this.config.tenant.name}</p>
        <!-- Full widget UI will be built in Phase 3 -->
      </div>
    `;
  }
}

// Register custom element
if (!customElements.get(WIDGET_TAG)) {
  customElements.define(WIDGET_TAG, TreatmentBuilderWidget);
}
