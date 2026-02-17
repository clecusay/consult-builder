'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Save,
  Check,
  Stethoscope,
  Search,
  X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Standardized treatment library — platform-managed, not tenant-editable
// ---------------------------------------------------------------------------

interface Treatment {
  name: string;
  description: string;
  category: string;
}

const TREATMENT_LIBRARY: Treatment[] = [
  // ── Surgical — Face ──────────────────────────────────────────────
  { name: 'Facelift (Rhytidectomy)', description: 'Surgical lifting and tightening of facial tissues to reduce sagging and wrinkles', category: 'Surgical — Face' },
  { name: 'Brow Lift (Forehead Lift)', description: 'Raises the brow line to reduce forehead wrinkles and improve frown lines', category: 'Surgical — Face' },
  { name: 'Eyelid Surgery (Blepharoplasty)', description: 'Removes excess skin and fat from upper and/or lower eyelids', category: 'Surgical — Face' },
  { name: 'Rhinoplasty', description: 'Reshapes the nose for aesthetic or functional improvement', category: 'Surgical — Face' },
  { name: 'Revision Rhinoplasty', description: 'Secondary nose surgery to correct or improve results from a prior rhinoplasty', category: 'Surgical — Face' },
  { name: 'Septoplasty', description: 'Corrects a deviated septum to improve breathing', category: 'Surgical — Face' },
  { name: 'Otoplasty (Ear Surgery)', description: 'Reshapes or pins back protruding ears', category: 'Surgical — Face' },
  { name: 'Neck Lift', description: 'Tightens loose skin and muscles of the neck and jawline', category: 'Surgical — Face' },
  { name: 'Chin Augmentation (Mentoplasty)', description: 'Enhances chin projection using implants or bone repositioning', category: 'Surgical — Face' },
  { name: 'Cheek Augmentation', description: 'Adds volume and definition to the cheekbones with implants or fat transfer', category: 'Surgical — Face' },
  { name: 'Lip Lift', description: 'Shortens the space between the nose and upper lip for a fuller appearance', category: 'Surgical — Face' },
  { name: 'Fat Transfer to Face', description: 'Uses patient\'s own fat to restore facial volume', category: 'Surgical — Face' },
  { name: 'Facial Implants', description: 'Silicone implants to enhance chin, cheeks, or jawline', category: 'Surgical — Face' },
  { name: 'Buccal Fat Removal', description: 'Removes fat pads from the cheeks for a slimmer facial contour', category: 'Surgical — Face' },

  // ── Surgical — Breast ────────────────────────────────────────────
  { name: 'Breast Augmentation', description: 'Enhances breast size and shape with implants or fat transfer', category: 'Surgical — Breast' },
  { name: 'Breast Lift (Mastopexy)', description: 'Lifts and reshapes sagging breasts', category: 'Surgical — Breast' },
  { name: 'Breast Reduction', description: 'Reduces breast size to relieve discomfort and improve proportion', category: 'Surgical — Breast' },
  { name: 'Breast Augmentation with Lift', description: 'Combines implants with a breast lift for enhanced shape and position', category: 'Surgical — Breast' },
  { name: 'Breast Implant Revision', description: 'Replaces or adjusts existing breast implants', category: 'Surgical — Breast' },
  { name: 'Breast Implant Removal (Explant)', description: 'Removes breast implants with or without a lift', category: 'Surgical — Breast' },
  { name: 'Breast Reconstruction', description: 'Rebuilds the breast after mastectomy or injury', category: 'Surgical — Breast' },
  { name: 'Nipple/Areola Surgery', description: 'Corrects inverted nipples or resizes the areola', category: 'Surgical — Breast' },
  { name: 'Gynecomastia Surgery (Male Breast Reduction)', description: 'Reduces excess male breast tissue', category: 'Surgical — Breast' },

  // ── Surgical — Body ──────────────────────────────────────────────
  { name: 'Tummy Tuck (Abdominoplasty)', description: 'Removes excess abdominal skin and tightens underlying muscles', category: 'Surgical — Body' },
  { name: 'Mini Tummy Tuck', description: 'A less extensive tummy tuck targeting the area below the navel', category: 'Surgical — Body' },
  { name: 'Extended Tummy Tuck', description: 'Addresses the full abdomen and flanks for more extensive contouring', category: 'Surgical — Body' },
  { name: 'Liposuction', description: 'Removes stubborn fat deposits from targeted body areas', category: 'Surgical — Body' },
  { name: 'VASER Liposuction', description: 'Ultrasound-assisted liposuction for precise fat removal and skin tightening', category: 'Surgical — Body' },
  { name: 'Brazilian Butt Lift (BBL)', description: 'Transfers fat to the buttocks for enhanced shape and volume', category: 'Surgical — Body' },
  { name: 'Buttock Augmentation (Implants)', description: 'Enhances buttock projection using silicone implants', category: 'Surgical — Body' },
  { name: 'Body Lift (Belt Lipectomy)', description: 'Removes excess skin around the entire midsection after weight loss', category: 'Surgical — Body' },
  { name: 'Arm Lift (Brachioplasty)', description: 'Removes excess skin and fat from the upper arms', category: 'Surgical — Body' },
  { name: 'Thigh Lift', description: 'Tightens and contours the inner or outer thighs', category: 'Surgical — Body' },
  { name: 'Mommy Makeover', description: 'Combination of procedures to restore pre-pregnancy body shape', category: 'Surgical — Body' },
  { name: 'Labiaplasty', description: 'Reshapes the labia minora for comfort or aesthetics', category: 'Surgical — Body' },
  { name: 'Vaginoplasty', description: 'Tightens vaginal muscles and surrounding tissue', category: 'Surgical — Body' },
  { name: 'Panniculectomy', description: 'Removes a large hanging apron of skin and fat from the lower abdomen', category: 'Surgical — Body' },
  { name: 'Calf Augmentation', description: 'Enhances calf shape and size with implants', category: 'Surgical — Body' },
  { name: 'Monsplasty', description: 'Reduces excess tissue in the mons pubis area', category: 'Surgical — Body' },

  // ── Surgical — Hair ──────────────────────────────────────────────
  { name: 'Hair Transplant (FUE)', description: 'Follicular unit extraction for natural-looking hair restoration', category: 'Surgical — Hair' },
  { name: 'Hair Transplant (FUT/Strip)', description: 'Strip harvesting technique for large-scale hair restoration', category: 'Surgical — Hair' },
  { name: 'Eyebrow Transplant', description: 'Restores or enhances eyebrow hair using transplanted follicles', category: 'Surgical — Hair' },

  // ── Injectables & Fillers ────────────────────────────────────────
  { name: 'Botox (Botulinum Toxin)', description: 'Reduces dynamic wrinkles by relaxing facial muscles', category: 'Injectables & Fillers' },
  { name: 'Dysport', description: 'Neuromodulator that smooths frown lines and forehead wrinkles', category: 'Injectables & Fillers' },
  { name: 'Xeomin', description: 'Pure botulinum toxin for wrinkle reduction without complex proteins', category: 'Injectables & Fillers' },
  { name: 'Jeuveau (Newtox)', description: 'Modern neurotoxin specifically designed for frown lines', category: 'Injectables & Fillers' },
  { name: 'Daxxify', description: 'Long-lasting neuromodulator for glabellar lines', category: 'Injectables & Fillers' },
  { name: 'Dermal Fillers (Hyaluronic Acid)', description: 'Restores volume and smooths wrinkles with HA-based fillers like Juvederm or Restylane', category: 'Injectables & Fillers' },
  { name: 'Lip Fillers', description: 'Enhances lip volume and shape with injectable dermal fillers', category: 'Injectables & Fillers' },
  { name: 'Cheek Fillers', description: 'Restores midface volume and cheekbone definition', category: 'Injectables & Fillers' },
  { name: 'Jawline Fillers', description: 'Defines and contours the jawline for a sharper profile', category: 'Injectables & Fillers' },
  { name: 'Under Eye Fillers (Tear Trough)', description: 'Reduces dark circles and hollows under the eyes', category: 'Injectables & Fillers' },
  { name: 'Chin Fillers', description: 'Non-surgical chin augmentation for improved profile balance', category: 'Injectables & Fillers' },
  { name: 'Temple Fillers', description: 'Restores volume to hollow temples for a more youthful appearance', category: 'Injectables & Fillers' },
  { name: 'Hand Rejuvenation (Fillers)', description: 'Restores volume to aging hands with injectable fillers', category: 'Injectables & Fillers' },
  { name: 'Sculptra (Poly-L-Lactic Acid)', description: 'Stimulates natural collagen production for gradual volume restoration', category: 'Injectables & Fillers' },
  { name: 'Radiesse', description: 'Calcium-based filler for deep wrinkles and volume loss', category: 'Injectables & Fillers' },
  { name: 'Kybella (Deoxycholic Acid)', description: 'Injectable treatment that dissolves fat under the chin', category: 'Injectables & Fillers' },
  { name: 'Liquid Facelift', description: 'Combination of fillers and Botox for non-surgical facial rejuvenation', category: 'Injectables & Fillers' },
  { name: 'Liquid Rhinoplasty', description: 'Non-surgical nose reshaping with dermal fillers', category: 'Injectables & Fillers' },
  { name: 'PDO Thread Lift', description: 'Minimally invasive lift using dissolvable threads to tighten skin', category: 'Injectables & Fillers' },
  { name: 'PRP Therapy (Platelet-Rich Plasma)', description: 'Uses concentrated platelets to stimulate healing and rejuvenation', category: 'Injectables & Fillers' },
  { name: 'PRP for Hair Loss', description: 'Platelet-rich plasma injections to stimulate hair growth', category: 'Injectables & Fillers' },

  // ── Skin Treatments & Facials ────────────────────────────────────
  { name: 'Chemical Peel (Light)', description: 'Mild acid peel to improve skin texture and tone', category: 'Skin Treatments & Facials' },
  { name: 'Chemical Peel (Medium/Deep)', description: 'Stronger acid peel for wrinkles, scars, and pigmentation', category: 'Skin Treatments & Facials' },
  { name: 'Microneedling', description: 'Creates micro-injuries to stimulate collagen and improve skin texture', category: 'Skin Treatments & Facials' },
  { name: 'Microneedling with PRP (Vampire Facial)', description: 'Combines microneedling with platelet-rich plasma for enhanced results', category: 'Skin Treatments & Facials' },
  { name: 'Microdermabrasion', description: 'Mechanical exfoliation that removes dead skin cells for smoother skin', category: 'Skin Treatments & Facials' },
  { name: 'HydraFacial', description: 'Multi-step facial that cleanses, exfoliates, extracts, and hydrates', category: 'Skin Treatments & Facials' },
  { name: 'Dermaplaning', description: 'Manual exfoliation to remove peach fuzz and dead skin cells', category: 'Skin Treatments & Facials' },
  { name: 'Oxygen Facial', description: 'Delivers pressurized oxygen and serums to the skin for a radiant glow', category: 'Skin Treatments & Facials' },
  { name: 'LED Light Therapy', description: 'Uses specific light wavelengths to target acne, aging, and inflammation', category: 'Skin Treatments & Facials' },
  { name: 'Acne Treatment Program', description: 'Customized treatment plan for active acne and breakouts', category: 'Skin Treatments & Facials' },
  { name: 'Acne Scar Treatment', description: 'Reduces the appearance of acne scarring with laser or microneedling', category: 'Skin Treatments & Facials' },
  { name: 'Rosacea Treatment', description: 'Targeted treatments to reduce redness and flare-ups', category: 'Skin Treatments & Facials' },
  { name: 'Melasma Treatment', description: 'Specialized treatment for hormonal pigmentation', category: 'Skin Treatments & Facials' },
  { name: 'Pigmentation Treatment', description: 'Targets dark spots, sunspots, and uneven skin tone', category: 'Skin Treatments & Facials' },
  { name: 'Scar Treatment', description: 'Minimizes the appearance of surgical, trauma, or keloid scars', category: 'Skin Treatments & Facials' },
  { name: 'Stretch Mark Treatment', description: 'Reduces the appearance of stretch marks with laser or microneedling', category: 'Skin Treatments & Facials' },
  { name: 'Skin Tag Removal', description: 'Quick removal of benign skin growths', category: 'Skin Treatments & Facials' },
  { name: 'Mole Removal', description: 'Cosmetic removal of unwanted moles', category: 'Skin Treatments & Facials' },

  // ── Laser & Energy Treatments ────────────────────────────────────
  { name: 'Laser Skin Resurfacing', description: 'Uses laser energy to improve skin texture, tone, and wrinkles', category: 'Laser & Energy' },
  { name: 'Fractional CO2 Laser', description: 'Ablative laser for deep wrinkles, scars, and skin resurfacing', category: 'Laser & Energy' },
  { name: 'Fraxel Laser', description: 'Non-ablative fractional laser for fine lines and sun damage', category: 'Laser & Energy' },
  { name: 'IPL Photofacial', description: 'Intense pulsed light to treat sun damage, pigmentation, and redness', category: 'Laser & Energy' },
  { name: 'BBL (BroadBand Light)', description: 'Advanced IPL therapy for skin rejuvenation and pigmentation', category: 'Laser & Energy' },
  { name: 'Laser Hair Removal', description: 'Permanent hair reduction using targeted laser energy', category: 'Laser & Energy' },
  { name: 'Laser Tattoo Removal', description: 'Breaks down tattoo ink particles with laser energy', category: 'Laser & Energy' },
  { name: 'Laser Vein Treatment', description: 'Removes spider veins and small varicose veins with laser energy', category: 'Laser & Energy' },
  { name: 'Morpheus8', description: 'Combines microneedling with radiofrequency for deep skin remodeling', category: 'Laser & Energy' },
  { name: 'Radiofrequency Skin Tightening', description: 'Uses RF energy to heat tissue and stimulate collagen for tighter skin', category: 'Laser & Energy' },
  { name: 'Ultherapy', description: 'Uses focused ultrasound energy to lift and tighten skin non-invasively', category: 'Laser & Energy' },
  { name: 'Thermage', description: 'Radiofrequency treatment that smooths and tightens skin', category: 'Laser & Energy' },
  { name: 'Photodynamic Therapy (PDT)', description: 'Light-activated treatment for sun-damaged skin and pre-cancerous lesions', category: 'Laser & Energy' },
  { name: 'Laser Genesis', description: 'Gently heats skin to stimulate collagen and reduce redness', category: 'Laser & Energy' },
  { name: 'Clear + Brilliant', description: 'Gentle fractional laser for early signs of aging and dull skin', category: 'Laser & Energy' },
  { name: 'Halo Laser', description: 'Hybrid fractional laser combining ablative and non-ablative wavelengths', category: 'Laser & Energy' },

  // ── Body Contouring (Non-Surgical) ───────────────────────────────
  { name: 'CoolSculpting (Cryolipolysis)', description: 'Freezes and destroys fat cells for non-surgical body contouring', category: 'Body Contouring (Non-Surgical)' },
  { name: 'EMSculpt / EMSculpt NEO', description: 'Builds muscle and reduces fat with electromagnetic energy', category: 'Body Contouring (Non-Surgical)' },
  { name: 'SculpSure', description: 'Laser-based body contouring that heats and destroys fat cells', category: 'Body Contouring (Non-Surgical)' },
  { name: 'truSculpt', description: 'Radiofrequency body contouring for fat reduction', category: 'Body Contouring (Non-Surgical)' },
  { name: 'Vanquish ME', description: 'Contactless radiofrequency treatment for large area fat reduction', category: 'Body Contouring (Non-Surgical)' },
  { name: 'CoolTone', description: 'Magnetic muscle stimulation for toning and strengthening', category: 'Body Contouring (Non-Surgical)' },
  { name: 'Cellulite Treatment', description: 'Various modalities to reduce the appearance of cellulite', category: 'Body Contouring (Non-Surgical)' },
  { name: 'Exilis Ultra', description: 'Combines radiofrequency and ultrasound for skin tightening and fat reduction', category: 'Body Contouring (Non-Surgical)' },

  // ── Vein & Vascular ──────────────────────────────────────────────
  { name: 'Sclerotherapy', description: 'Injection treatment to collapse and eliminate spider and varicose veins', category: 'Vein & Vascular' },
  { name: 'Spider Vein Treatment', description: 'Targeted treatment for visible spider veins on legs and face', category: 'Vein & Vascular' },
  { name: 'Varicose Vein Treatment', description: 'Minimally invasive procedures to treat bulging varicose veins', category: 'Vein & Vascular' },
  { name: 'Broken Blood Vessel Treatment', description: 'Laser or IPL treatment for facial blood vessels and capillaries', category: 'Vein & Vascular' },

  // ── Wellness & Regenerative ──────────────────────────────────────
  { name: 'IV Therapy / Vitamin Infusion', description: 'Intravenous delivery of vitamins and nutrients for wellness and beauty', category: 'Wellness & Regenerative' },
  { name: 'Vitamin B12 Injections', description: 'Boosts energy levels and supports metabolic function', category: 'Wellness & Regenerative' },
  { name: 'Biotin Injections', description: 'Supports hair, skin, and nail health', category: 'Wellness & Regenerative' },
  { name: 'Weight Management Program', description: 'Medical weight loss with customized plans and monitoring', category: 'Wellness & Regenerative' },
  { name: 'Semaglutide / GLP-1 Weight Loss', description: 'Injectable medication for medical weight management', category: 'Wellness & Regenerative' },
  { name: 'Tirzepatide Weight Loss', description: 'Dual-action injectable for weight management', category: 'Wellness & Regenerative' },
  { name: 'Hormone Replacement Therapy (HRT)', description: 'Balances hormones for improved wellness and vitality', category: 'Wellness & Regenerative' },
  { name: 'Testosterone Replacement Therapy (TRT)', description: 'Restores testosterone levels in men for energy and wellness', category: 'Wellness & Regenerative' },
  { name: 'Exosome Therapy', description: 'Regenerative treatment using exosomes for skin and hair rejuvenation', category: 'Wellness & Regenerative' },
  { name: 'Stem Cell Therapy', description: 'Uses stem cells for tissue regeneration and rejuvenation', category: 'Wellness & Regenerative' },
  { name: 'NAD+ IV Therapy', description: 'Intravenous NAD+ to support cellular health and anti-aging', category: 'Wellness & Regenerative' },
  { name: 'Glutathione Injections', description: 'Powerful antioxidant for skin brightening and detox', category: 'Wellness & Regenerative' },

  // ── Sexual Wellness ──────────────────────────────────────────────
  { name: 'Vaginal Rejuvenation (Non-Surgical)', description: 'Laser or RF treatments to improve vaginal health and comfort', category: 'Sexual Wellness' },
  { name: 'O-Shot (Orgasm Shot)', description: 'PRP injection for enhanced sexual wellness in women', category: 'Sexual Wellness' },
  { name: 'P-Shot (Priapus Shot)', description: 'PRP injection for male sexual wellness and performance', category: 'Sexual Wellness' },
  { name: 'Penile Enhancement', description: 'Non-surgical or surgical procedures for penile augmentation', category: 'Sexual Wellness' },

  // ── Dental & Smile ───────────────────────────────────────────────
  { name: 'Teeth Whitening', description: 'Professional in-office or take-home teeth whitening treatments', category: 'Dental & Smile' },
  { name: 'Dental Veneers', description: 'Custom porcelain shells to improve smile aesthetics', category: 'Dental & Smile' },
  { name: 'Gum Contouring', description: 'Reshapes the gum line for a more balanced smile', category: 'Dental & Smile' },
];

const LIBRARY_CATEGORIES = [...new Set(TREATMENT_LIBRARY.map((t) => t.category))];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ServicesPage() {
  // Set of treatment names (lowercase) the tenant has enabled
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all');

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;
      setTenantId(profile.tenant_id);

      // Load tenant's existing services — match by name to our standard list
      const { data: existingServices } = await supabase
        .from('services')
        .select('name, is_active')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true);

      const enabledNames = new Set(
        (existingServices ?? []).map((s) => s.name.toLowerCase())
      );
      setEnabled(enabledNames);
      setLoading(false);
    }

    load();
  }, [supabase]);

  // ── Toggle ─────────────────────────────────────────────────────────

  function toggleTreatment(name: string) {
    const key = name.toLowerCase();
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function enableAll(category: string) {
    const names = TREATMENT_LIBRARY
      .filter((t) => t.category === category)
      .map((t) => t.name.toLowerCase());
    setEnabled((prev) => {
      const next = new Set(prev);
      for (const n of names) next.add(n);
      return next;
    });
  }

  function disableAll(category: string) {
    const names = new Set(
      TREATMENT_LIBRARY
        .filter((t) => t.category === category)
        .map((t) => t.name.toLowerCase())
    );
    setEnabled((prev) => {
      const next = new Set(prev);
      for (const n of names) next.delete(n);
      return next;
    });
  }

  function enableAllVisible() {
    setEnabled((prev) => {
      const next = new Set(prev);
      for (const t of filteredLibrary) next.add(t.name.toLowerCase());
      return next;
    });
  }

  function disableAllVisible() {
    const visibleNames = new Set(filteredLibrary.map((t) => t.name.toLowerCase()));
    setEnabled((prev) => {
      const next = new Set(prev);
      for (const n of visibleNames) next.delete(n);
      return next;
    });
  }

  // ── Save ───────────────────────────────────────────────────────────

  async function handleSave() {
    if (!tenantId) return;
    setSaving(true);
    setSaved(false);

    // Delete existing services and insert the enabled ones
    await supabase.from('services').delete().eq('tenant_id', tenantId);

    const rows = TREATMENT_LIBRARY
      .filter((t) => enabled.has(t.name.toLowerCase()))
      .map((t, i) => ({
        tenant_id: tenantId,
        name: t.name,
        slug: generateSlug(t.name),
        description: t.description,
        category_id: null,
        is_active: true,
        display_order: i + 1,
      }));

    if (rows.length > 0) {
      await supabase.from('services').insert(rows);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // ── Filtered library ───────────────────────────────────────────────

  const filteredLibrary = useMemo(() => {
    let result = TREATMENT_LIBRARY;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    if (filterCategory !== 'all') {
      result = result.filter((t) => t.category === filterCategory);
    }
    if (filterStatus === 'enabled') {
      result = result.filter((t) => enabled.has(t.name.toLowerCase()));
    } else if (filterStatus === 'disabled') {
      result = result.filter((t) => !enabled.has(t.name.toLowerCase()));
    }
    return result;
  }, [searchQuery, filterCategory, filterStatus, enabled]);

  // Group by category
  const groupedLibrary = useMemo(() => {
    const groups: Record<string, Treatment[]> = {};
    for (const item of filteredLibrary) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filteredLibrary]);

  const enabledCount = enabled.size;

  // ── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Services &amp; Procedures
          </h1>
          <p className="text-muted-foreground">
            Select the treatments your practice offers from our standardized library
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
        </Button>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-sm px-3 py-1">
          <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
          {enabledCount} of {TREATMENT_LIBRARY.length} services enabled
        </Badge>
        {enabledCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'enabled' ? 'all' : 'enabled')}
            className="text-xs text-indigo-600 hover:underline"
          >
            {filterStatus === 'enabled' ? 'Show all' : 'Show enabled only'}
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search treatments... (e.g. botox, laser, breast)"
                className="pl-9 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-2 text-sm sm:w-64"
            >
              <option value="all">All Categories ({TREATMENT_LIBRARY.length})</option>
              {LIBRARY_CATEGORIES.map((cat) => {
                const count = TREATMENT_LIBRARY.filter((t) => t.category === cat).length;
                return (
                  <option key={cat} value={cat}>
                    {cat} ({count})
                  </option>
                );
              })}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'enabled' | 'disabled')}
              className="h-9 rounded-md border border-input bg-transparent px-2 text-sm sm:w-40"
            >
              <option value="all">All Status</option>
              <option value="enabled">Enabled Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>

          {/* Bulk actions */}
          {filteredLibrary.length > 0 && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-muted-foreground">
                {filteredLibrary.length} treatment{filteredLibrary.length !== 1 ? 's' : ''} shown
              </span>
              <button
                type="button"
                onClick={enableAllVisible}
                className="text-xs text-indigo-600 hover:underline"
              >
                Enable all visible
              </button>
              <button
                type="button"
                onClick={disableAllVisible}
                className="text-xs text-red-500 hover:underline"
              >
                Disable all visible
              </button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredLibrary.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedLibrary).map(([category, items]) => {
                const enabledInCat = items.filter((t) =>
                  enabled.has(t.name.toLowerCase())
                ).length;

                return (
                  <div key={category}>
                    <div className="mb-2.5 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {category}
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {enabledInCat}/{items.length}
                        </Badge>
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => enableAll(category)}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          Enable all
                        </button>
                        <span className="text-muted-foreground text-xs">|</span>
                        <button
                          type="button"
                          onClick={() => disableAll(category)}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          Disable all
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((item) => {
                        const isEnabled = enabled.has(item.name.toLowerCase());
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => toggleTreatment(item.name)}
                            className={`group flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                              isEnabled
                                ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${
                                isEnabled
                                  ? 'bg-indigo-500'
                                  : 'border-2 border-slate-300 group-hover:border-slate-400'
                              }`}
                            >
                              {isEnabled && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className={`block font-medium leading-tight ${
                                  isEnabled ? 'text-indigo-900' : 'text-foreground'
                                }`}
                              >
                                {item.name}
                              </span>
                              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                                {item.description}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No treatments match your search
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('all');
                  setFilterStatus('all');
                }}
                className="mt-2 text-xs text-indigo-600 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
