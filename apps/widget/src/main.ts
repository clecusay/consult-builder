/**
 * Treatment Builder Widget
 * Embeddable web component for treatment consultation forms.
 */
import type {
  WidgetConfigResponse,
  WidgetRegion,
  WidgetConcern,
  WidgetServiceCategory,
  WidgetFormField,
  SelectedRegion,
  SelectedConcern,
  SelectedService,
  Gender,
  WidgetMode,
  RegionStyle,
} from '@treatment-builder/shared';
import widgetStyles from './styles.css?inline';
import { html, raw, SafeHTML } from './template';
import { ICONS } from './icons';
import { renderBodySVG, renderFaceSVG } from './svg-renderer';
import { getPainPoints, getOutcomes, BARRIERS, type TBOption } from './treatment-builder-data';

type View = 'body' | 'guided-concerns' | 'form' | 'success'
  | 'tb-pain-points' | 'tb-outcomes' | 'tb-barriers' | 'tb-bridge' | 'tb-lead-capture';

class TreatmentBuilderWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private config: WidgetConfigResponse | null = null;
  private apiBase = '';
  private tenantId = '';
  private locationId: string | null = null;
  private layoutOverride: 'split' | 'guided' | null = null;
  private fullpage = false;
  private eventsBound = false;

  // View state
  private view: View = 'body';
  private selectedGender: 'female' | 'male' = 'female';
  private bodySide: 'front' | 'back' = 'front';
  private diagramView: 'body' | 'face' = 'body';

  // Selection state
  private selectedRegionSlugs = new Set<string>();
  private selectedConcernIds = new Set<string>();
  private selectedServiceIds = new Set<string>();

  // Treatment Builder state
  private selectedPainPoints = new Set<string>();
  private selectedOutcomes = new Set<string>();
  private selectedBarriers = new Set<string>();
  private tbOtherPainPoint = '';
  private tbOtherOutcome = '';
  private bridgeAnimationStep = 0;
  private bridgeTimer: ReturnType<typeof setTimeout> | null = null;

  // UI state
  private expandedRegions = new Set<string>();
  private concernSearchQuery = '';
  private submitting = false;
  private formError = '';

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    this.tenantId = this.getAttribute('data-tenant-id') || '';
    if (!this.tenantId) {
      this.shadow.innerHTML = '<p style="color:red;padding:1rem">Missing data-tenant-id attribute</p>';
      return;
    }
    this.locationId = this.getAttribute('data-location') || null;
    const flowOverride = this.getAttribute('data-flow') || null;
    this.layoutOverride = this.getAttribute('data-layout') as 'split' | 'guided' | null;
    this.fullpage = this.hasAttribute('data-fullpage');
    this.apiBase = this.getAttribute('data-api') || '';

    this.shadow.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:96px 16px;color:#64748b;font-size:13px">Loading...</div>';

    try {
      let url = `${this.apiBase}/api/widget/config?tenant_id=${encodeURIComponent(this.tenantId)}`;
      if (this.locationId) url += `&location=${encodeURIComponent(this.locationId)}`;
      if (flowOverride) url += `&flow=${encodeURIComponent(flowOverride)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Config error: ${res.status}`);
      this.config = await res.json();

      // Auto-detect: if all regions are face-only, start in face view
      if (this.config && this.config.regions.length > 0 &&
          this.config.regions.every(r => r.body_area === 'face')) {
        this.diagramView = 'face';
      }

      this.render();
    } catch (err) {
      this.shadow.innerHTML = '<div style="color:red;padding:1rem">Failed to load treatment builder. Please try again later.</div>';
      console.error('[TreatmentBuilder]', err);
    }
  }

  // ── Derived data ──

  private get widgetMode(): WidgetMode {
    return this.config?.widget_mode || 'regions_concerns';
  }

  private get widgetLayout(): 'split' | 'guided' {
    if (this.layoutOverride) return this.layoutOverride;
    if (!this.config) return 'split';
    return (this.config as unknown as Record<string, unknown>).widget_layout as 'split' | 'guided' || 'split';
  }

  private get isGuided(): boolean {
    return this.widgetLayout === 'guided';
  }

  private get showConcerns(): boolean {
    return this.widgetMode.includes('concerns');
  }

  private get showServices(): boolean {
    return this.widgetMode.includes('services');
  }

  private get regionStyle(): RegionStyle {
    if (!this.config) return 'diagram';
    return (this.config as unknown as Record<string, unknown>).region_style as RegionStyle || 'diagram';
  }

  private get useCards(): boolean {
    return this.regionStyle === 'cards';
  }

  private get isTreatmentBuilder(): boolean {
    return this.widgetMode === 'treatment_builder';
  }

  private get isFaceOnly(): boolean {
    if (!this.config) return false;
    return this.config.regions.length > 0 && this.config.regions.every(r => r.body_area === 'face');
  }

  private get isBodyOnly(): boolean {
    if (!this.config) return false;
    return this.config.regions.length > 0 && this.config.regions.every(r => r.body_area === 'body');
  }

  private get primaryColor(): string {
    return this.config?.branding.primary_color || '#e84393';
  }

  private get genderRegions(): WidgetRegion[] {
    if (!this.config) return [];
    return this.config.regions.filter(r => r.gender === this.selectedGender || r.gender === 'all');
  }

  private get activeRegionSlugs(): Set<string> {
    return new Set(this.genderRegions.map(r => r.slug));
  }

  private get selectedRegions(): WidgetRegion[] {
    return this.genderRegions
      .filter(r => this.selectedRegionSlugs.has(r.slug))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private get concernsByRegion(): { regionName: string; regionSlug: string; concerns: (WidgetConcern & { regionSlug: string })[] }[] {
    const groups: { regionName: string; regionSlug: string; concerns: (WidgetConcern & { regionSlug: string })[] }[] = [];
    for (const region of this.selectedRegions) {
      if (region.concerns.length > 0) {
        groups.push({
          regionName: region.name,
          regionSlug: region.slug,
          concerns: region.concerns.map(c => ({ ...c, regionSlug: region.slug })),
        });
      }
    }
    return groups;
  }

  /** Service categories filtered to only show services relevant to selected regions */
  private get filteredServiceCategories(): WidgetServiceCategory[] {
    if (!this.config) return [];
    const selectedRegionIds = new Set(this.selectedRegions.map(r => r.id));
    return this.config.service_categories.map(cat => ({
      ...cat,
      services: cat.services.filter(svc =>
        // Show if service has no region mapping (uncategorized) or overlaps selected regions
        svc.region_ids.length === 0 || svc.region_ids.some(rid => selectedRegionIds.has(rid))
      ),
    }));
  }

  private get totalSelections(): number {
    return this.selectedConcernIds.size + this.selectedServiceIds.size;
  }

  private get currentStep(): number {
    if (this.view === 'form') return 2;
    if (this.view === 'guided-concerns') return 1;
    if (this.view !== 'body') return 2;
    if (this.isGuided) return 0;
    return this.selectedRegionSlugs.size > 0 ? 1 : 0;
  }

  private getPopularIds(concerns: WidgetConcern[]): Set<string> {
    if (concerns.length <= 3) return new Set();
    const sorted = [...concerns].sort((a, b) => a.display_order - b.display_order);
    return new Set(sorted.slice(0, 3).map(c => c.id));
  }

  private getRegionConcernCount(regionSlug: string): number {
    const region = this.genderRegions.find(r => r.slug === regionSlug);
    if (!region) return 0;
    return region.concerns.filter(c => this.selectedConcernIds.has(c.id)).length;
  }

  // ── Actions ──

  private handleAnchorClick(regionSlugs: string[]) {
    const allSelected = regionSlugs.every(s => this.selectedRegionSlugs.has(s));
    if (allSelected) {
      regionSlugs.forEach(s => this.selectedRegionSlugs.delete(s));
    } else {
      regionSlugs.forEach(s => this.selectedRegionSlugs.add(s));
    }
    for (const slug of regionSlugs) {
      if (this.selectedRegionSlugs.has(slug)) {
        this.expandedRegions.add(slug);
      }
    }
    this.render();
  }

  private removeRegion(slug: string) {
    this.selectedRegionSlugs.delete(slug);
    this.expandedRegions.delete(slug);
    const region = this.genderRegions.find(r => r.slug === slug);
    if (region) {
      region.concerns.forEach(c => this.selectedConcernIds.delete(c.id));
    }
    this.render();
  }

  private toggleConcern(id: string) {
    const wasSelected = this.selectedConcernIds.has(id);
    if (wasSelected) this.selectedConcernIds.delete(id);
    else this.selectedConcernIds.add(id);

    // Try targeted DOM update
    const btn = this.shadow.querySelector<HTMLElement>(`[data-concern-id="${id}"]`);
    if (btn) {
      btn.classList.toggle('selected', !wasSelected);
      const check = btn.querySelector('.tb-item-check');
      if (check) {
        check.classList.toggle('on', !wasSelected);
        check.classList.toggle('off', wasSelected);
        check.innerHTML = !wasSelected ? ICONS.check : '';
      }
      const name = btn.querySelector('.tb-item-name');
      if (name) name.classList.toggle('selected', !wasSelected);
      this.updateBadgeCounts();
      return;
    }
    this.render();
  }

  private toggleService(id: string) {
    const wasSelected = this.selectedServiceIds.has(id);
    if (wasSelected) this.selectedServiceIds.delete(id);
    else this.selectedServiceIds.add(id);

    // Try targeted DOM update
    const btn = this.shadow.querySelector<HTMLElement>(`[data-service-id="${id}"]`);
    if (btn) {
      btn.classList.toggle('selected', !wasSelected);
      const check = btn.querySelector('.tb-item-check');
      if (check) {
        check.classList.toggle('on', !wasSelected);
        check.classList.toggle('off', wasSelected);
        check.innerHTML = !wasSelected ? ICONS.check : '';
      }
      const name = btn.querySelector('.tb-item-name');
      if (name) name.classList.toggle('selected', !wasSelected);
      this.updateBadgeCounts();
      return;
    }
    this.render();
  }

  private toggleRegionExpanded(slug: string) {
    const wasExpanded = this.expandedRegions.has(slug);
    if (wasExpanded) this.expandedRegions.delete(slug);
    else this.expandedRegions.add(slug);

    // Try targeted DOM update (toggle classes, no rebuild)
    const header = this.shadow.querySelector<HTMLElement>(`[data-toggle-region="${slug}"]`);
    if (header) {
      const concerns = header.nextElementSibling as HTMLElement | null;
      const chevron = header.querySelector('.tb-region-chevron');
      if (concerns) {
        concerns.classList.toggle('expanded', !wasExpanded);
        concerns.classList.toggle('collapsed', wasExpanded);
      }
      if (chevron) {
        chevron.classList.toggle('expanded', !wasExpanded);
        chevron.classList.toggle('collapsed', wasExpanded);
      }
      return;
    }
    this.render();
  }

  /** Update badge counts and continue button without full re-render */
  private updateBadgeCounts() {
    // Update region badge counts
    for (const region of this.selectedRegions) {
      const count = region.concerns.filter(c => this.selectedConcernIds.has(c.id)).length;
      const header = this.shadow.querySelector<HTMLElement>(`[data-toggle-region="${region.slug}"]`);
      if (header) {
        const badge = header.querySelector('.tb-region-badge');
        if (badge) {
          badge.textContent = count > 0 ? `${count} selected` : '';
        } else if (count > 0) {
          const span = document.createElement('span');
          span.className = 'tb-region-badge';
          span.textContent = `${count} selected`;
          header.appendChild(span);
        }
      }
    }
    // Update continue button selection count
    const total = this.totalSelections;
    const continueBtn = this.shadow.querySelector<HTMLElement>('[data-action="continue"]');
    if (continueBtn) {
      const countText = total > 0 ? ` (${total})` : '';
      continueBtn.innerHTML = `Continue${countText} ${ICONS.chevronRight}`;
    }
  }

  private setGender(g: 'female' | 'male') {
    if (g === this.selectedGender) return;
    this.selectedGender = g;
    this.diagramView = 'body';
    this.bodySide = 'front';
    this.selectedRegionSlugs.clear();
    this.selectedConcernIds.clear();
    this.expandedRegions.clear();
    this.concernSearchQuery = '';
    this.render();
  }

  private reset() {
    this.view = 'body';
    this.diagramView = 'body';
    this.bodySide = 'front';
    this.selectedGender = 'female';
    this.selectedRegionSlugs.clear();
    this.selectedConcernIds.clear();
    this.selectedServiceIds.clear();
    this.expandedRegions.clear();
    this.concernSearchQuery = '';
    this.formError = '';
    this.selectedPainPoints.clear();
    this.selectedOutcomes.clear();
    this.selectedBarriers.clear();
    this.tbOtherPainPoint = '';
    this.tbOtherOutcome = '';
    this.bridgeAnimationStep = 0;
    if (this.bridgeTimer) { clearTimeout(this.bridgeTimer); this.bridgeTimer = null; }
    this.render();
  }


  // ── Render dispatcher ──

  private render() {
    if (!this.config) return;
    const { branding } = this.config;
    const primary = branding.primary_color || '#e84393';
    const font = branding.font_family || '';
    const fullpageCss = this.fullpage
      ? `:host{display:flex;flex-direction:column;height:100%;}
.tb-root{border-radius:0 !important;box-shadow:none !important;flex:1;display:flex;flex-direction:column;min-height:0;}
.tb-split,.tb-guided-body,.tb-guided-concerns{max-height:none !important;flex:1;min-height:0;}`
      : '';
    const cssVars = `:host{--tb-primary:${primary};${font ? `--tb-font:${font};` : ''}}`;
    const style = raw(`<style>${cssVars}${widgetStyles}${fullpageCss}</style>`);

    let content: SafeHTML;
    if (this.view === 'success') content = this.renderSuccess();
    else if (this.view === 'form') content = this.renderForm();
    else if (this.view === 'guided-concerns') content = this.renderGuidedConcerns();
    else if (this.view === 'tb-pain-points') content = this.renderTBPainPoints();
    else if (this.view === 'tb-outcomes') content = this.renderTBOutcomes();
    else if (this.view === 'tb-barriers') content = this.renderTBBarriers();
    else if (this.view === 'tb-bridge') content = this.renderTBBridge();
    else if (this.view === 'tb-lead-capture') content = this.renderTBLeadCapture();
    else content = this.renderBodyView();

    this.shadow.innerHTML = html`${style}${content}`.value;
    this.wireEvents();
  }

  // ── Step Indicator ──

  private renderStepIndicator(): SafeHTML {
    const steps = ['Select Areas', 'Your Concerns', 'Your Info'];
    return html`
      <div class="tb-steps">
        ${steps.map((label, i) => {
          const isActive = i === this.currentStep;
          const isCompleted = i < this.currentStep;
          const dotClass = `tb-step-dot ${isActive ? 'active' : isCompleted ? 'completed' : 'pending'}`;
          return html`
            ${i > 0 ? html`<div class="tb-step-line" style="background:${i <= this.currentStep ? this.primaryColor : '#e2e8f0'}"></div>` : false}
            <div class="tb-step">
              <div class="${dotClass}">
                ${isCompleted
                  ? raw('<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>')
                  : html`<span class="tb-step-num" style="color:${isActive ? '#fff' : '#94a3b8'}">${i + 1}</span>`}
              </div>
              <span class="tb-step-label" style="color:${isActive ? this.primaryColor : '#94a3b8'}">${label}</span>
            </div>
          `;
        })}
      </div>
    `;
  }

  // ── Body Diagram View ──

  private renderBodyView(): SafeHTML {
    if (this.useCards) return this.renderCardBody();
    if (this.isGuided) return this.renderGuidedBody();
    return this.renderSplitBody();
  }

  // ── Card-based Region Selector ──

  private renderCardBody(): SafeHTML {
    const cfg = this.config!;
    const pc = this.primaryColor;

    // Group regions by body_area for display, deduplicating by slug
    const seen = new Set<string>();
    const uniqueRegions: WidgetRegion[] = [];
    for (const r of this.genderRegions) {
      if (!seen.has(r.slug)) {
        seen.add(r.slug);
        uniqueRegions.push(r);
      }
    }

    return html`
      <div class="tb-root">
        <div class="tb-header">
          ${cfg.tenant.logo_url ? html`<img src="${cfg.tenant.logo_url}" alt="${cfg.tenant.name}">` : false}
          <h2>${cfg.branding.cta_text || 'Build Your Consultation Plan'}</h2>
          <p>Select the areas you'd like to address</p>
        </div>

        ${this.renderStepIndicator()}

        <div class="tb-gender-switch">
          <button class="tb-gender-switch-btn" data-gender="${this.selectedGender === 'female' ? 'male' : 'female'}">Switch to ${this.selectedGender === 'female' ? 'Male' : 'Female'}</button>
        </div>

        <div class="tb-card-grid">
          ${uniqueRegions.map(region => {
            const isSelected = this.selectedRegionSlugs.has(region.slug);
            const icon = ICONS.regionCard[region.slug] || ICONS.cursor;
            const concernCount = region.concerns.length;
            return html`
              <button
                class="tb-region-card${isSelected ? ' selected' : ''}"
                data-region-slug="${region.slug}"
                style="${isSelected ? `border-color:${pc};--tb-card-accent:${pc}` : ''}"
              >
                <div class="tb-region-card-icon" style="${isSelected ? `color:${pc}` : ''}">${raw(icon)}</div>
                <div class="tb-region-card-name">${region.name}</div>
                ${concernCount > 0 ? html`<div class="tb-region-card-sub">${concernCount} concern${concernCount !== 1 ? 's' : ''}</div>` : false}
                ${isSelected ? html`<div class="tb-region-card-check" style="background:${pc}">${raw(ICONS.check)}</div>` : false}
              </button>
            `;
          })}
        </div>

        ${this.selectedRegionSlugs.size > 0 ? html`
          <div class="tb-guided-chips" style="margin-top:16px">
            ${this.selectedRegions.map(r => html`
              <span class="tb-chip">
                ${r.name}
                <button class="tb-chip-x" data-remove-region="${r.slug}">${raw(ICONS.x)}</button>
              </span>
            `)}
          </div>
        ` : false}

        ${this.showConcerns || this.showServices ? html`
          <div class="tb-card-panel">
            ${this.renderPanel()}
          </div>
        ` : false}

        ${!(this.showConcerns || this.showServices) && this.selectedRegionSlugs.size > 0 ? html`
          <div style="padding:16px 0;text-align:center">
            <button class="tb-continue-btn" data-action="continue">
              Continue ${raw(ICONS.chevronRight)}
            </button>
          </div>
        ` : false}

        ${this.renderFooter()}
      </div>
    `;
  }

  private renderSplitBody(): SafeHTML {
    const cfg = this.config!;
    const pc = this.primaryColor;

    return html`
      <div class="tb-root">
        <div class="tb-header">
          ${cfg.tenant.logo_url ? html`<img src="${cfg.tenant.logo_url}" alt="${cfg.tenant.name}">` : false}
          <h2>${cfg.branding.cta_text || 'Build Your Consultation Plan'}</h2>
          <p>Select the areas you'd like to address</p>
        </div>

        ${this.renderStepIndicator()}

        <div class="tb-split">
          <div class="tb-diagram-col">
            ${this.diagramView === 'face' && !this.isFaceOnly
              ? html`<button class="tb-back-to-body" data-action="back-to-body-diagram">${raw(ICONS.chevronLeft.replace('viewBox', 'width="14" height="14" viewBox'))} Back to Body</button>`
              : false}

            <div class="tb-diagram-row">
              ${this.diagramView === 'body' ? html`
                <button class="tb-rotate-btn" data-side="front" title="Front">${raw(ICONS.rotateCcw)} Front</button>
              ` : html`<div class="tb-rotate-spacer"></div>`}

              <div class="tb-diagram-wrap">
                ${this.diagramView === 'body'
                  ? renderBodySVG(this.selectedGender, this.bodySide, this.selectedRegionSlugs, this.activeRegionSlugs, pc)
                  : renderFaceSVG(this.selectedGender, this.selectedRegionSlugs, this.activeRegionSlugs, pc)}
              </div>

              ${this.diagramView === 'body' ? html`
                <button class="tb-rotate-btn" data-side="back" title="Back">Back ${raw(ICONS.rotateCw)}</button>
              ` : html`<div class="tb-rotate-spacer"></div>`}
            </div>

            <div class="tb-gender-switch">
              <button class="tb-gender-switch-btn" data-gender="${this.selectedGender === 'female' ? 'male' : 'female'}">Switch to ${this.selectedGender === 'female' ? 'Male' : 'Female'}</button>
            </div>
          </div>

          ${this.selectedRegionSlugs.size > 0
            ? html`<div class="tb-mobile-summary">${this.selectedRegionSlugs.size} area${this.selectedRegionSlugs.size !== 1 ? 's' : ''} &middot; ${this.selectedConcernIds.size} concern${this.selectedConcernIds.size !== 1 ? 's' : ''}</div>`
            : false}

          <div class="tb-panel-col">
            ${this.renderPanel()}
          </div>
        </div>

        ${this.renderFooter()}
      </div>
    `;
  }

  // ── Guided Layout: Body Step ──

  private renderGuidedBody(): SafeHTML {
    const cfg = this.config!;
    const pc = this.primaryColor;

    return html`
      <div class="tb-root">
        <div class="tb-header">
          ${cfg.tenant.logo_url ? html`<img src="${cfg.tenant.logo_url}" alt="${cfg.tenant.name}">` : false}
          <h2>${cfg.branding.cta_text || 'Build Your Consultation Plan'}</h2>
          <p>Select the areas you'd like to address</p>
        </div>

        ${this.renderStepIndicator()}

        <div class="tb-guided-body">
          ${this.diagramView === 'face' && !this.isFaceOnly
            ? html`<button class="tb-back-to-body" data-action="back-to-body-diagram">${raw(ICONS.chevronLeft.replace('viewBox', 'width="14" height="14" viewBox'))} Back to Body</button>`
            : false}

          <div class="tb-diagram-row">
            ${this.diagramView === 'body' ? html`
              <button class="tb-rotate-btn" data-side="front" title="Front">${raw(ICONS.rotateCcw)} Front</button>
            ` : html`<div class="tb-rotate-spacer"></div>`}

            <div class="tb-guided-diagram">
              ${this.diagramView === 'body'
                ? renderBodySVG(this.selectedGender, this.bodySide, this.selectedRegionSlugs, this.activeRegionSlugs, pc)
                : renderFaceSVG(this.selectedGender, this.selectedRegionSlugs, this.activeRegionSlugs, pc)}
            </div>

            ${this.diagramView === 'body' ? html`
              <button class="tb-rotate-btn" data-side="back" title="Back">Back ${raw(ICONS.rotateCw)}</button>
            ` : html`<div class="tb-rotate-spacer"></div>`}
          </div>

          <div class="tb-gender-switch">
            <button class="tb-gender-switch-btn" data-gender="${this.selectedGender === 'female' ? 'male' : 'female'}">Switch to ${this.selectedGender === 'female' ? 'Male' : 'Female'}</button>
          </div>

          ${this.selectedRegionSlugs.size > 0 ? html`
            <div class="tb-guided-chips">
              ${this.selectedRegions.map(r => html`
                <span class="tb-chip">
                  ${r.name}
                  <button class="tb-chip-x" data-remove-region="${r.slug}">${raw(ICONS.x)}</button>
                </span>
              `)}
            </div>
          ` : false}

          <div class="tb-guided-nav">
            <div></div>
            <button class="tb-continue-btn${this.selectedRegionSlugs.size === 0 ? ' disabled' : ''}" data-action="guided-to-concerns" ${this.selectedRegionSlugs.size === 0 ? raw('disabled') : false}>
              Continue ${raw(ICONS.chevronRight)}
            </button>
          </div>
        </div>

        ${this.renderFooter()}
      </div>
    `;
  }

  // ── Panel ──

  private renderPanel(): SafeHTML {
    if (this.selectedRegionSlugs.size === 0) {
      return html`
        <div class="tb-panel-empty">
          <div class="tb-panel-empty-icon">${raw(ICONS.cursor)}</div>
          <p class="tb-panel-empty-title">Select a body area</p>
          <p class="tb-panel-empty-sub">Tap the <strong>+</strong> buttons on the body to see ${this.showConcerns ? 'available concerns' : 'available treatments'}</p>
        </div>
      `;
    }

    const query = this.concernSearchQuery.toLowerCase();

    return html`
      <div class="tb-panel-content">
        ${this.showConcerns && this.selectedRegionSlugs.size > 0 ? html`
          <div class="tb-search">
            <span class="tb-search-icon">${raw(ICONS.search)}</span>
            <input type="text" placeholder="Search concerns..." value="${this.concernSearchQuery}" data-action="search"/>
            ${this.concernSearchQuery ? html`<button class="tb-search-clear" data-action="clear-search">${raw(ICONS.x)}</button>` : false}
          </div>
        ` : false}

        ${this.showConcerns ? (() => {
          const hasQuery = !!query;
          let anyVisible = false;
          const groups = this.concernsByRegion.map(group => {
            const isExpanded = this.expandedRegions.has(group.regionSlug);
            const count = this.getRegionConcernCount(group.regionSlug);
            const popularIds = this.getPopularIds(group.concerns);
            const filtered = hasQuery
              ? group.concerns.filter(c => c.name.toLowerCase().includes(query))
              : group.concerns;
            if (hasQuery && filtered.length === 0) return false;
            anyVisible = true;

            return html`
              <div>
                <div class="tb-region-header" data-toggle-region="${group.regionSlug}">
                  <span class="tb-region-chevron ${isExpanded ? 'expanded' : 'collapsed'}">${raw(ICONS.chevronDown)}</span>
                  <span class="tb-region-name">${group.regionName}</span>
                  ${count > 0 ? html`<span class="tb-region-badge">${count} selected</span>` : false}
                  <button class="tb-region-remove" data-remove-region="${group.regionSlug}" title="Remove region">${raw(ICONS.x)}</button>
                </div>
                <div class="tb-region-concerns ${isExpanded ? 'expanded' : 'collapsed'}">
                  <div class="tb-concern-list">
                    ${filtered.map(c => this.renderConcernBtn(c, popularIds))}
                  </div>
                </div>
              </div>
            `;
          });
          return html`
            ${groups}
            ${this.concernsByRegion.length === 0
              ? html`<p style="padding:16px 0;text-align:center;font-size:13px;color:#94a3b8">No concerns configured for the selected areas.</p>`
              : false}
            ${hasQuery && !anyVisible
              ? html`<p style="padding:24px 0;text-align:center;font-size:13px;color:#94a3b8">No concerns match &ldquo;${this.concernSearchQuery}&rdquo;</p>`
              : false}
          `;
        })() : false}

        ${this.showServices && this.config
          ? this.filteredServiceCategories
              .filter(cat => cat.services.length > 0)
              .map(cat => html`
                <div class="tb-svc-cat">
                  <div class="tb-svc-cat-title">${cat.name}</div>
                  <div style="display:flex;flex-direction:column;gap:4px">
                    ${cat.services.map(svc => {
                      const sel = this.selectedServiceIds.has(svc.id);
                      return html`
                        <button class="tb-item-btn${sel ? ' selected' : ''}" data-service-id="${svc.id}">
                          <span class="tb-item-check ${sel ? 'on' : 'off'}">${sel ? raw(ICONS.check) : false}</span>
                          <span class="${sel ? 'tb-item-name selected' : 'tb-item-name'}">${svc.name}${svc.description ? html`<span class="tb-svc-desc">${svc.description}</span>` : false}</span>
                        </button>
                      `;
                    })}
                  </div>
                </div>
              `)
          : false}
      </div>

      ${(this.totalSelections > 0 || this.selectedRegionSlugs.size > 0) ? html`
        <div class="tb-summary-bar">
          <span class="tb-summary-text">${this.selectedRegionSlugs.size} area${this.selectedRegionSlugs.size !== 1 ? 's' : ''} &middot; ${this.totalSelections} concern${this.totalSelections !== 1 ? 's' : ''} selected</span>
          <button class="tb-continue-btn" data-action="continue">Continue ${raw(ICONS.chevronRight)}</button>
        </div>
      ` : false}
    `;
  }

  private renderConcernBtn(concern: WidgetConcern & { regionSlug: string }, popularIds: Set<string>): SafeHTML {
    const sel = this.selectedConcernIds.has(concern.id);
    const isPopular = popularIds.has(concern.id);
    return html`
      <button class="tb-item-btn${sel ? ' selected' : ''}" data-concern-id="${concern.id}">
        <span class="tb-item-check ${sel ? 'on' : 'off'}">${sel ? raw(ICONS.check) : false}</span>
        <span class="${sel ? 'tb-item-name selected' : 'tb-item-name'}">${concern.name}</span>
        ${isPopular ? html`<span class="tb-popular">Popular</span>` : false}
      </button>
    `;
  }

  // ── Guided Layout: Concerns/Services Step ──

  private renderGuidedConcerns(): SafeHTML {
    const cfg = this.config!;
    const query = this.concernSearchQuery.toLowerCase();

    return html`
      <div class="tb-root">
        <div class="tb-header">
          ${cfg.tenant.logo_url ? html`<img src="${cfg.tenant.logo_url}" alt="${cfg.tenant.name}">` : false}
          <h2>What are your concerns?</h2>
          <p>Select the concerns you'd like to address</p>
        </div>

        ${this.renderStepIndicator()}

        <div class="tb-guided-concerns">
          ${this.showConcerns ? html`
            <div class="tb-search">
              <span class="tb-search-icon">${raw(ICONS.search)}</span>
              <input type="text" placeholder="Search concerns..." value="${this.concernSearchQuery}" data-action="search"/>
              ${this.concernSearchQuery ? html`<button class="tb-search-clear" data-action="clear-search">${raw(ICONS.x)}</button>` : false}
            </div>
          ` : false}

          <div class="tb-guided-list">
            ${this.showConcerns ? (() => {
              const hasQuery = !!query;
              let anyVisible = false;
              const groups = this.concernsByRegion.map(group => {
                const isExpanded = this.expandedRegions.has(group.regionSlug);
                const count = this.getRegionConcernCount(group.regionSlug);
                const popularIds = this.getPopularIds(group.concerns);
                const filtered = hasQuery
                  ? group.concerns.filter(c => c.name.toLowerCase().includes(query))
                  : group.concerns;
                if (hasQuery && filtered.length === 0) return false;
                anyVisible = true;

                return html`
                  <div>
                    <div class="tb-region-header" data-toggle-region="${group.regionSlug}">
                      <span class="tb-region-chevron ${isExpanded ? 'expanded' : 'collapsed'}">${raw(ICONS.chevronDown)}</span>
                      <span class="tb-region-name">${group.regionName}</span>
                      ${count > 0 ? html`<span class="tb-region-badge">${count} selected</span>` : false}
                    </div>
                    <div class="tb-region-concerns ${isExpanded ? 'expanded' : 'collapsed'}">
                      <div class="tb-concern-list">
                        ${filtered.map(c => this.renderConcernBtn(c, popularIds))}
                      </div>
                    </div>
                  </div>
                `;
              });
              return html`
                ${groups}
                ${this.concernsByRegion.length === 0
                  ? html`<p style="padding:16px 0;text-align:center;font-size:13px;color:#94a3b8">No concerns configured for the selected areas.</p>`
                  : false}
                ${hasQuery && !anyVisible
                  ? html`<p style="padding:24px 0;text-align:center;font-size:13px;color:#94a3b8">No concerns match &ldquo;${this.concernSearchQuery}&rdquo;</p>`
                  : false}
              `;
            })() : false}

            ${this.showServices && this.config
              ? this.filteredServiceCategories
                  .filter(cat => cat.services.length > 0)
                  .map(cat => html`
                    <div class="tb-svc-cat">
                      <div class="tb-svc-cat-title">${cat.name}</div>
                      <div style="display:flex;flex-direction:column;gap:4px">
                        ${cat.services.map(svc => {
                          const sel = this.selectedServiceIds.has(svc.id);
                          return html`
                            <button class="tb-item-btn${sel ? ' selected' : ''}" data-service-id="${svc.id}">
                              <span class="tb-item-check ${sel ? 'on' : 'off'}">${sel ? raw(ICONS.check) : false}</span>
                              <span class="${sel ? 'tb-item-name selected' : 'tb-item-name'}">${svc.name}${svc.description ? html`<span class="tb-svc-desc">${svc.description}</span>` : false}</span>
                            </button>
                          `;
                        })}
                      </div>
                    </div>
                  `)
              : false}
          </div>

          <div class="tb-guided-nav">
            <button class="tb-back-btn" data-action="guided-back-to-body">${raw(ICONS.chevronLeft)} Back</button>
            <button class="tb-continue-btn" data-action="continue">Continue ${raw(ICONS.chevronRight)}</button>
          </div>
        </div>

        ${this.renderFooter()}
      </div>
    `;
  }

  // ══════════════════════════════════════════════════════
  // Treatment Builder Flow (Steps 2-6)
  // Step 1 is the body area selection (shared with other modes)
  // ══════════════════════════════════════════════════════

  private renderTBStepIndicator(currentStep: number): SafeHTML {
    const steps = ['Body Area', 'Pain Points', 'Outcomes', 'Barriers', 'Your Plan'];
    const pc = this.primaryColor;
    return html`
      <div class="tb-steps">
        ${steps.map((label, i) => {
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          const dotClass = `tb-step-dot ${isActive ? 'active' : isCompleted ? 'completed' : 'pending'}`;
          return html`
            ${i > 0 ? html`<div class="tb-step-line" style="background:${i <= currentStep ? pc : '#e2e8f0'}"></div>` : false}
            <div class="tb-step">
              <div class="${dotClass}">
                ${isCompleted
                  ? raw('<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>')
                  : html`<span class="tb-step-num" style="color:${isActive ? '#fff' : '#94a3b8'}">${i + 1}</span>`}
              </div>
              <span class="tb-step-label" style="color:${isActive ? pc : '#94a3b8'}">${label}</span>
            </div>
          `;
        })}
      </div>
    `;
  }

  private renderTBPillGrid(options: TBOption[], selectedIds: Set<string>, dataAttr: string): SafeHTML {
    const pc = this.primaryColor;
    return html`
      <div class="tb-pill-grid">
        ${options.map(opt => {
          const sel = selectedIds.has(opt.id);
          return html`
            <button
              class="tb-pill${sel ? ' selected' : ''}"
              data-${dataAttr}="${opt.id}"
              style="${sel ? `border-color:${pc};background:color-mix(in srgb, ${pc} 8%, #fff);color:${pc}` : ''}"
            >
              ${sel ? html`<span class="tb-pill-check" style="color:${pc}">${raw(ICONS.check)}</span>` : false}
              ${opt.label}
            </button>
          `;
        })}
      </div>
    `;
  }

  // ── Step 2: Pain Points ──

  private renderTBPainPoints(): SafeHTML {
    const cfg = this.config!;
    const options = getPainPoints(this.selectedRegionSlugs);

    return html`
      <div class="tb-root">
        <div class="tb-header">
          ${cfg.tenant.logo_url ? html`<img src="${cfg.tenant.logo_url}" alt="${cfg.tenant.name}">` : false}
          <h2>We'd love to understand you better.</h2>
          <p>How do these concerns affect your daily life? Select all that apply.</p>
        </div>

        ${this.renderTBStepIndicator(1)}

        ${this.renderTBPillGrid(options, this.selectedPainPoints, 'tb-pain')}

        <div class="tb-other-field">
          <input type="text" class="tb-input" placeholder="Other — describe in your own words..." value="${this.tbOtherPainPoint}" data-tb-other="pain" />
        </div>

        <div class="tb-nav">
          <button class="tb-back-btn" data-action="tb-back-to-body">${raw(ICONS.chevronLeft)} Back</button>
          <button class="tb-continue-btn${this.selectedPainPoints.size === 0 && !this.tbOtherPainPoint ? ' disabled' : ''}" data-action="tb-to-outcomes" ${this.selectedPainPoints.size === 0 && !this.tbOtherPainPoint ? raw('disabled') : false}>
            Continue ${raw(ICONS.chevronRight)}
          </button>
        </div>

        ${this.renderFooter()}
      </div>
    `;
  }

  // ── Step 3: Outcomes ──

  private renderTBOutcomes(): SafeHTML {
    const cfg = this.config!;
    const options = getOutcomes(this.selectedRegionSlugs);

    return html`
      <div class="tb-root">
        <div class="tb-header tb-header-warm">
          ${cfg.tenant.logo_url ? html`<img src="${cfg.tenant.logo_url}" alt="${cfg.tenant.name}">` : false}
          <h2>Now picture the possibilities.</h2>
          <p>If we could help, how would that change things for you?</p>
        </div>

        ${this.renderTBStepIndicator(2)}

        ${this.renderTBPillGrid(options, this.selectedOutcomes, 'tb-outcome')}

        <div class="tb-other-field">
          <input type="text" class="tb-input" placeholder="Other — tell us your vision..." value="${this.tbOtherOutcome}" data-tb-other="outcome" />
        </div>

        <div class="tb-nav">
          <button class="tb-back-btn" data-action="tb-to-pain-points">${raw(ICONS.chevronLeft)} Back</button>
          <button class="tb-continue-btn${this.selectedOutcomes.size === 0 && !this.tbOtherOutcome ? ' disabled' : ''}" data-action="tb-to-barriers" ${this.selectedOutcomes.size === 0 && !this.tbOtherOutcome ? raw('disabled') : false}>
            Continue ${raw(ICONS.chevronRight)}
          </button>
        </div>

        ${this.renderFooter()}
      </div>
    `;
  }

  // ── Step 4: Barriers ──

  private renderTBBarriers(): SafeHTML {
    const cfg = this.config!;

    return html`
      <div class="tb-root">
        <div class="tb-header">
          ${cfg.tenant.logo_url ? html`<img src="${cfg.tenant.logo_url}" alt="${cfg.tenant.name}">` : false}
          <h2>What's held you back until now?</h2>
          <p>No judgment — these are common and we can help address every one of them.</p>
        </div>

        ${this.renderTBStepIndicator(3)}

        ${this.renderTBPillGrid(BARRIERS, this.selectedBarriers, 'tb-barrier')}

        <div class="tb-nav">
          <button class="tb-back-btn" data-action="tb-to-outcomes">${raw(ICONS.chevronLeft)} Back</button>
          <button class="tb-continue-btn" data-action="tb-to-bridge">
            Continue ${raw(ICONS.chevronRight)}
          </button>
        </div>

        ${this.renderFooter()}
      </div>
    `;
  }

  // ── Step 5: Bridge / Pre-sell ──

  private get bridgeMessages(): string[] {
    const cfg = this.config!;
    const practiceName = cfg.tenant.name;
    return [
      'Putting together your personalized analysis...',
      `Thank you for trusting ${practiceName}.`,
      'We help patients just like you achieve incredible results.',
      'Picture yourself with more confidence and freedom in just a short time.',
      "You're going to love the way you feel.",
    ];
  }

  private startBridgeAnimation() {
    if (this.bridgeTimer) clearTimeout(this.bridgeTimer);
    this.bridgeAnimationStep = 0;
    this.render();

    const advance = () => {
      this.bridgeAnimationStep++;
      if (this.bridgeAnimationStep < this.bridgeMessages.length + 1) {
        this.render();
        this.bridgeTimer = setTimeout(advance, this.bridgeAnimationStep === 1 ? 2000 : 1800);
      } else {
        // Animation complete — show CTA
        this.render();
      }
    };
    this.bridgeTimer = setTimeout(advance, 2200);
  }

  private renderTBBridge(): SafeHTML {
    const cfg = this.config!;
    const messages = this.bridgeMessages;
    const step = this.bridgeAnimationStep;
    const showCta = step >= messages.length;
    const pc = this.primaryColor;

    return html`
      <div class="tb-root">
        <div class="tb-bridge">
          ${cfg.tenant.logo_url ? html`<img class="tb-bridge-logo" src="${cfg.tenant.logo_url}" alt="${cfg.tenant.name}">` : false}

          <div class="tb-bridge-animation">
            <div class="tb-bridge-pulse" style="background:${pc}"></div>
          </div>

          <div class="tb-bridge-messages">
            ${messages.map((msg, i) => html`
              <p class="tb-bridge-msg${i < step ? ' visible' : ''}">${msg}</p>
            `)}
          </div>

          ${showCta ? html`
            <button class="tb-bridge-cta" data-action="tb-to-lead-capture" style="background:${pc}">
              See Your Recommendations ${raw(ICONS.chevronRight)}
            </button>
          ` : false}
        </div>
      </div>
    `;
  }

  // ── Step 6: Lead Capture ──

  private renderTBLeadCapture(): SafeHTML {
    const cfg = this.config!;
    const pc = this.primaryColor;

    // Partition fields: opt-in checkboxes vs regular fields
    const isOptIn = (f: WidgetFormField) => f.field_key?.endsWith('_opt_in');
    const contactFields = cfg.form_fields.filter(f => !isOptIn(f));
    const optInFields = cfg.form_fields.filter(f => isOptIn(f));

    return html`
      <div class="tb-root">
        <div class="tb-header">
          ${cfg.tenant.logo_url ? html`<img src="${cfg.tenant.logo_url}" alt="${cfg.tenant.name}">` : false}
          <h2>You're one step away from a new you.</h2>
          <p>Fill in your details and a member of our team will reach out to discuss your personalized plan.</p>
        </div>

        ${this.renderTBStepIndicator(4)}

        <form class="tb-form-body" id="tb-form" novalidate>
          ${contactFields.length > 0 ? html`
            <div class="tb-form-grid">
              ${contactFields.map(field => this.renderFormField(field))}
            </div>
          ` : false}

          ${optInFields.length > 0 ? html`
            <div class="tb-optin">
              <p class="tb-optin-title">Communication Preferences</p>
              ${optInFields.map(field => html`
                <label class="tb-optin-label">
                  <input type="checkbox" name="${field.field_key || 'custom_' + field.id}"/>
                  <span>${field.placeholder || field.label}</span>
                </label>
              `)}
            </div>
          ` : false}

          ${this.formError ? html`<p class="tb-form-error">${this.formError}</p>` : false}

          <div class="tb-nav">
            <button type="button" class="tb-back-btn" data-action="tb-to-barriers">${raw(ICONS.chevronLeft)} Back</button>
            <button type="submit" class="tb-submit-btn" style="background:${pc}" ${this.submitting ? raw('disabled') : false}>
              ${this.submitting ? 'Submitting...' : cfg.branding.cta_text || 'Request Consultation'}
            </button>
          </div>
        </form>

        ${this.renderFooter()}
      </div>
    `;
  }

  // ── Form View ──

  private renderForm(): SafeHTML {
    const cfg = this.config!;

    // Partition fields: opt-in checkboxes vs regular fields
    const isOptIn = (f: WidgetFormField) => f.field_key?.endsWith('_opt_in');
    const contactFields = cfg.form_fields.filter(f => !isOptIn(f));
    const optInFields = cfg.form_fields.filter(f => isOptIn(f));

    return html`
      <div class="tb-root">
        <div class="tb-header">
          <h2>Complete Your Consultation Request</h2>
          <p>Fill in your details and we'll reach out with personalized recommendations</p>
        </div>

        ${this.renderStepIndicator()}

        <form class="tb-form-body" id="tb-form" novalidate>
          ${contactFields.length > 0 ? html`
            <div class="tb-form-grid">
              ${contactFields.map(field => this.renderFormField(field))}
            </div>
          ` : false}

          ${optInFields.length > 0 ? html`
            <div class="tb-optin">
              <p class="tb-optin-title">Communication Preferences</p>
              ${optInFields.map(field => html`
                <label class="tb-optin-label">
                  <input type="checkbox" name="${field.field_key || 'custom_' + field.id}"/>
                  <span>${field.placeholder || field.label}</span>
                </label>
              `)}
            </div>
          ` : false}

          ${this.formError ? html`<p class="tb-form-error">${this.formError}</p>` : false}

          <div class="tb-nav">
            <button type="button" class="tb-back-btn" data-action="back-to-body">${raw(ICONS.chevronLeft)} Back</button>
            <button type="submit" class="tb-submit-btn" ${this.submitting ? raw('disabled') : false}>${this.submitting ? 'Submitting...' : cfg.branding.cta_text || 'Request Consultation'}</button>
          </div>
        </form>

        ${this.renderFooter()}
      </div>
    `;
  }

  private renderFormField(field: WidgetFormField): SafeHTML {
    const name = field.field_key || `custom_${field.id}`;
    const req = field.is_required ? raw('required') : false;
    const isFullWidth = field.field_type === 'textarea' || field.field_type === 'select' || field.field_type === 'radio' || field.field_type === 'location';
    const wrapStyle = isFullWidth ? ' style="grid-column:1/-1"' : '';

    let fieldEl: SafeHTML;
    if (field.field_type === 'location') {
      const locs = this.config?.locations || [];
      if (locs.length <= 1) return html``;
      fieldEl = html`
        <select class="tb-select" name="location_id" ${req}>
          <option value="">${field.placeholder || 'Select a location...'}</option>
          ${locs.map(loc => html`<option value="${loc.id}"${this.locationId === loc.id ? raw(' selected') : false}>${loc.name}${loc.city ? html` — ${loc.city}${loc.state ? html`, ${loc.state}` : false}` : false}</option>`)}
        </select>
      `;
    } else if (field.field_type === 'textarea') {
      fieldEl = html`<textarea class="tb-textarea" name="${name}" placeholder="${field.placeholder || ''}" rows="2" ${req}></textarea>`;
    } else if (field.field_type === 'select') {
      fieldEl = html`
        <select class="tb-select" name="${name}" ${req}>
          <option value="">Select...</option>
          ${(field.options || []).map(opt => html`<option value="${opt}">${opt}</option>`)}
        </select>
      `;
    } else if (field.field_type === 'checkbox') {
      fieldEl = html`<div class="tb-checkbox-field"><input type="checkbox" name="${name}"/><span>${field.placeholder || field.label}</span></div>`;
    } else if (field.field_type === 'radio') {
      fieldEl = html`
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${(field.options || []).map(opt => html`
            <label class="tb-radio-label"><input type="radio" name="${name}" value="${opt}" ${req}/> ${opt}</label>
          `)}
        </div>
      `;
    } else {
      const inputType = field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : field.field_type === 'date' ? 'date' : 'text';
      fieldEl = html`<input class="tb-input" type="${inputType}" name="${name}" placeholder="${field.placeholder || ''}" ${req}/>`;
    }

    return html`
      <div class="tb-field"${raw(wrapStyle)}>
        <label class="tb-label">${field.label}${field.is_required ? ' *' : ''}</label>
        ${fieldEl}
      </div>
    `;
  }

  // ── Success View ──

  private renderSuccess(): SafeHTML {
    const cfg = this.config!;
    return html`
      <div class="tb-root">
        <div class="tb-success">
          <div class="tb-success-icon">${raw(ICONS.check)}</div>
          <h2>Thank You!</h2>
          <p>${cfg.branding.success_message || "Thank you for your interest! We'll be in touch shortly with personalized recommendations."}</p>
          <button class="tb-reset-btn" data-action="reset">Start Over</button>
        </div>
        ${this.renderFooter()}
      </div>
    `;
  }

  // ── Footer ──

  private renderFooter(): SafeHTML {
    return html`
      <div class="tb-footer">
        <span>Powered by Consult Intake</span>
        <button data-action="reset-footer">${raw(ICONS.refresh)} Reset</button>
      </div>
    `;
  }

  // ── Event Wiring ──

  private wireEvents() {
    const root = this.shadow;

    // Bind persistent click handler only once (survives innerHTML re-renders via event delegation)
    if (!this.eventsBound) {
      this.eventsBound = true;
      root.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        if (!target) return;

        // Walk up to find actionable element
        const el = target.closest<HTMLElement>('[data-action], [data-gender], [data-side], [data-concern-id], [data-service-id], [data-toggle-region], [data-remove-region], [data-region-slug], [data-tb-pain], [data-tb-outcome], [data-tb-barrier]');
        if (!el) {
          // Check if click was inside an SVG anchor group
          const anchor = target.closest<SVGElement>('.tb-anchor');
          if (anchor) {
            const slugs = anchor.getAttribute('data-anchor-slugs');
            if (slugs) {
              const slugArr = slugs.split(',');
              // Face anchor: drill down to face view without selecting
              if (this.diagramView === 'body' && slugArr.some(s => ['upper-face', 'midface', 'lips', 'lower-face'].includes(s))) {
                this.diagramView = 'face';
                this.render();
                return;
              }
              this.handleAnchorClick(slugArr);
            }
          }
          return;
        }

        // Actions
        const action = el.getAttribute('data-action');
        if (action === 'continue') { this.view = this.isTreatmentBuilder ? 'tb-pain-points' : 'form'; this.render(); return; }
        if (action === 'guided-to-concerns') { this.view = this.isTreatmentBuilder ? 'tb-pain-points' : 'guided-concerns'; this.render(); return; }
        if (action === 'guided-back-to-body') { this.view = 'body'; this.render(); return; }
        if (action === 'back-to-body') {
          if (this.isTreatmentBuilder) { this.view = 'tb-barriers'; }
          else if (this.isGuided) { this.view = 'guided-concerns'; }
          else { this.view = 'body'; }
          this.formError = '';
          this.render();
          return;
        }
        if (action === 'back-to-body-diagram') { this.diagramView = 'body'; this.render(); return; }
        if (action === 'reset' || action === 'reset-footer') { this.reset(); return; }
        if (action === 'clear-search') { this.concernSearchQuery = ''; this.render(); return; }

        // Treatment Builder navigation
        if (action === 'tb-back-to-body') { this.view = 'body'; this.render(); return; }
        if (action === 'tb-to-pain-points') { this.view = 'tb-pain-points'; this.render(); return; }
        if (action === 'tb-to-outcomes') { this.view = 'tb-outcomes'; this.render(); return; }
        if (action === 'tb-to-barriers') { this.view = 'tb-barriers'; this.render(); return; }
        if (action === 'tb-to-bridge') { this.view = 'tb-bridge'; this.startBridgeAnimation(); return; }
        if (action === 'tb-to-lead-capture') { this.view = 'tb-lead-capture'; this.render(); return; }

        // Gender
        const gender = el.getAttribute('data-gender');
        if (gender === 'female' || gender === 'male') { this.setGender(gender); return; }

        // Body side
        const side = el.getAttribute('data-side');
        if (side === 'front' || side === 'back') { this.bodySide = side; this.render(); return; }

        // Concern
        const concernId = el.getAttribute('data-concern-id');
        if (concernId) { this.toggleConcern(concernId); return; }

        // Service
        const serviceId = el.getAttribute('data-service-id');
        if (serviceId) { this.toggleService(serviceId); return; }

        // Region accordion toggle
        const toggleRegion = el.getAttribute('data-toggle-region');
        if (toggleRegion) { this.toggleRegionExpanded(toggleRegion); return; }

        // Region remove
        const removeRegion = el.getAttribute('data-remove-region');
        if (removeRegion) { e.stopPropagation(); this.removeRegion(removeRegion); return; }

        // Region card toggle (card-based selector)
        const regionSlug = el.getAttribute('data-region-slug');
        if (regionSlug) { this.handleAnchorClick([regionSlug]); return; }

        // Treatment Builder pill toggles
        const tbPain = el.getAttribute('data-tb-pain');
        if (tbPain) { if (this.selectedPainPoints.has(tbPain)) this.selectedPainPoints.delete(tbPain); else this.selectedPainPoints.add(tbPain); this.render(); return; }

        const tbOutcome = el.getAttribute('data-tb-outcome');
        if (tbOutcome) { if (this.selectedOutcomes.has(tbOutcome)) this.selectedOutcomes.delete(tbOutcome); else this.selectedOutcomes.add(tbOutcome); this.render(); return; }

        const tbBarrier = el.getAttribute('data-tb-barrier');
        if (tbBarrier) { if (this.selectedBarriers.has(tbBarrier)) this.selectedBarriers.delete(tbBarrier); else this.selectedBarriers.add(tbBarrier); this.render(); return; }
      });
    }

    // Re-bind ephemeral handlers (search input, form submit) on each render
    const searchInput = root.querySelector<HTMLInputElement>('[data-action="search"]');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.concernSearchQuery = searchInput.value;
        this.render();
        // Re-focus search input after re-render
        requestAnimationFrame(() => {
          const newInput = this.shadow.querySelector<HTMLInputElement>('[data-action="search"]');
          if (newInput) {
            newInput.focus();
            newInput.setSelectionRange(newInput.value.length, newInput.value.length);
          }
        });
      });
    }

    // Treatment Builder "Other" text inputs
    const otherPain = root.querySelector<HTMLInputElement>('[data-tb-other="pain"]');
    if (otherPain) {
      otherPain.addEventListener('input', () => { this.tbOtherPainPoint = otherPain.value; });
    }
    const otherOutcome = root.querySelector<HTMLInputElement>('[data-tb-other="outcome"]');
    if (otherOutcome) {
      otherOutcome.addEventListener('input', () => { this.tbOtherOutcome = otherOutcome.value; });
    }

    // Form submission
    const form = root.querySelector<HTMLFormElement>('#tb-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit(form);
      });
    }
  }

  private async handleSubmit(form: HTMLFormElement) {
    if (this.submitting || !this.config) return;

    const fd = new FormData(form);
    const fields = this.config.form_fields;

    // System field_keys that map to top-level payload properties
    const SYSTEM_KEYS = new Set(['first_name', 'last_name', 'email', 'phone']);
    const OPT_IN_KEYS = new Set(['sms_opt_in', 'email_opt_in']);

    // Validate required fields
    for (const field of fields) {
      if (!field.is_required) continue;
      const name = field.field_key || `custom_${field.id}`;
      if (field.field_type === 'checkbox') continue;
      const val = (fd.get(name) as string || '').trim();
      if (!val) {
        this.formError = `Please fill in "${field.label}".`;
        this.render();
        return;
      }
    }

    // Validate email format
    for (const field of fields) {
      if (field.field_type !== 'email') continue;
      const name = field.field_key || `custom_${field.id}`;
      const val = (fd.get(name) as string || '').trim();
      if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        this.formError = 'Please enter a valid email address.';
        this.render();
        return;
      }
    }

    // Build payload from dynamic fields
    const systemValues: Record<string, string> = {};
    const optInValues: Record<string, boolean> = {};
    const customFields: Record<string, unknown> = {};

    for (const field of fields) {
      if (field.field_type === 'location') continue; // handled separately via location_id
      const name = field.field_key || `custom_${field.id}`;

      if (field.field_key && OPT_IN_KEYS.has(field.field_key)) {
        optInValues[field.field_key] = fd.has(name);
      } else if (field.field_key && SYSTEM_KEYS.has(field.field_key)) {
        systemValues[field.field_key] = (fd.get(name) as string || '').trim();
      } else {
        if (field.field_type === 'checkbox') {
          customFields[field.label] = fd.has(name);
        } else {
          const val = (fd.get(name) as string || '').trim();
          if (val) customFields[field.label] = val;
        }
      }
    }

    // Build selected regions
    const selectedRegions: SelectedRegion[] = [];
    const seenSlugs = new Set<string>();
    for (const region of this.genderRegions) {
      if (this.selectedRegionSlugs.has(region.slug) && !seenSlugs.has(region.slug)) {
        seenSlugs.add(region.slug);
        selectedRegions.push({ region_id: region.id, region_name: region.name, region_slug: region.slug });
      }
    }

    // Build selected concerns
    const selectedConcerns: SelectedConcern[] = [];
    for (const region of this.genderRegions) {
      for (const concern of region.concerns) {
        if (this.selectedConcernIds.has(concern.id)) {
          selectedConcerns.push({ concern_id: concern.id, concern_name: concern.name, region_id: region.id, region_name: region.name });
        }
      }
    }

    // Build selected services
    const selectedServices: SelectedService[] = [];
    if (this.config) {
      for (const cat of this.config.service_categories) {
        for (const svc of cat.services) {
          if (this.selectedServiceIds.has(svc.id)) {
            selectedServices.push({ service_id: svc.id, service_name: svc.name, category_name: cat.name });
          }
        }
      }
    }

    // Location from form field overrides the data-attribute
    const formLocationId = (fd.get('location_id') as string || '').trim();

    const payload: Record<string, unknown> = {
      tenant_id: this.tenantId,
      location_id: formLocationId || this.locationId || undefined,
      first_name: systemValues.first_name || '',
      last_name: systemValues.last_name || '',
      email: systemValues.email || '',
      phone: systemValues.phone || undefined,
      gender: this.selectedGender as Gender,
      selected_regions: selectedRegions,
      selected_concerns: selectedConcerns,
      selected_services: selectedServices,
      custom_fields: customFields,
      source_url: window.location.href,
    };

    // Include Treatment Builder data if in that mode
    if (this.isTreatmentBuilder) {
      const painPointLabels = getPainPoints(this.selectedRegionSlugs)
        .filter(p => this.selectedPainPoints.has(p.id))
        .map(p => p.label);
      if (this.tbOtherPainPoint) painPointLabels.push(this.tbOtherPainPoint);

      const outcomeLabels = getOutcomes(this.selectedRegionSlugs)
        .filter(o => this.selectedOutcomes.has(o.id))
        .map(o => o.label);
      if (this.tbOtherOutcome) outcomeLabels.push(this.tbOtherOutcome);

      const barrierLabels = BARRIERS
        .filter(b => this.selectedBarriers.has(b.id))
        .map(b => b.label);

      payload.treatment_builder = {
        pain_points: painPointLabels,
        desired_outcomes: outcomeLabels,
        barriers: barrierLabels,
      };
    }

    if (optInValues.sms_opt_in !== undefined) payload.sms_opt_in = optInValues.sms_opt_in;
    if (optInValues.email_opt_in !== undefined) payload.email_opt_in = optInValues.email_opt_in;

    this.submitting = true;
    this.formError = '';
    this.render();

    try {
      const res = await fetch(`${this.apiBase}/api/widget/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Submission failed (${res.status})`);
      }
      this.view = 'success';
    } catch (err) {
      this.formError = err instanceof Error ? err.message : 'Submission failed. Please try again.';
    } finally {
      this.submitting = false;
      this.render();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — Register Custom Element
// ═══════════════════════════════════════════════════════════════════════════════

if (!customElements.get('treatment-builder')) {
  customElements.define('treatment-builder', TreatmentBuilderWidget);
}
