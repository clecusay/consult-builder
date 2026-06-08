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
import { html, raw, sanitize, SafeHTML } from './template';
import { ICONS } from './icons';
import { renderBodySVG, renderFaceSVG } from './svg-renderer';
import { getPainPoints, getOutcomes, BARRIERS, type TBOption } from './treatment-builder-data';

type View = 'welcome' | 'body' | 'guided-concerns' | 'form'
  | 'success-thankyou' | 'success-doctor' | 'success-calendar'
  | 'tb-pain-points' | 'tb-outcomes' | 'tb-barriers' | 'tb-bridge' | 'tb-lead-capture';

const DEFAULT_CARD_DESCRIPTIONS: Record<string, string> = {
  'upper-face': 'Forehead, brow, temples',
  'midface': 'Cheeks, eyes, nose',
  'lower-face': 'Jawline, chin, jowls',
  'lips': 'Volume, shape, lines',
  'neck': 'Bands, laxity, contour',
  'abdomen': 'Tuck, lipo, skin tightening',
  'chest': 'Enhancement, lift, reduction',
  'flanks': 'Love handles, contouring',
  'arms': 'Lift, lipo, tightening',
  'hands': 'Volume, veins, skin quality',
  'thighs': 'Inner, outer, lift, lipo',
  'lower-legs': 'Calves, ankles',
  'buttocks': 'BBL, lift, contouring',
  'intimate': 'Labiaplasty, rejuvenation',
  'back': 'Acne, posture, fat reduction',
};

const SLUG_TO_GROUP: Record<string, string> = {
  'upper-face': 'face', 'midface': 'face', 'lower-face': 'face',
  'lips': 'face', 'neck': 'face',
  'abdomen': 'upper_body', 'arms': 'upper_body', 'chest': 'upper_body',
  'flanks': 'upper_body', 'hands': 'upper_body', 'back': 'upper_body',
  'thighs': 'lower_body', 'lower-legs': 'lower_body',
  'buttocks': 'lower_body', 'intimate': 'lower_body',
};

const DISPLAY_GROUP_LABELS: Record<string, string> = {
  'face': 'Face',
  'upper_body': 'Upper Body',
  'lower_body': 'Lower Body',
};

const DISPLAY_GROUP_ORDER = ['face', 'upper_body', 'lower_body'];

function safeOrigin(url: string): string | null {
  try { return new URL(url).origin; } catch { return null; }
}

interface Attribution {
  utm_source: string | undefined;
  utm_medium: string | undefined;
  utm_campaign: string | undefined;
  utm_content: string | undefined;
  utm_term: string | undefined;
  gclid: string | undefined;
  fbclid: string | undefined;
  referrer: string | undefined;
  landing_page: string | undefined;
}

/**
 * Read attribution data captured by the site-wide track.js helper. Returns
 * an empty record if nothing is stored — caller is responsible for falling
 * back to the current URL.
 */
function readStoredAttribution(): Partial<Attribution> {
  try {
    if (typeof sessionStorage === 'undefined') return {};
    const raw = sessionStorage.getItem('tb_attribution');
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const pick = (k: string) =>
      typeof parsed[k] === 'string' && parsed[k] ? (parsed[k] as string) : undefined;
    return {
      utm_source: pick('utm_source'),
      utm_medium: pick('utm_medium'),
      utm_campaign: pick('utm_campaign'),
      utm_content: pick('utm_content'),
      utm_term: pick('utm_term'),
      gclid: pick('gclid'),
      fbclid: pick('fbclid'),
      referrer: pick('referrer'),
      landing_page: pick('landing_page'),
    };
  } catch {
    return {};
  }
}

/**
 * Merge stored (cross-page) attribution with the current page's URL/referrer.
 * Stored values from the visitor's first session page take precedence so a
 * journey like /spring-offer?utm_source=google → /consult → submit still
 * reports the original google source even though the URL has lost the param.
 */
function getAttribution(): Attribution {
  const stored = readStoredAttribution();
  const url = new URLSearchParams(window.location.search);
  const pick = (key: keyof Attribution, fallback?: string) =>
    stored[key] || url.get(key as string) || fallback || undefined;
  return {
    utm_source: pick('utm_source'),
    utm_medium: pick('utm_medium'),
    utm_campaign: pick('utm_campaign'),
    utm_content: pick('utm_content'),
    utm_term: pick('utm_term'),
    gclid: pick('gclid'),
    fbclid: pick('fbclid'),
    referrer: stored.referrer || document.referrer || undefined,
    landing_page: stored.landing_page || window.location.href,
  };
}

/**
 * Categorize where the visitor likely came from into the six values both of
 * GHL's "First/Last Attribution Session Source" dropdowns share:
 *   Paid Search, Social media, Email Marketing, Organic Search, Referral, Direct traffic.
 *
 * Priority: paid click IDs → paid UTM medium → social signals → email signals →
 * organic search referrers → other external referrer → direct.
 */
function computeSessionSource(a: Attribution): string {
  const utmMedium = (a.utm_medium || '').toLowerCase();
  const utmSource = (a.utm_source || '').toLowerCase();
  const SOCIAL_SOURCES = ['facebook', 'fb', 'instagram', 'ig', 'twitter', 'x', 'linkedin', 'tiktok', 'pinterest', 'reddit', 'snapchat', 'youtube'];
  const PAID_MEDIUMS = ['cpc', 'ppc', 'paid', 'paidsearch', 'paid-search'];
  const SOCIAL_MEDIUMS = ['social', 'paid-social', 'paidsocial', 'social-paid'];

  if (a.gclid) return 'Paid Search';
  if (PAID_MEDIUMS.includes(utmMedium)) return 'Paid Search';

  if (a.fbclid) return 'Social media';
  if (SOCIAL_SOURCES.includes(utmSource)) return 'Social media';
  if (SOCIAL_MEDIUMS.includes(utmMedium)) return 'Social media';

  if (utmMedium === 'email' || utmSource === 'email' || utmSource === 'newsletter') return 'Email Marketing';

  if (utmMedium === 'organic' || utmMedium === 'organic-search') return 'Organic Search';

  if (a.referrer) {
    try {
      const host = new URL(a.referrer).hostname.toLowerCase();
      if (/(^|\.)(google|bing|duckduckgo|yahoo|yandex|ecosia|baidu)\.[a-z.]+$/i.test(host)) return 'Organic Search';
      if (/(^|\.)(facebook|instagram|tiktok|linkedin|pinterest|reddit|youtube|twitter|x|snapchat|t)\.[a-z.]+$/i.test(host)) return 'Social media';
      if (host === 'fb.com' || host === 'x.com' || host.endsWith('.fb.com') || host.endsWith('.x.com')) return 'Social media';
      return 'Referral';
    } catch {
      // fall through
    }
  }

  return 'Direct traffic';
}

// Capture the script's own origin at load time — `document.currentScript` is
// only available during the synchronous execution of the loading script. The
// widget uses this as the API base when embedded on a third-party site, so
// practices don't have to remember `data-api`.
const SCRIPT_ORIGIN: string =
  (typeof document !== 'undefined' && document.currentScript instanceof HTMLScriptElement
    ? safeOrigin(document.currentScript.src)
    : null) ?? '';

/** Search synonyms: maps common search terms to concern names they should match. */
const SEARCH_SYNONYMS: Record<string, string[]> = {
  'aging': ['wrinkles', 'fine lines', 'loose skin', 'crow\'s feet', 'frown lines', 'eye bags', 'hooded eyelids', 'sagging breasts', 'jowls'],
  'old age': ['wrinkles', 'fine lines', 'loose skin', 'crow\'s feet', 'frown lines', 'eye bags', 'hooded eyelids'],
  'sagging': ['loose skin', 'sagging breasts', 'jowls', 'hooded eyelids'],
  'sag': ['loose skin', 'sagging breasts', 'jowls', 'hooded eyelids'],
  'droopy': ['loose skin', 'jowls', 'hooded eyelids', 'sagging breasts'],
  'lipo': ['liposuction', 'excess fat', 'contouring'],
  'fat': ['excess fat', 'liposuction', 'contouring', 'double chin'],
  'nose': ['nose reshaping (rhinoplasty)', 'deviated septum correction'],
  'nose job': ['nose reshaping (rhinoplasty)'],
  'rhinoplasty': ['nose reshaping (rhinoplasty)'],
  'septoplasty': ['deviated septum correction'],
  'deviated septum': ['deviated septum correction'],
  'chin': ['chin implant', 'double chin', 'jowls'],
  'tummy': ['tummy tuck', 'abdomen', 'liposuction', 'c-section scar'],
  'breast': ['breast enhancement', 'breast reduction', 'breast asymmetry', 'sagging breasts', 'implant exchange', 'breast removal / top surgery', 'enlarged areolas'],
  'gynecomastia': ['enlarged male breasts'],
  'implant': ['implant exchange', 'breast enhancement', 'chin implant'],
  'scar': ['acne scarring', 'c-section scar', 'raised scars', 'stretch marks'],
  'keloid': ['raised scars'],
  'eyes': ['eye bags', 'puffy eyes', 'hooded eyelids', 'crow\'s feet'],
  'eyelid': ['hooded eyelids'],
  'botox': ['wrinkles', 'frown lines', 'crow\'s feet', 'fine lines'],
  'filler': ['loss of facial volume', 'smile lines', 'thin lips', 'lip enhancement'],
  'lift': ['breast enhancement', 'tummy tuck', 'sagging breasts'],
  'skin': ['loose skin', 'uneven skin texture', 'dry skin', 'hyperpigmentation'],
  'discoloration': ['hyperpigmentation'],
  'redness': ['hyperpigmentation', 'broken blood vessels'],
  'rosacea': ['hyperpigmentation'],
  'melasma': ['hyperpigmentation'],
  'platysmal bands': ['neck bands'],
  'waist': ['waist shaping', 'flanks', 'contouring'],
  'rib': ['rib contouring'],
  'vein': ['veins', 'broken blood vessels'],
  'tattoo': ['hyperpigmentation'],
};

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
  private view: View = 'welcome';
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
  private mobileSheetOpen = false;
  private submitting = false;
  private formError = '';
  private lockedHeight: number | null = null;

  private onEmbedMessage = (event: MessageEvent) => {
    // Fired by either (a) a "Thank You" HTML snippet rendered inside the
    // form iframe after submission, or (b) our /widget/embed-submitted
    // bridge page if the provider redirects to it.
    if (event.data !== 'tb:embed-submitted') return;
    if (this.view !== 'form') return;

    // Trust messages from our backend (bridge page) OR from the configured
    // third-party form's origin (tenant set it; admin-trusted).
    const ourOrigin = this.apiBase
      ? new URL(this.apiBase).origin
      : window.location.origin;
    const formOrigin = this.config?.embed_form_url
      ? safeOrigin(this.config.embed_form_url)
      : null;
    if (event.origin !== ourOrigin && event.origin !== formOrigin) return;

    const next = this.enabledSuccessViews[0];
    if (next) {
      this.view = next;
      this.render();
    }
  };

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'closed' });
  }

  private onResize = () => this.capAnchorLabels();

  disconnectedCallback() {
    window.removeEventListener('message', this.onEmbedMessage);
    window.removeEventListener('resize', this.onResize);
  }

  private ensureFonts() {
    const id = 'tb-fonts-fraunces-manrope';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=Manrope:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }

  async connectedCallback() {
    this.ensureFonts();
    window.addEventListener('resize', this.onResize);
    this.tenantId = this.getAttribute('data-tenant-id') || '';
    if (!this.tenantId) {
      this.shadow.innerHTML = '<p style="color:red;padding:1rem">Missing data-tenant-id attribute</p>';
      return;
    }
    this.locationId = this.getAttribute('data-location') || null;
    const flowOverride = this.getAttribute('data-flow') || null;
    const layoutOverride = this.getAttribute('data-layout') || null;
    const regionStyleOverride = this.getAttribute('data-region-style') || null;
    this.layoutOverride = layoutOverride as 'split' | 'guided' | null;
    this.fullpage = this.hasAttribute('data-fullpage');
    // Resolution order: explicit data-api attribute → script's own origin →
    // same-origin (last only works when widget is hosted on our own domain).
    this.apiBase = this.getAttribute('data-api') || SCRIPT_ORIGIN || '';

    this.shadow.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:96px 16px;color:#7a746a;font-size:13px">Loading...</div>';

    try {
      let url = `${this.apiBase}/api/widget/config?tenant_id=${encodeURIComponent(this.tenantId)}`;
      if (this.locationId) url += `&location=${encodeURIComponent(this.locationId)}`;
      if (flowOverride) url += `&flow=${encodeURIComponent(flowOverride)}`;
      if (layoutOverride) url += `&layout=${encodeURIComponent(layoutOverride)}`;
      if (regionStyleOverride) url += `&region_style=${encodeURIComponent(regionStyleOverride)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Config error: ${res.status}`);
      this.config = await res.json();

      // Auto-detect: if all regions are face-only, start in face view
      if (this.config && this.config.regions.length > 0 &&
          this.config.regions.every(r => r.body_area === 'face')) {
        this.diagramView = 'face';
      }

      // Listen for the third-party form's "submitted" signal.
      if (this.config?.form_provider === 'embed') {
        window.addEventListener('message', this.onEmbedMessage);
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
      .sort((a, b) => {
        // Face regions first, then body
        if (a.body_area !== b.body_area) return a.body_area === 'face' ? -1 : 1;
        return (a.display_order ?? 0) - (b.display_order ?? 0);
      });
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
    if (this.view === 'welcome') return 0;
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
    // On mobile the panel is a bottom sheet; pop it open as soon as the
    // patient has at least one area selected, collapse it when none remain.
    this.mobileSheetOpen = this.selectedRegionSlugs.size > 0;
    this.render();
  }

  private removeRegion(slug: string) {
    this.selectedRegionSlugs.delete(slug);
    this.expandedRegions.delete(slug);
    const region = this.genderRegions.find(r => r.slug === slug);
    if (region) {
      region.concerns.forEach(c => this.selectedConcernIds.delete(c.id));
    }
    if (this.selectedRegionSlugs.size === 0) this.mobileSheetOpen = false;
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
    // Keep the summary bar and the mobile sheet peek header counts in sync
    // (these also change on a targeted toggle, not just a full render).
    const areas = this.selectedRegionSlugs.size;
    const summaryText = `${areas} area${areas !== 1 ? 's' : ''} · ${total} concern${total !== 1 ? 's' : ''} selected`;
    const summaryEl = this.shadow.querySelector<HTMLElement>('.tb-summary-text');
    if (summaryEl) summaryEl.textContent = summaryText;
    const handleEl = this.shadow.querySelector<HTMLElement>('.tb-sheet-handle-text');
    if (handleEl) handleEl.textContent = areas > 0 ? summaryText : 'Select a body area';
  }

  private setGender(g: 'female' | 'male') {
    if (g === this.selectedGender) return;
    this.selectedGender = g;
    this.diagramView = this.isFaceOnly ? 'face' : 'body';
    this.bodySide = 'front';
    this.selectedRegionSlugs.clear();
    this.selectedConcernIds.clear();
    this.expandedRegions.clear();
    this.concernSearchQuery = '';
    this.mobileSheetOpen = false;
    this.render();
  }

  private reset() {
    this.view = 'welcome';
    const allFace = this.config && this.config.regions.length > 0 &&
      this.config.regions.every(r => r.body_area === 'face');
    this.diagramView = allFace ? 'face' : 'body';
    this.bodySide = 'front';
    this.selectedGender = 'female';
    this.selectedRegionSlugs.clear();
    this.selectedConcernIds.clear();
    this.selectedServiceIds.clear();
    this.expandedRegions.clear();
    this.concernSearchQuery = '';
    this.mobileSheetOpen = false;
    this.formError = '';
    this.selectedPainPoints.clear();
    this.selectedOutcomes.clear();
    this.selectedBarriers.clear();
    this.tbOtherPainPoint = '';
    this.tbOtherOutcome = '';
    this.lockedHeight = null;
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
    if (this.view === 'welcome') content = html`${this.renderBodyView()}${this.renderWelcomeModal()}`;
    else if (this.view === 'success-thankyou') content = this.renderSuccessThankYou();
    else if (this.view === 'success-doctor') content = this.renderSuccessDoctor();
    else if (this.view === 'success-calendar') content = this.renderSuccessCalendar();
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

    // Labels live in scaled SVG space; pin their rendered size to a 20px cap.
    requestAnimationFrame(() => this.capAnchorLabels());

    // Lock height after first render to prevent layout shifts
    if (this.lockedHeight === null) {
      requestAnimationFrame(() => {
        const root = this.shadow.querySelector('.tb-root') as HTMLElement;
        if (root) {
          this.lockedHeight = root.offsetHeight;
          root.style.minHeight = `${this.lockedHeight}px`;
        }
      });
    } else {
      const root = this.shadow.querySelector('.tb-root') as HTMLElement;
      if (root) root.style.minHeight = `${this.lockedHeight}px`;
    }
  }

  // Anchor labels are <text> in SVG user units, so their on-screen size scales
  // with the diagram. Cap the rendered size at 20px (smaller diagrams keep their
  // natural, smaller size). Recomputed on every render and on resize.
  private static readonly MAX_LABEL_PX = 20;

  private capAnchorLabels() {
    const svgs = this.shadow.querySelectorAll<SVGSVGElement>('.tb-diagram-wrap svg');
    svgs.forEach(svg => {
      const ctm = svg.getScreenCTM();
      const scale = ctm ? ctm.a : 0;
      if (!scale) return;
      const maxUnits = TreatmentBuilderWidget.MAX_LABEL_PX / scale;
      svg.querySelectorAll<SVGTextElement>('.tb-anchor-label').forEach(t => {
        const base = parseFloat(t.getAttribute('data-base-fs') || '0');
        if (!base) return;
        t.setAttribute('font-size', String(Math.min(base, maxUnits)));
      });
    });
  }

  // ── Step Indicator ──

  private renderStepIndicator(): SafeHTML {
    const steps = ['Select Areas', 'Your Concerns', 'Your Info'];
    const romans = ['i', 'ii', 'iii'];
    return html`
      <div class="tb-steps">
        ${steps.map((label, i) => {
          const isActive = i === this.currentStep;
          const isCompleted = i < this.currentStep;
          const dotClass = `tb-step-dot ${isActive ? 'active' : isCompleted ? 'completed' : 'pending'}`;
          return html`
            ${i > 0 ? html`<div class="tb-step-line${i <= this.currentStep ? ' filled' : ''}"></div>` : false}
            <div class="tb-step">
              <div class="${dotClass}">
                ${isCompleted
                  ? raw('<svg viewBox="0 0 24 24" fill="none" stroke="#f6f1e8" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>')
                  : html`<span class="tb-step-num">${romans[i]}</span>`}
              </div>
              <span class="tb-step-label${isActive ? ' active' : ''}">${label}</span>
            </div>
          `;
        })}
      </div>
    `;
  }

  // ── Body Diagram View ──

  // ── Welcome / Intro Popup ──

  private renderWelcomeModal(): SafeHTML {
    const cfg = this.config!;
    const practice = cfg.tenant.name;
    const steps = [
      'Select your area of focus.',
      'Choose the concerns that interest you.',
      'Submit to learn about your options.',
    ];

    return html`
      <div class="tb-welcome-overlay">
        <div class="tb-welcome-modal" role="dialog" aria-modal="true">
          ${cfg.tenant.logo_url ? html`<img class="tb-welcome-logo" src="${cfg.tenant.logo_url}" alt="${practice}">` : false}
          <h2 class="tb-welcome-title">Take the first step in your virtual consultation</h2>
          <p class="tb-welcome-sub">Learn about your options in three simple steps.</p>
          <ol class="tb-welcome-steps">
            ${steps.map((t, i) => html`
              <li class="tb-welcome-step">
                <span class="tb-welcome-step-num">${String(i + 1).padStart(2, '0')}</span>
                <span class="tb-welcome-step-text">${t}</span>
              </li>`)}
          </ol>
          <button class="tb-welcome-cta" data-action="start">Get started ${raw(ICONS.chevronRight)}</button>
        </div>
      </div>
    `;
  }

  private renderBodyView(): SafeHTML {
    if (this.useCards) return this.renderCardBody();
    if (this.isGuided) return this.renderGuidedBody();
    return this.renderSplitBody();
  }

  // ── Card-based Region Selector ──

  private renderCardBody(): SafeHTML {
    const cfg = this.config!;

    // Deduplicate regions by slug
    const seen = new Set<string>();
    const uniqueRegions: WidgetRegion[] = [];
    for (const r of this.genderRegions) {
      if (!seen.has(r.slug)) {
        seen.add(r.slug);
        uniqueRegions.push(r);
      }
    }

    // Group by display_group
    const groups = new Map<string, WidgetRegion[]>();
    for (const r of uniqueRegions) {
      const group = (r as unknown as Record<string, unknown>).display_group as string || SLUG_TO_GROUP[r.slug] || 'upper_body';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(r);
    }

    return html`
      <div class="tb-root">
        <div class="tb-header">
          ${cfg.tenant.logo_url ? html`<img src="${cfg.tenant.logo_url}" alt="${cfg.tenant.name}">` : false}
          <h2>${cfg.branding.cta_text || 'Build Your Consultation Plan'}</h2>
          <p>Tell us your areas of interest and we'll help you build a personalized consultation plan. After you submit, our team will reach out to schedule your appointment.</p>
        </div>

        ${this.renderStepIndicator()}

        <div class="tb-guided-body" style="position:relative;max-height:none;overflow-y:auto">
          <button class="tb-continue-btn tb-continue-corner${this.selectedRegionSlugs.size === 0 ? ' disabled' : ''}" data-action="guided-to-concerns" ${this.selectedRegionSlugs.size === 0 ? raw('disabled') : false}>
            Continue ${raw(ICONS.chevronRight)}
          </button>

          <div class="tb-gender-switch" style="position:static;margin-bottom:8px">
            <button class="tb-gender-switch-btn" data-gender="${this.selectedGender === 'female' ? 'male' : 'female'}">Switch to ${this.selectedGender === 'female' ? 'Male' : 'Female'}</button>
          </div>

          ${DISPLAY_GROUP_ORDER.filter(g => groups.has(g)).map(groupKey => {
            const regions = groups.get(groupKey)!;
            const label = DISPLAY_GROUP_LABELS[groupKey] || groupKey;
            return html`
              <div class="tb-card-section-label">${label}</div>
              <div class="tb-card-grid">
                ${regions.map(region => {
                  const isSelected = this.selectedRegionSlugs.has(region.slug);
                  const descriptor = (region as unknown as Record<string, unknown>).card_description as string || DEFAULT_CARD_DESCRIPTIONS[region.slug] || '';
                  return html`
                    <button
                      class="tb-region-card${isSelected ? ' selected' : ''}"
                      data-region-slug="${region.slug}"
                    >
                      <div class="tb-region-card-name">${region.name}</div>
                      ${descriptor ? html`<div class="tb-region-card-sub">${descriptor}</div>` : false}
                      ${isSelected ? html`<div class="tb-region-card-check">${raw(ICONS.check)}</div>` : false}
                    </button>
                  `;
                })}
              </div>
            `;
          })}
        </div>

        ${this.renderFooter()}
      </div>
    `;
  }

  /** Top bar for the body diagram: a front/back toggle on the left and the
      current orientation label on the right. Frees the full width for the body. */
  private renderOrientationBar(): SafeHTML {
    const isFront = this.bodySide === 'front';
    const targetSide = isFront ? 'back' : 'front';
    const toggleLabel = isFront ? 'View back' : 'View front';
    const orientation = isFront ? 'Anterior' : 'Posterior';
    return html`
      <div class="tb-orient-bar">
        <button class="tb-orient-toggle" data-side="${targetSide}" title="${toggleLabel}">
          ${raw(ICONS.rotateCcw)} ${toggleLabel}
        </button>
        <span class="tb-orient-label">${orientation}</span>
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
          <p>Tell us your areas of interest and we'll help you build a personalized consultation plan. After you submit, our team will reach out to schedule your appointment.</p>
        </div>

        ${this.renderStepIndicator()}

        <div class="tb-split">
          <div class="tb-diagram-col">
            ${this.diagramView === 'face' && !this.isFaceOnly
              ? html`<button class="tb-back-to-body" data-action="back-to-body-diagram">${raw(ICONS.chevronLeft.replace('viewBox', 'width="14" height="14" viewBox'))} Back to Body</button>`
              : this.diagramView === 'body' ? this.renderOrientationBar() : false}

            <div class="tb-diagram-row">
              <div class="tb-diagram-wrap${this.isFaceOnly ? ' tb-face-only' : ''}">
                ${this.diagramView === 'body'
                  ? renderBodySVG(this.selectedGender, this.bodySide, this.selectedRegionSlugs, this.activeRegionSlugs, pc)
                  : renderFaceSVG(this.selectedGender, this.selectedRegionSlugs, this.activeRegionSlugs, pc)}
              </div>
            </div>

            <div class="tb-gender-switch">
              <button class="tb-gender-switch-btn" data-gender="${this.selectedGender === 'female' ? 'male' : 'female'}">Switch to ${this.selectedGender === 'female' ? 'Male' : 'Female'}</button>
            </div>
          </div>

          <div class="tb-sheet-scrim${this.mobileSheetOpen ? ' open' : ''}" data-action="close-sheet"></div>

          <div class="tb-panel-col${this.mobileSheetOpen ? ' open' : ''}">
            <button class="tb-sheet-handle" data-action="toggle-sheet" aria-label="Toggle concerns panel">
              <span class="tb-sheet-grabber"></span>
              <span class="tb-sheet-handle-row">
                <span class="tb-sheet-handle-text">
                  ${this.selectedRegionSlugs.size > 0
                    ? html`${this.selectedRegionSlugs.size} area${this.selectedRegionSlugs.size !== 1 ? 's' : ''} &middot; ${this.totalSelections} concern${this.totalSelections !== 1 ? 's' : ''} selected`
                    : 'Select a body area'}
                </span>
                <span class="tb-sheet-chevron">${raw(ICONS.chevronDown)}</span>
              </span>
            </button>
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
          <p>Tell us your areas of interest and we'll help you build a personalized consultation plan. After you submit, our team will reach out to schedule your appointment.</p>
        </div>

        ${this.renderStepIndicator()}

        <div class="tb-guided-body">
          <button class="tb-continue-btn tb-continue-corner${this.selectedRegionSlugs.size === 0 ? ' disabled' : ''}" data-action="guided-to-concerns" ${this.selectedRegionSlugs.size === 0 ? raw('disabled') : false}>
            Continue ${raw(ICONS.chevronRight)}
          </button>
          ${this.diagramView === 'face' && !this.isFaceOnly
            ? html`<button class="tb-back-to-body" data-action="back-to-body-diagram">${raw(ICONS.chevronLeft.replace('viewBox', 'width="14" height="14" viewBox'))} Back to Body</button>`
            : this.diagramView === 'body' ? this.renderOrientationBar() : false}

          <div class="tb-diagram-row">
            <div class="tb-guided-diagram${this.isFaceOnly ? ' tb-face-only' : ''}">
              ${this.diagramView === 'body'
                ? renderBodySVG(this.selectedGender, this.bodySide, this.selectedRegionSlugs, this.activeRegionSlugs, pc)
                : renderFaceSVG(this.selectedGender, this.selectedRegionSlugs, this.activeRegionSlugs, pc)}
            </div>
          </div>

          <div class="tb-gender-switch">
            <button class="tb-gender-switch-btn" data-gender="${this.selectedGender === 'female' ? 'male' : 'female'}">Switch to ${this.selectedGender === 'female' ? 'Male' : 'Female'}</button>
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

    return html`
      <div class="tb-panel-content">
        ${this.showConcerns ? (() => {
          const query = this.concernSearchQuery.trim().toLowerCase();
          const hasQuery = query.length > 0;
          const synonymMatches = hasQuery
            ? new Set(Object.entries(SEARCH_SYNONYMS)
                .filter(([key]) => key.includes(query) || query.includes(key))
                .flatMap(([, names]) => names.map(n => n.toLowerCase())))
            : new Set<string>();
          const matchesConcern = (name: string) => {
            const lower = name.toLowerCase();
            return lower.includes(query) || synonymMatches.has(lower);
          };
          let anyVisible = false;
          const groups = this.concernsByRegion.map(group => {
            const isExpanded = this.expandedRegions.has(group.regionSlug);
            const count = this.getRegionConcernCount(group.regionSlug);
            const popularIds = this.getPopularIds(group.concerns);
            const filtered = hasQuery
              ? group.concerns.filter(c => matchesConcern(c.name))
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
              ? html`<p style="padding:16px 0;text-align:center;font-size:13px;color:#a89f90">No concerns configured for the selected areas.</p>`
              : false}
            ${hasQuery && !anyVisible
              ? html`<p style="padding:24px 0;text-align:center;font-size:13px;color:#a89f90">No concerns match &ldquo;${this.concernSearchQuery}&rdquo;</p>`
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

    return html`
      <div class="tb-root">
        <div class="tb-header">
          ${cfg.tenant.logo_url ? html`<img src="${cfg.tenant.logo_url}" alt="${cfg.tenant.name}">` : false}
          <h2>What are your concerns?</h2>
          <p>Select the concerns you'd like to address</p>
        </div>

        ${this.renderStepIndicator()}

        <div class="tb-guided-concerns">
          <div class="tb-guided-list">
            ${this.showConcerns ? (() => {
              const query = this.concernSearchQuery.trim().toLowerCase();
              const hasQuery = query.length > 0;
              const synonymMatches = hasQuery
                ? new Set(Object.entries(SEARCH_SYNONYMS)
                    .filter(([key]) => key.includes(query) || query.includes(key))
                    .flatMap(([, names]) => names.map(n => n.toLowerCase())))
                : new Set<string>();
              const matchesConcern = (name: string) => {
                const lower = name.toLowerCase();
                return lower.includes(query) || synonymMatches.has(lower);
              };
              let anyVisible = false;
              const groups = this.concernsByRegion.map(group => {
                const isExpanded = this.expandedRegions.has(group.regionSlug);
                const count = this.getRegionConcernCount(group.regionSlug);
                const popularIds = this.getPopularIds(group.concerns);
                const filtered = hasQuery
                  ? group.concerns.filter(c => matchesConcern(c.name))
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
                  ? html`<p style="padding:16px 0;text-align:center;font-size:13px;color:#a89f90">No concerns configured for the selected areas.</p>`
                  : false}
                ${hasQuery && !anyVisible
                  ? html`<p style="padding:24px 0;text-align:center;font-size:13px;color:#a89f90">No concerns match &ldquo;${this.concernSearchQuery}&rdquo;</p>`
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
            ${i > 0 ? html`<div class="tb-step-line" style="background:${i <= currentStep ? pc : '#e9e0d2'}"></div>` : false}
            <div class="tb-step">
              <div class="${dotClass}">
                ${isCompleted
                  ? raw('<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>')
                  : html`<span class="tb-step-num" style="color:${isActive ? '#fff' : '#a89f90'}">${i + 1}</span>`}
              </div>
              <span class="tb-step-label" style="color:${isActive ? pc : '#a89f90'}">${label}</span>
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
              ${optInFields.map(f => html`
                <label class="tb-optin-label">
                  <input type="checkbox" name="${f.field_key || 'communication_opt_in'}"/>
                  <span>${f.placeholder || f.label || "I'd like to receive updates, promotions, and appointment reminders via email and SMS. Unsubscribe anytime."}</span>
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

    // Third-party embedded form (HIPAA: submissions go directly to provider).
    if (cfg.form_provider === 'embed' && cfg.embed_form_url) {
      return this.renderEmbedForm();
    }

    // Partition fields: opt-in checkboxes vs regular fields
    const isOptIn = (f: WidgetFormField) => f.field_key?.endsWith('_opt_in');
    const contactFields = cfg.form_fields.filter(f => !isOptIn(f));
    const optInFields = cfg.form_fields.filter(f => isOptIn(f));

    return html`
      <div class="tb-root">
        <div class="tb-header">
          <h2>Complete Your Consultation Request</h2>
          <p>Fill in your details below. We'll reach out to book your consultation and provide personalized results based on your concerns.</p>
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
              ${optInFields.map(f => html`
                <label class="tb-optin-label">
                  <input type="checkbox" name="${f.field_key || 'communication_opt_in'}"/>
                  <span>${f.placeholder || f.label || "I'd like to receive updates, promotions, and appointment reminders via email and SMS. Unsubscribe anytime."}</span>
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

  /**
   * Append tracking params (utm_*, gclid, fbclid, referrer) from the host page's
   * URL onto the embed form URL so the third-party form (GHL, etc.) can record
   * the lead source on its end. Provider-agnostic — any form that reads query
   * strings will pick these up.
   */
  private buildEmbedFormSrc(baseUrl: string): string {
    try {
      const url = new URL(baseUrl);
      const parent = new URLSearchParams(window.location.search);
      const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
      for (const key of keys) {
        const v = parent.get(key);
        if (v && !url.searchParams.has(key)) url.searchParams.set(key, v);
      }
      if (document.referrer && !url.searchParams.has('referrer')) {
        url.searchParams.set('referrer', document.referrer);
      }
      return url.toString();
    } catch {
      return baseUrl;
    }
  }

  private renderEmbedForm(): SafeHTML {
    const cfg = this.config!;
    const url = this.buildEmbedFormSrc(cfg.embed_form_url || '');
    const height = cfg.embed_form_height || 600;
    return html`
      <div class="tb-root">
        <div class="tb-header">
          <h2>Complete Your Consultation Request</h2>
          <p>Fill in your details below. We'll reach out to book your consultation.</p>
        </div>

        ${this.renderStepIndicator()}

        <div class="tb-embed-body">
          <iframe
            src="${url}"
            style="width:100%;height:${height}px;border:0;display:block;background:#fff;border-radius:8px"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
            referrerpolicy="no-referrer-when-downgrade"
            loading="lazy"
            title="Consultation form"
          ></iframe>

          <div class="tb-nav">
            <button type="button" class="tb-back-btn" data-action="back-to-body">${raw(ICONS.chevronLeft)} Back</button>
            <button type="button" class="tb-back-btn" data-action="embed-continue" style="margin-left:auto">Already submitted? Continue →</button>
          </div>
        </div>

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
          ${locs.map(loc => {
            const label = loc.city ? `${loc.city}${loc.state ? `, ${loc.state}` : ''}` : loc.name;
            return html`<option value="${loc.id}"${this.locationId === loc.id ? raw(' selected') : false}>${label}</option>`;
          })}
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

  // ── Success Flow Views (3-page post-submission) ──

  /** Split text on double-newlines into separate <p> tags. */
  private renderParagraphs(text: string): SafeHTML[] {
    return text.split(/\n\s*\n/).filter(Boolean).map(p => html`<p>${p.trim()}</p>`);
  }

  /** Get the ordered list of enabled success flow views. */
  private get enabledSuccessViews(): View[] {
    const flow = this.config?.branding.success_flow;
    if (!flow) return ['success-thankyou', 'success-doctor', 'success-calendar'];
    const views: View[] = [];
    if (flow.thank_you.enabled) views.push('success-thankyou');
    if (flow.doctor_profile.enabled) views.push('success-doctor');
    if (flow.calendar.enabled) views.push('success-calendar');
    // If everything is disabled, show at least the thank you page
    if (views.length === 0) views.push('success-thankyou');
    return views;
  }

  /** Get the first enabled success view (for after form submit). */
  private get firstSuccessView(): View {
    return this.enabledSuccessViews[0];
  }

  /** Get the next enabled success view, or null if this is the last. */
  private nextSuccessView(current: View): View | null {
    const views = this.enabledSuccessViews;
    const idx = views.indexOf(current);
    return idx >= 0 && idx < views.length - 1 ? views[idx + 1] : null;
  }

  private renderSuccessStepDots(activeStep: View): SafeHTML {
    const pc = this.primaryColor;
    const views = this.enabledSuccessViews;
    const activeIdx = views.indexOf(activeStep);
    return html`
      <div class="tb-success-dots">
        ${views.map((_, i) => html`
          <div class="tb-success-dot ${i === activeIdx ? 'active' : ''}"
               style="background:${i === activeIdx ? pc : '#d8cebd'}"></div>
        `)}
      </div>
    `;
  }

  /** Render the continue/reset button for a success flow page. */
  private renderSuccessNav(currentView: View): SafeHTML {
    const pc = this.primaryColor;
    const next = this.nextSuccessView(currentView);
    const websiteUrl = this.config?.tenant.website_url;
    const safeWebsiteUrl = websiteUrl && /^https?:\/\//i.test(websiteUrl) ? websiteUrl : '';
    return html`
      <div class="tb-success-flow-footer">
        ${this.renderSuccessStepDots(currentView)}
        ${next ? html`
          <button class="tb-success-flow-continue" style="background:${pc}" data-action="success-next">
            Continue ${raw(ICONS.chevronRight)}
          </button>
        ` : safeWebsiteUrl ? html`
          <a class="tb-success-flow-continue" href="${safeWebsiteUrl}" rel="noopener noreferrer" style="background:${pc};text-decoration:none;display:inline-flex">
            Go to main website ${raw(ICONS.chevronRight)}
          </a>
        ` : false}
      </div>
    `;
  }

  private renderSuccessThankYou(): SafeHTML {
    const cfg = this.config!;
    const flow = cfg.branding.success_flow;
    const logoUrl = cfg.tenant.logo_url;

    return html`
      <div class="tb-root">
        <div class="tb-success-flow">
          ${logoUrl ? html`<img class="tb-success-flow-logo" src="${logoUrl}" alt="${cfg.tenant.name}">` : false}
          <div class="tb-success-flow-icon">${raw(ICONS.check)}</div>
          <h2>${flow.thank_you.heading}</h2>
          <div class="tb-success-flow-body">${sanitize(flow.thank_you.body)}</div>
          ${this.renderSuccessNav('success-thankyou')}
        </div>
        ${this.renderFooter()}
      </div>
    `;
  }

  private renderSuccessDoctor(): SafeHTML {
    const cfg = this.config!;
    const flow = cfg.branding.success_flow;
    const logoUrl = cfg.tenant.logo_url;

    return html`
      <div class="tb-root">
        <div class="tb-success-flow">
          ${logoUrl ? html`<img class="tb-success-flow-logo" src="${logoUrl}" alt="${cfg.tenant.name}">` : false}
          <h2>${flow.doctor_profile.heading}</h2>
          <div class="tb-success-flow-body">${sanitize(flow.doctor_profile.body)}</div>
          ${this.renderSuccessNav('success-doctor')}
        </div>
        ${this.renderFooter()}
      </div>
    `;
  }

  private renderSuccessCalendar(): SafeHTML {
    const cfg = this.config!;
    const flow = cfg.branding.success_flow;
    const pc = this.primaryColor;
    const calUrl = flow.calendar.calendar_url;
    const embedType = flow.calendar.calendar_embed_type;
    const safeCalUrl = calUrl && /^https:\/\//i.test(calUrl) ? calUrl : '';

    return html`
      <div class="tb-root">
        <div class="tb-success-flow">
          <h2>${flow.calendar.heading}</h2>

          ${safeCalUrl && embedType === 'iframe' ? html`
            <div class="tb-success-embed">
              <iframe src="${safeCalUrl}" frameborder="0" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" style="width:100%;min-height:400px;border:none;border-radius:8px"></iframe>
            </div>
          ` : false}

          ${safeCalUrl && embedType === 'button' ? html`
            <a class="tb-success-flow-continue" href="${safeCalUrl}" target="_blank" rel="noopener noreferrer" style="background:${pc};text-decoration:none;display:inline-flex">
              Schedule Now ${raw(ICONS.chevronRight)}
            </a>
          ` : false}

          ${this.renderSuccessNav('success-calendar')}
        </div>
        ${this.renderFooter()}
      </div>
    `;
  }

  // ── Footer ──

  private renderFooter(): SafeHTML {
    const websiteUrl = this.config?.tenant.website_url;
    return html`
      <div class="tb-footer">
        ${websiteUrl ? html`<a class="tb-exit-btn" href="${websiteUrl}" rel="noopener noreferrer">Return to website</a>` : html`<span></span>`}
        ${this.fullpage ? html`<span class="tb-footer-powered">Powered by Consult Intake</span>` : false}
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
        if (action === 'start') { this.view = 'body'; this.lockedHeight = null; this.render(); return; }
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
        if (action === 'success-next') {
          const next = this.nextSuccessView(this.view);
          if (next) { this.view = next; this.render(); }
          return;
        }
        if (action === 'embed-continue') {
          // Fallback: user clicks "Already submitted? Continue" if the iframe
          // didn't auto-redirect (provider misconfigured, etc).
          const next = this.enabledSuccessViews[0];
          if (next) { this.view = next; this.render(); }
          return;
        }
        if (action === 'reset' || action === 'reset-footer') { this.reset(); return; }
        if (action === 'clear-search') { this.concernSearchQuery = ''; this.render(); return; }

        // Mobile bottom sheet open/close — toggle classes directly so the
        // slide transition animates (a full re-render would recreate the node
        // already in its target state, skipping the transition).
        if (action === 'toggle-sheet' || action === 'close-sheet') {
          this.mobileSheetOpen = action === 'toggle-sheet' ? !this.mobileSheetOpen : false;
          const panel = root.querySelector<HTMLElement>('.tb-panel-col');
          const scrim = root.querySelector<HTMLElement>('.tb-sheet-scrim');
          panel?.classList.toggle('open', this.mobileSheetOpen);
          scrim?.classList.toggle('open', this.mobileSheetOpen);
          return;
        }

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
    const SYSTEM_KEYS = new Set(['first_name', 'last_name', 'email', 'phone', 'date_of_birth']);
    const OPT_IN_KEYS = new Set(['sms_opt_in', 'email_opt_in', 'communication_opt_in']);

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

    // Attribution: merges site-wide track.js stored data (first-touch within
    // this session) with the current page's URL, so multi-page journeys still
    // report the original UTMs.
    const attribution = getAttribution();
    const utmSource = attribution.utm_source;
    const utmMedium = attribution.utm_medium;
    const utmCampaign = attribution.utm_campaign;
    const utmContent = attribution.utm_content;
    const utmTerm = attribution.utm_term;
    const gclid = attribution.gclid;
    const fbclid = attribution.fbclid;
    const referrer = attribution.referrer;
    const landingPage = attribution.landing_page;
    const sessionSource = computeSessionSource(attribution);

    const payload: Record<string, unknown> = {
      tenant_id: this.tenantId,
      location_id: formLocationId || this.locationId || undefined,
      first_name: systemValues.first_name || '',
      last_name: systemValues.last_name || '',
      email: systemValues.email || '',
      phone: systemValues.phone || undefined,
      date_of_birth: systemValues.date_of_birth || undefined,
      gender: this.selectedGender as Gender,
      selected_regions: selectedRegions,
      selected_concerns: selectedConcerns,
      selected_services: selectedServices,
      custom_fields: customFields,
      source_url: window.location.href,
      landing_page: landingPage,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      utm_term: utmTerm,
      gclid,
      fbclid,
      referrer,
      session_source: sessionSource,
      sms_opt_in: optInValues.communication_opt_in || optInValues.sms_opt_in || false,
      email_opt_in: optInValues.communication_opt_in || optInValues.email_opt_in || false,
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
      // All submissions go through our backend, which forwards to the
      // tenant's webhook and/or stores the lead based on their config.
      const res = await fetch(`${this.apiBase}/api/widget/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Submission failed (${res.status})`);
      }
      // Notify the host page (GTM / analytics) of a successful submission.
      // Only non-PHI metadata is pushed to the page dataLayer — no contact
      // details or health concern data leave the widget here.
      try {
        const submittedUuid = formLocationId || this.locationId || undefined;
        const submittedLocation = submittedUuid
          ? this.config.locations.find(l => l.id === submittedUuid)
          : undefined;
        const w = window as unknown as { dataLayer?: Array<Record<string, unknown>> };
        w.dataLayer = w.dataLayer || [];
        w.dataLayer.push({
          event: 'consultBuilder.formSubmission',
          tenant_id: this.config.tenant.id,
          tenant_slug: this.config.tenant.slug,
          location_id: submittedLocation?.slug || submittedUuid || undefined,
        });
      } catch {
        // dataLayer is optional; never let analytics break the success flow.
      }

      // Lock the height so the success flow doesn't collapse
      const root = this.shadow.querySelector('.tb-root') as HTMLElement | null;
      if (root) {
        this.lockedHeight = root.offsetHeight;
      }
      this.view = this.firstSuccessView;
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
