'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Tag,
  Stethoscope,
  CheckCircle2,
  Circle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Standardized categories — mirrors the treatment library on services page
// ---------------------------------------------------------------------------

interface CategoryDef {
  name: string;
  description: string;
  treatments: string[];
}

const STANDARD_CATEGORIES: CategoryDef[] = [
  {
    name: 'Surgical — Face',
    description: 'Cosmetic and reconstructive facial surgical procedures',
    treatments: [
      'Facelift (Rhytidectomy)', 'Brow Lift (Forehead Lift)', 'Eyelid Surgery (Blepharoplasty)',
      'Rhinoplasty', 'Revision Rhinoplasty', 'Septoplasty', 'Otoplasty (Ear Surgery)',
      'Neck Lift', 'Chin Augmentation (Mentoplasty)', 'Cheek Augmentation', 'Lip Lift',
      'Fat Transfer to Face', 'Facial Implants', 'Buccal Fat Removal',
    ],
  },
  {
    name: 'Surgical — Breast',
    description: 'Breast augmentation, reduction, lift, and reconstruction procedures',
    treatments: [
      'Breast Augmentation', 'Breast Lift (Mastopexy)', 'Breast Reduction',
      'Breast Augmentation with Lift', 'Breast Implant Revision',
      'Breast Implant Removal (Explant)', 'Breast Reconstruction',
      'Nipple/Areola Surgery', 'Gynecomastia Surgery (Male Breast Reduction)',
    ],
  },
  {
    name: 'Surgical — Body',
    description: 'Body contouring, liposuction, and post-weight-loss surgical procedures',
    treatments: [
      'Tummy Tuck (Abdominoplasty)', 'Mini Tummy Tuck', 'Extended Tummy Tuck',
      'Liposuction', 'VASER Liposuction', 'Brazilian Butt Lift (BBL)',
      'Buttock Augmentation (Implants)', 'Body Lift (Belt Lipectomy)',
      'Arm Lift (Brachioplasty)', 'Thigh Lift', 'Mommy Makeover',
      'Labiaplasty', 'Vaginoplasty', 'Panniculectomy', 'Calf Augmentation', 'Monsplasty',
    ],
  },
  {
    name: 'Surgical — Hair',
    description: 'Hair restoration and transplant procedures',
    treatments: [
      'Hair Transplant (FUE)', 'Hair Transplant (FUT/Strip)', 'Eyebrow Transplant',
    ],
  },
  {
    name: 'Injectables & Fillers',
    description: 'Botox, dermal fillers, neuromodulators, and non-surgical enhancements',
    treatments: [
      'Botox (Botulinum Toxin)', 'Dysport', 'Xeomin', 'Jeuveau (Newtox)', 'Daxxify',
      'Dermal Fillers (Hyaluronic Acid)', 'Lip Fillers', 'Cheek Fillers', 'Jawline Fillers',
      'Under Eye Fillers (Tear Trough)', 'Chin Fillers', 'Temple Fillers',
      'Hand Rejuvenation (Fillers)', 'Sculptra (Poly-L-Lactic Acid)', 'Radiesse',
      'Kybella (Deoxycholic Acid)', 'Liquid Facelift', 'Liquid Rhinoplasty',
      'PDO Thread Lift', 'PRP Therapy (Platelet-Rich Plasma)', 'PRP for Hair Loss',
    ],
  },
  {
    name: 'Skin Treatments & Facials',
    description: 'Peels, microneedling, facials, and skin condition treatments',
    treatments: [
      'Chemical Peel (Light)', 'Chemical Peel (Medium/Deep)', 'Microneedling',
      'Microneedling with PRP (Vampire Facial)', 'Microdermabrasion', 'HydraFacial',
      'Dermaplaning', 'Oxygen Facial', 'LED Light Therapy', 'Acne Treatment Program',
      'Acne Scar Treatment', 'Rosacea Treatment', 'Melasma Treatment',
      'Pigmentation Treatment', 'Scar Treatment', 'Stretch Mark Treatment',
      'Skin Tag Removal', 'Mole Removal',
    ],
  },
  {
    name: 'Laser & Energy',
    description: 'Laser resurfacing, IPL, radiofrequency, and energy-based treatments',
    treatments: [
      'Laser Skin Resurfacing', 'Fractional CO2 Laser', 'Fraxel Laser', 'IPL Photofacial',
      'BBL (BroadBand Light)', 'Laser Hair Removal', 'Laser Tattoo Removal',
      'Laser Vein Treatment', 'Morpheus8', 'Radiofrequency Skin Tightening',
      'Ultherapy', 'Thermage', 'Photodynamic Therapy (PDT)', 'Laser Genesis',
      'Clear + Brilliant', 'Halo Laser',
    ],
  },
  {
    name: 'Body Contouring (Non-Surgical)',
    description: 'CoolSculpting, EMSculpt, and other non-invasive body shaping treatments',
    treatments: [
      'CoolSculpting (Cryolipolysis)', 'EMSculpt / EMSculpt NEO', 'SculpSure',
      'truSculpt', 'Vanquish ME', 'CoolTone', 'Cellulite Treatment', 'Exilis Ultra',
    ],
  },
  {
    name: 'Vein & Vascular',
    description: 'Spider vein, varicose vein, and vascular treatments',
    treatments: [
      'Sclerotherapy', 'Spider Vein Treatment', 'Varicose Vein Treatment',
      'Broken Blood Vessel Treatment',
    ],
  },
  {
    name: 'Wellness & Regenerative',
    description: 'IV therapy, weight management, hormone therapy, and regenerative medicine',
    treatments: [
      'IV Therapy / Vitamin Infusion', 'Vitamin B12 Injections', 'Biotin Injections',
      'Weight Management Program', 'Semaglutide / GLP-1 Weight Loss',
      'Tirzepatide Weight Loss', 'Hormone Replacement Therapy (HRT)',
      'Testosterone Replacement Therapy (TRT)', 'Exosome Therapy', 'Stem Cell Therapy',
      'NAD+ IV Therapy', 'Glutathione Injections',
    ],
  },
  {
    name: 'Sexual Wellness',
    description: 'Vaginal rejuvenation, PRP shots, and sexual health treatments',
    treatments: [
      'Vaginal Rejuvenation (Non-Surgical)', 'O-Shot (Orgasm Shot)',
      'P-Shot (Priapus Shot)', 'Penile Enhancement',
    ],
  },
  {
    name: 'Dental & Smile',
    description: 'Cosmetic dentistry and smile enhancement treatments',
    treatments: [
      'Teeth Whitening', 'Dental Veneers', 'Gum Contouring',
    ],
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ServiceCategoriesPage() {
  const [enabledServices, setEnabledServices] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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

      const { data: services } = await supabase
        .from('services')
        .select('name')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true);

      setEnabledServices(
        new Set((services ?? []).map((s) => s.name.toLowerCase()))
      );
      setLoading(false);
    }

    load();
  }, [supabase]);

  const totalEnabled = enabledServices.size;
  const totalTreatments = STANDARD_CATEGORIES.reduce(
    (sum, cat) => sum + cat.treatments.length,
    0
  );

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Service Categories
        </h1>
        <p className="text-muted-foreground">
          Standardized categories used across all practices for consistent reporting
        </p>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="text-sm px-3 py-1">
          <Tag className="h-3.5 w-3.5 mr-1.5" />
          {STANDARD_CATEGORIES.length} categories
        </Badge>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
          {totalEnabled} of {totalTreatments} treatments enabled
        </Badge>
      </div>

      {/* Categories */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STANDARD_CATEGORIES.map((cat) => {
          const enabledInCat = cat.treatments.filter((t) =>
            enabledServices.has(t.toLowerCase())
          ).length;
          const allEnabled = enabledInCat === cat.treatments.length;
          const someEnabled = enabledInCat > 0;

          return (
            <Card
              key={cat.name}
              className={
                someEnabled
                  ? 'ring-1 ring-indigo-200 bg-indigo-50/30'
                  : ''
              }
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold leading-tight">
                      {cat.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                      {cat.description}
                    </p>
                  </div>
                  <Badge
                    variant={someEnabled ? 'default' : 'outline'}
                    className={`shrink-0 text-xs ${
                      allEnabled
                        ? 'bg-green-600 hover:bg-green-600'
                        : someEnabled
                        ? 'bg-indigo-500 hover:bg-indigo-500'
                        : ''
                    }`}
                  >
                    {enabledInCat}/{cat.treatments.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Separator className="mb-2.5" />
                <div className="space-y-1">
                  {cat.treatments.map((treatment) => {
                    const isEnabled = enabledServices.has(
                      treatment.toLowerCase()
                    );
                    return (
                      <div
                        key={treatment}
                        className="flex items-center gap-2 py-0.5"
                      >
                        {isEnabled ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                        )}
                        <span
                          className={`text-xs leading-tight ${
                            isEnabled
                              ? 'text-foreground font-medium'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {treatment}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
