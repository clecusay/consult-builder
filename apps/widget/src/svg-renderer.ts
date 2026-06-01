import type { BodyAnchor } from './svg-data';
import {
  HIGHLIGHT_RADII,
  FEMALE_ANCHORS, MALE_ANCHORS,
  FEMALE_BACK_ANCHORS, MALE_BACK_ANCHORS,
  FEMALE_FACE_ANCHORS, MALE_FACE_ANCHORS,
  FEMALE_BODY_VB, MALE_BODY_VB, FEMALE_FACE_VB, MALE_FACE_VB,
  FEMALE_SILHOUETTE_PATH, MALE_SILHOUETTE_PATH,
  FEMALE_BACK_SILHOUETTE_PATH, MALE_BACK_SILHOUETTE_PATH,
  FEMALE_FACE_PATH, MALE_FACE_PATH,
  FACE_ZONE_LINES,
} from './svg-data';
import { html, raw, SafeHTML } from './template';

/* ── Anchor dot + label ──────────────────────────────────── */

function renderAnchor(
  anchor: BodyAnchor,
  selectedSlugs: Set<string>,
  activeSlugs: Set<string>,
  primaryColor: string,
  isFace: boolean,
  centerX: number,
): SafeHTML {
  const isActive = anchor.regionSlugs.some(s => activeSlugs.has(s));
  if (!isActive) return html``;

  const isSelected = anchor.regionSlugs.some(s => selectedSlugs.has(s));
  const r = HIGHLIGHT_RADII[anchor.id] || 120;
  const circleR = isFace ? 50 : 60;
  // Labels wrap inward toward the centerline: markers on the right half get their
  // label on the left, and vice versa (matches the "hands" placement).
  const labelSide = anchor.x > centerX ? 'left' : 'right';
  const labelX = labelSide === 'right' ? anchor.x + circleR + 20 : anchor.x - circleR - 20;
  const ta = labelSide === 'right' ? 'start' : 'end';
  const s = isSelected ? circleR * 0.85 : circleR * 0.75;
  const hitR = Math.max(circleR + 20, 70);
  const strokeW = isFace ? 3 : 3;
  const fontSize = isFace ? 64 : 74;

  return html`
    <g class="tb-anchor" data-anchor-slugs="${anchor.regionSlugs.join(',')}" style="cursor:pointer">
      ${isSelected ? html`
        <circle cx="${anchor.x}" cy="${anchor.y}" r="${r}" fill="${primaryColor}" opacity=".06"/>
        <circle cx="${anchor.x}" cy="${anchor.y}" r="${r}" fill="none" stroke="${primaryColor}" stroke-width="2" opacity=".15"/>
      ` : false}
      ${!isSelected ? html`
        <circle cx="${anchor.x}" cy="${anchor.y}" r="${circleR + 12}" fill="${primaryColor}" opacity=".05">
          <animate attributeName="opacity" values=".05;.12;.05" dur="2.5s" repeatCount="indefinite"/>
        </circle>
      ` : false}
      <circle cx="${anchor.x}" cy="${anchor.y}" r="${circleR}"
        fill="${isSelected ? primaryColor : '#fff'}"
        stroke="${primaryColor}"
        stroke-width="${isSelected ? 0 : strokeW}"
        stroke-opacity="${isSelected ? 1 : 0.5}"
        filter="url(#tb-shadow)"/>
      ${isSelected
        ? raw(`<svg x="${anchor.x - s / 2}" y="${anchor.y - s / 2}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`)
        : raw(`<svg x="${anchor.x - s / 2}" y="${anchor.y - s / 2}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${primaryColor}" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`)}
      <text x="${labelX}" y="${anchor.y + fontSize / 3}" text-anchor="${ta}" font-size="${fontSize}" data-base-fs="${fontSize}" font-weight="600" fill="${isSelected ? primaryColor : '#3f3a32'}" stroke="#fffefa" stroke-width="3" paint-order="stroke" opacity="0" class="tb-anchor-label">${anchor.label}</text>
      <circle cx="${anchor.x}" cy="${anchor.y}" r="${hitR}" fill="transparent"/>
    </g>`;
}

/* ── Full body silhouette ────────────────────────────────── */

export function renderBodySVG(
  gender: 'female' | 'male',
  bodySide: 'front' | 'back',
  selectedSlugs: Set<string>,
  activeSlugs: Set<string>,
  primaryColor: string,
): SafeHTML {
  const isFemale = gender === 'female';
  const isFront = bodySide === 'front';
  const vb = isFemale ? FEMALE_BODY_VB : MALE_BODY_VB;
  const silhouette = isFront
    ? (isFemale ? FEMALE_SILHOUETTE_PATH : MALE_SILHOUETTE_PATH)
    : (isFemale ? FEMALE_BACK_SILHOUETTE_PATH : MALE_BACK_SILHOUETTE_PATH);
  const anchors = isFront
    ? (isFemale ? FEMALE_ANCHORS : MALE_ANCHORS)
    : (isFemale ? FEMALE_BACK_ANCHORS : MALE_BACK_ANCHORS);
  const [vbX, , vbW] = vb.split(' ').map(Number);
  const centerX = vbX + vbW / 2;

  return html`
    <svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="overflow:visible">
      <defs><filter id="tb-shadow"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity=".1"/></filter></defs>
      <path d="${raw(silhouette)}" fill="#efe8db" stroke="#a89d8a" stroke-width="4" filter="url(#tb-shadow)"/>
      ${anchors.map(a => renderAnchor(a, selectedSlugs, activeSlugs, primaryColor, false, centerX))}
      ${raw('<style>.tb-anchor:hover .tb-anchor-label{opacity:1!important}</style>')}
    </svg>`;
}

/* ── Face diagram ────────────────────────────────────────── */

export function renderFaceSVG(
  gender: 'female' | 'male',
  selectedSlugs: Set<string>,
  activeSlugs: Set<string>,
  primaryColor: string,
): SafeHTML {
  const isFemale = gender === 'female';
  const faceVB = isFemale ? FEMALE_FACE_VB : MALE_FACE_VB;
  const facePath = isFemale ? FEMALE_FACE_PATH : MALE_FACE_PATH;
  const faceAnchors = isFemale ? FEMALE_FACE_ANCHORS : MALE_FACE_ANCHORS;

  // Inset the zone divider lines to ~4% of the visible viewBox width.
  const [vbX, , vbW] = faceVB.split(' ').map(Number);
  const zoneX1 = Math.round(vbX + vbW * 0.04);
  const zoneX2 = Math.round(vbX + vbW * 0.96);

  return html`
    <svg viewBox="${faceVB}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="overflow:visible">
      <defs>
        <filter id="tb-fshadow"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity=".1"/></filter>
        <filter id="tb-shadow"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity=".1"/></filter>
      </defs>
      <path d="${raw(facePath)}" fill="#efe8db" stroke="#a89d8a" stroke-width="4" filter="url(#tb-fshadow)"/>
      ${FACE_ZONE_LINES.map(line =>
        html`<line x1="${zoneX1}" y1="${line.y}" x2="${zoneX2}" y2="${line.y}" stroke="#e9e0d2" stroke-width="4" stroke-dasharray="16 12"/>`
      )}
      ${/* Face anchors sit on the centerline — keep labels to the right. */ ''}
      ${faceAnchors.map(a => renderAnchor(a, selectedSlugs, activeSlugs, primaryColor, true, Number.POSITIVE_INFINITY))}
      ${raw('<style>.tb-anchor:hover .tb-anchor-label{opacity:1!important}</style>')}
    </svg>`;
}
