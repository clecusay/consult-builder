/**
 * Treatment Builder — Content Data
 * Pain points, outcomes, and barriers mapped to body region slugs.
 */

export interface TBOption {
  id: string;
  label: string;
}

// ── Pain Points (Step 2) ──
// Mapped by region slug → emotional impact statements

const GENERAL_PAIN_POINTS: TBOption[] = [
  { id: 'pp-avoid-photos', label: "I avoid photos and video calls" },
  { id: 'pp-older-than-feel', label: "I feel older than I am" },
  { id: 'pp-self-conscious-social', label: "I'm self-conscious in social settings" },
  { id: 'pp-dont-feel-like-me', label: "I don't feel like myself when I look in the mirror" },
  { id: 'pp-avoid-activities', label: "I avoid certain activities" },
  { id: 'pp-confidence-dropped', label: "My confidence has dropped over time" },
];

const PAIN_POINTS_BY_REGION: Record<string, TBOption[]> = {
  'upper-face': [
    { id: 'pp-forehead-lines', label: "Forehead lines make me look tired or stressed" },
    { id: 'pp-brow-drooping', label: "My brows have dropped and I look angry or sad" },
    { id: 'pp-frown-lines', label: "People ask if I'm upset because of my frown lines" },
  ],
  'midface': [
    { id: 'pp-under-eye', label: "Under-eye bags make me look exhausted" },
    { id: 'pp-cheek-volume', label: "I've lost volume in my cheeks" },
    { id: 'pp-nose-shape', label: "I'm self-conscious about my nose shape" },
  ],
  'lower-face': [
    { id: 'pp-jowls', label: "Jowls or sagging along my jawline bother me" },
    { id: 'pp-double-chin', label: "I'm bothered by a double chin" },
    { id: 'pp-smile-lines', label: "Deep smile lines make me look older" },
  ],
  'lips': [
    { id: 'pp-thin-lips', label: "My lips are thinner than I'd like" },
    { id: 'pp-lip-lines', label: "Lines around my lips bother me" },
    { id: 'pp-lip-symmetry', label: "My lips look uneven or asymmetric" },
  ],
  'neck': [
    { id: 'pp-neck-bands', label: "Neck bands or lines are visible" },
    { id: 'pp-neck-sagging', label: "Sagging skin on my neck bothers me" },
    { id: 'pp-turkey-neck', label: "I avoid certain necklines because of my neck" },
  ],
  'chest': [
    { id: 'pp-chest-uncomfortable', label: "I'm uncomfortable in fitted clothing" },
    { id: 'pp-chest-self-conscious', label: "I feel self-conscious at the beach or pool" },
    { id: 'pp-chest-proportion', label: "I feel out of proportion" },
    { id: 'pp-chest-posture', label: "It affects my posture and comfort" },
  ],
  'abdomen': [
    { id: 'pp-hide-body', label: "I hide my body in loose clothing" },
    { id: 'pp-post-pregnancy', label: "I've lost confidence after pregnancy or weight change" },
    { id: 'pp-exercise-not-enough', label: "Exercise and diet haven't been enough" },
    { id: 'pp-midsection', label: "I avoid form-fitting clothes because of my midsection" },
  ],
  'arms': [
    { id: 'pp-arm-sleeves', label: "I always wear long sleeves to cover my arms" },
    { id: 'pp-arm-wave', label: "I'm self-conscious when waving or raising my arms" },
    { id: 'pp-arm-skin', label: "Loose or sagging skin on my arms bothers me" },
  ],
  'flanks': [
    { id: 'pp-love-handles', label: "Love handles show through my clothes" },
    { id: 'pp-flanks-stubborn', label: "Stubborn fat around my sides won't go away" },
  ],
  'back': [
    { id: 'pp-back-fat', label: "Back fat shows through tops and bras" },
    { id: 'pp-back-rolls', label: "Rolls on my back make me self-conscious" },
  ],
  'buttocks': [
    { id: 'pp-flat-butt', label: "I feel my buttocks are flat or shapeless" },
    { id: 'pp-butt-clothes', label: "I can't find clothes that fit the way I want" },
    { id: 'pp-butt-sagging', label: "Sagging in this area bothers me" },
  ],
  'thighs': [
    { id: 'pp-thigh-rub', label: "Inner thigh chafing or rubbing is uncomfortable" },
    { id: 'pp-thigh-cellulite', label: "Cellulite or dimpling on my thighs bothers me" },
    { id: 'pp-thigh-shape', label: "I'm unhappy with the shape of my thighs" },
  ],
  'lower-legs': [
    { id: 'pp-calf-shape', label: "I'm unhappy with my calf shape or size" },
    { id: 'pp-leg-veins', label: "Visible veins on my legs bother me" },
  ],
  'hands': [
    { id: 'pp-aging-hands', label: "My hands look older than the rest of me" },
    { id: 'pp-hand-veins', label: "Prominent veins make my hands look aged" },
  ],
  'intimate': [
    { id: 'pp-intimate-discomfort', label: "I experience physical discomfort" },
    { id: 'pp-intimate-confidence', label: "It affects my confidence and intimacy" },
  ],
};

// ── Outcomes (Step 3) ──

const GENERAL_OUTCOMES: TBOption[] = [
  { id: 'out-confident-outfit', label: "Feel confident in any outfit" },
  { id: 'out-look-forward-events', label: "Look forward to photos and events" },
  { id: 'out-feel-like-me', label: "Feel like myself again" },
  { id: 'out-stop-worrying', label: "Stop worrying about how I look" },
  { id: 'out-more-energy', label: "Feel more vibrant and energetic" },
];

const OUTCOMES_BY_REGION: Record<string, TBOption[]> = {
  'upper-face': [
    { id: 'out-smooth-forehead', label: "Have a smooth, relaxed forehead" },
    { id: 'out-bright-eyes', label: "Look as rested and bright as I feel" },
  ],
  'midface': [
    { id: 'out-youthful-cheeks', label: "Restore youthful volume to my face" },
    { id: 'out-refreshed-look', label: "Look refreshed without looking 'done'" },
  ],
  'lower-face': [
    { id: 'out-defined-jawline', label: "Have a more defined jawline" },
    { id: 'out-love-mirror', label: "Love what I see in the mirror" },
  ],
  'lips': [
    { id: 'out-fuller-lips', label: "Have naturally fuller, balanced lips" },
    { id: 'out-lip-confidence', label: "Feel confident with any lipstick or smile" },
  ],
  'neck': [
    { id: 'out-smooth-neck', label: "Have a smooth, youthful neckline" },
    { id: 'out-wear-any-neckline', label: "Wear any neckline with confidence" },
  ],
  'chest': [
    { id: 'out-proportional', label: "Feel proportional and balanced" },
    { id: 'out-swimwear', label: "Wear swimwear with confidence" },
    { id: 'out-clothes-fit', label: "Have clothes fit the way I want" },
  ],
  'abdomen': [
    { id: 'out-flat-tummy', label: "Feel comfortable and confident in my midsection" },
    { id: 'out-wear-what-want', label: "Wear what I want without hesitation" },
    { id: 'out-body-strong', label: "Feel strong and comfortable in my own skin" },
  ],
  'arms': [
    { id: 'out-sleeveless', label: "Wear sleeveless tops with confidence" },
    { id: 'out-toned-arms', label: "Feel good about the shape of my arms" },
  ],
  'flanks': [
    { id: 'out-smooth-silhouette', label: "Have a smooth, contoured silhouette" },
  ],
  'back': [
    { id: 'out-smooth-back', label: "Feel confident in backless or fitted tops" },
  ],
  'buttocks': [
    { id: 'out-butt-shape', label: "Love the shape and contour of my figure" },
    { id: 'out-butt-clothes-fit', label: "Have clothes fit and look great" },
  ],
  'thighs': [
    { id: 'out-thigh-smooth', label: "Have smoother, more contoured thighs" },
    { id: 'out-thigh-shorts', label: "Wear shorts and skirts with confidence" },
  ],
  'lower-legs': [
    { id: 'out-leg-shape', label: "Feel good about the shape of my legs" },
  ],
  'hands': [
    { id: 'out-youthful-hands', label: "Have younger-looking, smoother hands" },
  ],
  'intimate': [
    { id: 'out-intimate-comfort', label: "Feel comfortable and confident again" },
  ],
};

// ── Barriers (Step 4) ──

export const BARRIERS: TBOption[] = [
  { id: 'bar-cost', label: "Concerned about cost" },
  { id: 'bar-recovery', label: "Worried about recovery time" },
  { id: 'bar-which-procedure', label: "Not sure which procedure is right" },
  { id: 'bar-nervous', label: "Nervous about surgery" },
  { id: 'bar-right-doctor', label: "Haven't found the right doctor" },
  { id: 'bar-where-to-start', label: "Wasn't sure where to start" },
  { id: 'bar-unnatural', label: "Worried about results looking unnatural" },
  { id: 'bar-time-off', label: "Need to coordinate time off work" },
  { id: 'bar-more-info', label: "Want more information first" },
];

// ── Helpers ──

/** Get pain point options relevant to the selected region slugs */
export function getPainPoints(selectedSlugs: Set<string>): TBOption[] {
  const regionSpecific: TBOption[] = [];
  const seenIds = new Set<string>();

  for (const slug of selectedSlugs) {
    const options = PAIN_POINTS_BY_REGION[slug];
    if (options) {
      for (const opt of options) {
        if (!seenIds.has(opt.id)) {
          seenIds.add(opt.id);
          regionSpecific.push(opt);
        }
      }
    }
  }

  // Add general options that aren't dupes
  const all = [...regionSpecific];
  for (const opt of GENERAL_PAIN_POINTS) {
    if (!seenIds.has(opt.id)) {
      all.push(opt);
    }
  }

  return all;
}

/** Get outcome options relevant to the selected region slugs */
export function getOutcomes(selectedSlugs: Set<string>): TBOption[] {
  const regionSpecific: TBOption[] = [];
  const seenIds = new Set<string>();

  for (const slug of selectedSlugs) {
    const options = OUTCOMES_BY_REGION[slug];
    if (options) {
      for (const opt of options) {
        if (!seenIds.has(opt.id)) {
          seenIds.add(opt.id);
          regionSpecific.push(opt);
        }
      }
    }
  }

  const all = [...regionSpecific];
  for (const opt of GENERAL_OUTCOMES) {
    if (!seenIds.has(opt.id)) {
      all.push(opt);
    }
  }

  return all;
}
