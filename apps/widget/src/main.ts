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
} from '@treatment-builder/shared';
import widgetStyles from './styles.css?inline';
import { html, raw, SafeHTML } from './template';
import { ICONS } from './icons';
import { renderBodySVG, renderFaceSVG } from './svg-renderer';

type View = 'body' | 'form' | 'success';

class TreatmentBuilderWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private config: WidgetConfigResponse | null = null;
  private apiBase = '';
  private tenantSlug = '';
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
    this.tenantSlug = this.getAttribute('data-tenant') || '';
    if (!this.tenantSlug) {
      this.shadow.innerHTML = '<p style="color:red;padding:1rem">Missing data-tenant attribute</p>';
      return;
    }
    const locationId = this.getAttribute('data-location') || null;
    const flowOverride = this.getAttribute('data-flow') || null;
    this.apiBase = this.getAttribute('data-api') || '';

    this.shadow.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:96px 16px;color:#64748b;font-size:13px">Loading...</div>';

    try {
      let url = `${this.apiBase}/api/widget/config?slug=${encodeURIComponent(this.tenantSlug)}`;
      if (locationId) url += `&location=${encodeURIComponent(locationId)}`;
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

  private get showConcerns(): boolean {
    return this.widgetMode.includes('concerns');
  }

  private get showServices(): boolean {
    return this.widgetMode.includes('services');
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
    if (this.view !== 'body') return 2;
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
    if (this.selectedConcernIds.has(id)) this.selectedConcernIds.delete(id);
    else this.selectedConcernIds.add(id);
    this.render();
  }

  private toggleService(id: string) {
    if (this.selectedServiceIds.has(id)) this.selectedServiceIds.delete(id);
    else this.selectedServiceIds.add(id);
    this.render();
  }

  private toggleRegionExpanded(slug: string) {
    if (this.expandedRegions.has(slug)) this.expandedRegions.delete(slug);
    else this.expandedRegions.add(slug);
    this.render();
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
    this.render();
  }


  // ── Render dispatcher ──

  private render() {
    if (!this.config) return;
    const { branding } = this.config;
    const primary = branding.primary_color || '#e84393';
    const font = branding.font_family || '';
    const cssVars = `:host{--tb-primary:${primary};${font ? `--tb-font:${font};` : ''}}`;
    const style = raw(`<style>${cssVars}${widgetStyles}</style>`);

    let content: SafeHTML;
    if (this.view === 'success') content = this.renderSuccess();
    else if (this.view === 'form') content = this.renderForm();
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

            <div class="tb-diagram-wrap">
              ${this.diagramView === 'body' ? html`
                <div class="tb-side-toggle">
                  <button class="tb-side-btn${this.bodySide === 'front' ? ' active' : ''}" data-side="front">${raw(ICONS.personFront)} Front</button>
                  <button class="tb-side-btn${this.bodySide === 'back' ? ' active' : ''}" data-side="back">${raw(ICONS.personBack)} Back</button>
                </div>
              ` : false}

              ${this.diagramView === 'body'
                ? renderBodySVG(this.selectedGender, this.bodySide, this.selectedRegionSlugs, this.activeRegionSlugs, pc)
                : renderFaceSVG(this.selectedRegionSlugs, this.activeRegionSlugs, pc)}
            </div>

            <div class="tb-gender">
              <button class="tb-gender-btn${this.selectedGender === 'female' ? ' active' : ''}" data-gender="female">Female</button>
              <button class="tb-gender-btn${this.selectedGender === 'male' ? ' active' : ''}" data-gender="male">Male</button>
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

  // ── Panel ──

  private renderPanel(): SafeHTML {
    if (this.selectedRegionSlugs.size === 0) {
      return html`
        <div class="tb-panel-empty">
          <div class="tb-panel-empty-icon">${raw(ICONS.cursor)}</div>
          <p style="font-size:12px;font-weight:500;color:#334155">Select a body area</p>
          <p style="font-size:11px;color:#94a3b8;margin-top:2px">Tap the <strong>+</strong> buttons on the body to see ${this.showConcerns ? 'available concerns' : 'available treatments'}</p>
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
              ? html`<p style="padding:16px 0;text-align:center;font-size:11px;color:#94a3b8">No concerns configured for the selected areas.</p>`
              : false}
            ${hasQuery && !anyVisible
              ? html`<p style="padding:24px 0;text-align:center;font-size:12px;color:#94a3b8">No concerns match &ldquo;${this.concernSearchQuery}&rdquo;</p>`
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
    const isFullWidth = field.field_type === 'textarea' || field.field_type === 'select' || field.field_type === 'radio';
    const wrapStyle = isFullWidth ? ' style="grid-column:1/-1"' : '';

    let fieldEl: SafeHTML;
    if (field.field_type === 'textarea') {
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
      const inputType = field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : 'text';
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
        <span>Powered by Consult Builder</span>
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
        const el = target.closest<HTMLElement>('[data-action], [data-gender], [data-side], [data-concern-id], [data-service-id], [data-toggle-region], [data-remove-region]');
        if (!el) {
          // Check if click was inside an SVG anchor group
          const anchor = target.closest<SVGElement>('.tb-anchor');
          if (anchor) {
            const slugs = anchor.getAttribute('data-anchor-slugs');
            if (slugs) {
              const slugArr = slugs.split(',');
              // Face anchor: drill down to face view
              if (this.diagramView === 'body' && slugArr.some(s => ['upper-face', 'midface', 'lips', 'lower-face'].includes(s))) {
                for (const s of slugArr) this.selectedRegionSlugs.add(s);
                for (const s of slugArr) this.expandedRegions.add(s);
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
        if (action === 'continue') { this.view = 'form'; this.render(); return; }
        if (action === 'back-to-body') { this.view = 'body'; this.formError = ''; this.render(); return; }
        if (action === 'back-to-body-diagram') { this.diagramView = 'body'; this.render(); return; }
        if (action === 'reset' || action === 'reset-footer') { this.reset(); return; }
        if (action === 'clear-search') { this.concernSearchQuery = ''; this.render(); return; }

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

    const payload: Record<string, unknown> = {
      tenant_slug: this.tenantSlug,
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
