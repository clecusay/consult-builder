'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Search,
  X,
} from 'lucide-react';
import type {
  WidgetConfigResponse,
  WidgetConcern,
  WidgetMode,
} from '@treatment-builder/shared';
import { BodySilhouette } from './body-svg';

interface Props {
  slug: string;
}

type View = 'body' | 'form' | 'success';

// ── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ currentStep, primaryColor }: { currentStep: number; primaryColor: string }) {
  const steps = ['Select Areas', 'Your Concerns', 'Your Info'];
  return (
    <div className="flex items-center justify-center gap-0 py-3 px-4">
      {steps.map((label, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;
        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div
                className="h-[2px] w-6"
                style={{ backgroundColor: isCompleted ? primaryColor : '#e2e8f0' }}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                  width: isActive ? 28 : 20,
                  height: isActive ? 28 : 20,
                  backgroundColor: isActive || isCompleted ? primaryColor : '#e2e8f0',
                }}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3 text-white" />
                ) : (
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: isActive ? 'white' : '#94a3b8' }}
                  >
                    {i + 1}
                  </span>
                )}
              </div>
              <span
                className="text-[9px] font-medium whitespace-nowrap"
                style={{ color: isActive ? primaryColor : '#94a3b8' }}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function WidgetPreviewClient({ slug }: Props) {
  const [config, setConfig] = useState<WidgetConfigResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Widget state
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [view, setView] = useState<View>('body');
  const [selectedRegionSlugs, setSelectedRegionSlugs] = useState<Set<string>>(new Set());
  const [selectedConcernIds, setSelectedConcernIds] = useState<Set<string>>(new Set());
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(false);

  // Phase 3 state
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [concernSearchQuery, setConcernSearchQuery] = useState('');
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Phase 5 state — mobile
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSheetRegion, setMobileSheetRegion] = useState<string | null>(null);

  // Mobile detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 639px)');
    setIsMobile(mql.matches);
    function onChange(e: MediaQueryListEvent) {
      setIsMobile(e.matches);
    }
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  async function loadConfig(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/widget/config?slug=${slug}`, { signal });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Error ${res.status}`);
        return;
      }
      const data = await res.json();
      if (!signal?.aborted) {
        setConfig(data);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Failed to fetch widget config');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadConfig(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // ── Derived data ───────────────────────────────────────────────────

  const widgetMode: WidgetMode = config?.widget_mode ?? 'regions_concerns';
  const showConcerns = widgetMode.includes('concerns');
  const showServices = widgetMode.includes('services');

  // Regions for the selected gender
  const genderRegions = useMemo(() => {
    if (!config) return [];
    return config.regions.filter(
      (r) => r.gender === gender || r.gender === 'all'
    );
  }, [config, gender]);

  // Active region slugs (for SVG anchors — what's clickable)
  const activeRegionSlugs = useMemo(
    () => new Set(genderRegions.map((r) => r.slug)),
    [genderRegions]
  );

  // Selected region objects, sorted alphabetically
  const selectedRegions = useMemo(
    () =>
      genderRegions
        .filter((r) => selectedRegionSlugs.has(r.slug))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [genderRegions, selectedRegionSlugs]
  );

  // Concerns from selected regions, grouped by region
  const concernsByRegion = useMemo(() => {
    const grouped: { regionName: string; regionSlug: string; concerns: (WidgetConcern & { regionSlug: string })[] }[] = [];
    for (const region of selectedRegions) {
      if (region.concerns.length > 0) {
        grouped.push({
          regionName: region.name,
          regionSlug: region.slug,
          concerns: region.concerns.map((c) => ({ ...c, regionSlug: region.slug })),
        });
      }
    }
    return grouped;
  }, [selectedRegions]);

  // Services from selected regions (if mode includes services)
  const servicesByCategory = useMemo(() => {
    if (!config) return [];
    return config.service_categories
      .filter((cat) => cat.services.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [config]);

  // Auto-expand newly selected regions
  useEffect(() => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      for (const group of concernsByRegion) {
        next.add(group.regionSlug);
      }
      return next;
    });
  }, [concernsByRegion]);

  function handleAnchorClick(regionSlugs: string[]) {
    setSelectedRegionSlugs((prev) => {
      const next = new Set(prev);
      const allSelected = regionSlugs.every((s) => next.has(s));
      if (allSelected) {
        regionSlugs.forEach((s) => next.delete(s));
      } else {
        regionSlugs.forEach((s) => next.add(s));
      }
      return next;
    });

    // On mobile, open bottom sheet for the clicked anchor's first slug
    if (isMobile && !regionSlugs.every((s) => selectedRegionSlugs.has(s))) {
      setMobileSheetRegion(regionSlugs[0]);
    }

    // Auto-scroll to newly added region on desktop
    if (!isMobile) {
      const slugToScroll = regionSlugs[0];
      requestAnimationFrame(() => {
        const el = rightPanelRef.current?.querySelector(`[data-region-slug="${slugToScroll}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  function handleRemoveRegionBySlug(slug: string) {
    setSelectedRegionSlugs((prev) => {
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
    // Clear concerns for that region
    const regionConcernIds = new Set(
      genderRegions
        .filter((r) => r.slug === slug)
        .flatMap((r) => r.concerns.map((c) => c.id))
    );
    setSelectedConcernIds((prev) => {
      const next = new Set(prev);
      regionConcernIds.forEach((id) => next.delete(id));
      return next;
    });
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
  }

  function toggleConcern(id: string) {
    setSelectedConcernIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleService(id: string) {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleRegionExpanded(slug: string) {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function reset() {
    setView('body');
    setGender('female');
    setSelectedRegionSlugs(new Set());
    setSelectedConcernIds(new Set());
    setSelectedServiceIds(new Set());
    setSmsOptIn(false);
    setEmailOptIn(false);
    setExpandedRegions(new Set());
    setConcernSearchQuery('');
    setMobileSheetRegion(null);
  }

  // Count selected concerns per region
  const getRegionConcernCount = useCallback(
    (regionSlug: string) => {
      const region = genderRegions.find((r) => r.slug === regionSlug);
      if (!region) return 0;
      return region.concerns.filter((c) => selectedConcernIds.has(c.id)).length;
    },
    [genderRegions, selectedConcernIds]
  );

  // Popular concerns: top 3 by lowest display_order per region (only when region has > 3 concerns)
  const getPopularConcernIds = useCallback(
    (concerns: WidgetConcern[]) => {
      if (concerns.length <= 3) return new Set<string>();
      const sorted = [...concerns].sort((a, b) => a.display_order - b.display_order);
      return new Set(sorted.slice(0, 3).map((c) => c.id));
    },
    []
  );

  // Mobile sheet: find concerns for the open region
  const mobileSheetConcerns = useMemo(() => {
    if (!mobileSheetRegion) return [];
    const region = genderRegions.find((r) => r.slug === mobileSheetRegion);
    return region?.concerns ?? [];
  }, [mobileSheetRegion, genderRegions]);

  const mobileSheetRegionName = useMemo(() => {
    if (!mobileSheetRegion) return '';
    return genderRegions.find((r) => r.slug === mobileSheetRegion)?.name ?? '';
  }, [mobileSheetRegion, genderRegions]);

  // ── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 bg-white">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading widget config...</span>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-sm font-medium text-red-600">{error || 'No config'}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Make sure your widget is configured and the tenant is active.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => loadConfig()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const { branding } = config;
  const primaryColor = branding.primary_color || '#e84393';

  const totalSelections = selectedConcernIds.size + selectedServiceIds.size;
  const currentStep = view === 'body' ? (selectedRegionSlugs.size > 0 ? 1 : 0) : 2;

  // ── Concern Button (shared between desktop panel and mobile sheet) ──

  function renderConcernButton(concern: WidgetConcern, popularIds?: Set<string>) {
    const isSelected = selectedConcernIds.has(concern.id);
    const isPopular = popularIds?.has(concern.id) ?? false;

    const button = (
      <button
        key={concern.id}
        type="button"
        onClick={() => toggleConcern(concern.id)}
        className={`flex items-center gap-2 w-full rounded-lg border px-3 py-2 text-left text-sm transition-all ${
          isSelected
            ? 'border-pink-200 bg-pink-50'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <div
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${
            isSelected ? '' : 'border border-slate-300'
          }`}
          style={isSelected ? { backgroundColor: primaryColor } : undefined}
        >
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </div>
        <span className={`flex-1 ${isSelected ? 'font-medium' : 'text-slate-700'}`}>
          {concern.name}
        </span>
        {isPopular && (
          <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50 px-1.5 py-0">
            Popular
          </Badge>
        )}
      </button>
    );

    if (concern.description) {
      return (
        <Tooltip key={concern.id}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="left" className="max-w-[200px]">
            {concern.description}
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  }

  // ── Success View ────────────────────────────────────────────────────
  if (view === 'success') {
    return (
      <div className="bg-white">
        <div className="py-16 text-center space-y-4 px-6">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Check className="h-8 w-8" style={{ color: primaryColor }} />
          </div>
          <h2 className="text-lg font-bold">Thank You!</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {branding.success_message || 'Thank you for your interest! We\'ll be in touch shortly with personalized recommendations.'}
          </p>
          <Button variant="outline" size="sm" onClick={reset}>
            Start Over
          </Button>
        </div>
        <div className="border-t px-6 py-3 text-center">
          <span className="text-[10px] text-muted-foreground">
            Powered by Consult Builder
          </span>
        </div>
      </div>
    );
  }

  // ── Form View ─────────────────────────────────────────────────────
  if (view === 'form') {
    return (
      <div className="bg-white" style={{ fontFamily: branding.font_family || 'inherit' }}>
        <div
          className="px-6 py-4"
          style={{ backgroundColor: primaryColor, color: '#fff' }}
        >
          <h2 className="text-lg font-bold text-center">
            Complete Your Consultation Request
          </h2>
          <p className="text-sm opacity-80 text-center mt-1">
            Fill in your details and we&apos;ll reach out with personalized recommendations
          </p>
        </div>

        <StepIndicator currentStep={2} primaryColor={primaryColor} />

        <div className="px-6 py-6 max-w-lg mx-auto space-y-4">
          {/* Standard fields */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">First Name *</label>
              <Input placeholder="Jane" className="text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Last Name *</label>
              <Input placeholder="Doe" className="text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Email *</label>
              <Input type="email" placeholder="jane@example.com" className="text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Phone</label>
              <Input type="tel" placeholder="(555) 555-5555" className="text-sm" />
            </div>
          </div>

          {/* Custom form fields */}
          {config.form_fields.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {config.form_fields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <label className="text-xs font-medium">
                    {field.label}
                    {field.is_required && ' *'}
                  </label>
                  {field.field_type === 'textarea' ? (
                    <textarea
                      placeholder={field.placeholder || ''}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      rows={3}
                    />
                  ) : field.field_type === 'select' ? (
                    <select className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm">
                      <option value="">Select...</option>
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.field_type === 'checkbox' ? (
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{field.placeholder || field.label}</span>
                    </div>
                  ) : (
                    <Input
                      type={field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : 'text'}
                      placeholder={field.placeholder || ''}
                      className="text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Marketing opt-in */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <p className="text-xs font-medium text-slate-700">Communication Preferences</p>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={smsOptIn}
                onChange={(e) => setSmsOptIn(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                I agree to receive SMS text messages with appointment reminders, promotions,
                and special offers. Message &amp; data rates may apply. Reply STOP to unsubscribe.
              </span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={emailOptIn}
                onChange={(e) => setEmailOptIn(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                I would like to receive email updates including exclusive promotions,
                new treatment announcements, and helpful skincare tips. Unsubscribe anytime.
              </span>
            </label>
          </div>

          {/* Nav */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => setView('body')}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => setView('success')}
              style={{ backgroundColor: primaryColor }}
              className="text-white"
            >
              {branding.cta_text || 'Request Consultation'}
            </Button>
          </div>
        </div>

        <div className="border-t px-6 py-3 text-center">
          <span className="text-[10px] text-muted-foreground">
            Powered by Consult Builder
          </span>
        </div>
      </div>
    );
  }

  // ── Body Selection View (default) ─────────────────────────────────

  return (
    <TooltipProvider>
      <div className="bg-white" style={{ fontFamily: branding.font_family || 'inherit' }}>
        {/* Header */}
        <div
          className="px-6 py-4"
          style={{ backgroundColor: primaryColor, color: '#fff' }}
        >
          {config.tenant.logo_url && (
            <img
              src={config.tenant.logo_url}
              alt={config.tenant.name}
              className="mx-auto mb-2 h-8 object-contain"
            />
          )}
          <h2 className="text-lg font-bold text-center">
            {branding.cta_text || 'Build Your Consultation Plan'}
          </h2>
          <p className="text-sm opacity-80 text-center mt-1">
            Select the areas you&apos;d like to address
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={currentStep} primaryColor={primaryColor} />

        {/* Split layout: body left, panel right — stacked on mobile */}
        <div className="flex flex-col sm:flex-row" style={{ minHeight: 600 }}>
          {/* Left: Body Diagram */}
          <div className="flex-1 flex flex-col items-center justify-between py-4 px-2 border-b sm:border-b-0 sm:border-r border-slate-100 max-h-[350px] sm:max-h-none">
            <div className="w-full max-w-[220px] flex-1 flex items-center">
              <BodySilhouette
                gender={gender}
                selectedRegionSlugs={selectedRegionSlugs}
                activeRegionSlugs={activeRegionSlugs}
                onAnchorClick={handleAnchorClick}
                primaryColor={primaryColor}
              />
            </div>

            {/* Gender toggle */}
            <div className="flex items-center gap-1 mt-3">
              <button
                type="button"
                onClick={() => {
                  setGender('female');
                  setSelectedRegionSlugs(new Set());
                  setSelectedConcernIds(new Set());
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  gender === 'female'
                    ? 'text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
                style={gender === 'female' ? { backgroundColor: primaryColor } : undefined}
              >
                Female
              </button>
              <button
                type="button"
                onClick={() => {
                  setGender('male');
                  setSelectedRegionSlugs(new Set());
                  setSelectedConcernIds(new Set());
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  gender === 'male'
                    ? 'text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
                style={gender === 'male' ? { backgroundColor: primaryColor } : undefined}
              >
                Male
              </button>
            </div>
          </div>

          {/* Mobile: summary bar below body */}
          {isMobile && selectedRegionSlugs.size > 0 && (
            <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 text-center">
              <span className="text-xs text-slate-600">
                {selectedRegionSlugs.size} area{selectedRegionSlugs.size !== 1 ? 's' : ''} &middot; {selectedConcernIds.size} concern{selectedConcernIds.size !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Right: Concerns / Services Panel (hidden on mobile) */}
          <div ref={rightPanelRef} className="flex-1 hidden sm:flex flex-col overflow-y-auto">
            {selectedRegionSlugs.size === 0 ? (
              // Empty state
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="rounded-full bg-slate-100 p-4 mb-3">
                  <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700">Select a body area</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tap the <span className="font-semibold">+</span> buttons on the body to see
                  {showConcerns ? ' available concerns' : ' available treatments'}
                </p>
              </div>
            ) : (
              // Concerns or services list
              <div className="flex-1 px-4 py-4 space-y-1">
                {/* Search filter */}
                {showConcerns && selectedRegionSlugs.size > 0 && (
                  <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      value={concernSearchQuery}
                      onChange={(e) => setConcernSearchQuery(e.target.value)}
                      placeholder="Search concerns..."
                      className="text-sm pl-8 h-8"
                    />
                    {concernSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setConcernSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Accordion concern groups */}
                {showConcerns && concernsByRegion.map((group) => {
                  const isExpanded = expandedRegions.has(group.regionSlug);
                  const selectedCount = getRegionConcernCount(group.regionSlug);
                  const popularIds = getPopularConcernIds(group.concerns);

                  // Apply search filter
                  const filteredConcerns = concernSearchQuery
                    ? group.concerns.filter((c) =>
                        c.name.toLowerCase().includes(concernSearchQuery.toLowerCase())
                      )
                    : group.concerns;

                  if (concernSearchQuery && filteredConcerns.length === 0) return null;

                  return (
                    <div key={group.regionSlug} data-region-slug={group.regionSlug}>
                      {/* Region header — accordion toggle */}
                      <div className="group flex items-center gap-2 py-2 cursor-pointer select-none" onClick={() => toggleRegionExpanded(group.regionSlug)}>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                            isExpanded ? '' : '-rotate-90'
                          }`}
                        />
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex-1">
                          {group.regionName}
                        </h4>
                        {selectedCount > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {selectedCount} selected
                          </Badge>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRegionBySlug(group.regionSlug);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5"
                          title="Remove region"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Collapsible concern list */}
                      <div
                        className={`overflow-hidden transition-all duration-200 ${
                          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="space-y-1 pb-2">
                          {filteredConcerns.map((concern) =>
                            renderConcernButton(concern, popularIds)
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Show services */}
                {showServices && servicesByCategory.map((cat) => (
                  <div key={cat.id}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      {cat.name}
                    </h4>
                    <div className="space-y-1">
                      {cat.services.map((svc) => {
                        const isSelected = selectedServiceIds.has(svc.id);
                        return (
                          <button
                            key={svc.id}
                            type="button"
                            onClick={() => toggleService(svc.id)}
                            className={`flex items-start gap-2 w-full rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                              isSelected
                                ? 'border-pink-200 bg-pink-50'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                                isSelected ? '' : 'border border-slate-300'
                              }`}
                              style={isSelected ? { backgroundColor: primaryColor } : undefined}
                            >
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <div>
                              <span className={`block ${isSelected ? 'font-medium' : 'text-slate-700'}`}>
                                {svc.name}
                              </span>
                              {svc.description && (
                                <span className="block text-xs text-muted-foreground mt-0.5">
                                  {svc.description}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* No concerns/services for selected regions */}
                {showConcerns && concernsByRegion.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No concerns configured for the selected areas.
                  </p>
                )}
              </div>
            )}

            {/* Floating summary bar */}
            {(totalSelections > 0 || selectedRegionSlugs.size > 0) && (
              <div className="sticky bottom-0 border-t bg-white/95 backdrop-blur-sm px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 flex-1">
                    {selectedRegionSlugs.size} area{selectedRegionSlugs.size !== 1 ? 's' : ''} &middot; {totalSelections} concern{totalSelections !== 1 ? 's' : ''} selected
                  </span>
                  <Button
                    className="text-white"
                    size="sm"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => setView('form')}
                  >
                    Continue
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: floating continue bar */}
        {isMobile && (totalSelections > 0 || selectedRegionSlugs.size > 0) && (
          <div className="sticky bottom-0 border-t bg-white/95 backdrop-blur-sm px-4 py-3 sm:hidden">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 flex-1">
                {selectedRegionSlugs.size} area{selectedRegionSlugs.size !== 1 ? 's' : ''} &middot; {totalSelections} concern{totalSelections !== 1 ? 's' : ''} selected
              </span>
              <Button
                className="text-white"
                size="sm"
                style={{ backgroundColor: primaryColor }}
                onClick={() => setView('form')}
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Mobile bottom sheet for concerns */}
        <Sheet open={!!mobileSheetRegion} onOpenChange={(open) => { if (!open) setMobileSheetRegion(null); }}>
          <SheetContent side="bottom" className="max-h-[70vh] rounded-t-xl">
            <SheetHeader>
              <SheetTitle>{mobileSheetRegionName}</SheetTitle>
              <SheetDescription>Select your concerns for this area</SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto px-4 pb-4 space-y-1">
              {mobileSheetConcerns.map((concern) => {
                const popularIds = getPopularConcernIds(mobileSheetConcerns);
                return renderConcernButton(concern, popularIds);
              })}
              {mobileSheetConcerns.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No concerns configured for this area.
                </p>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Footer */}
        <div className="border-t px-6 py-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            Powered by Consult Builder
          </span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { reset(); loadConfig(); }}>
            <RefreshCw className="h-3 w-3" />
            Reset
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
