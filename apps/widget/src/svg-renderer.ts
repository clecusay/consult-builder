import type { BodyAnchor } from './svg-data';
import {
  HIGHLIGHT_RADII,
  FEMALE_ANCHORS, MALE_ANCHORS,
  FEMALE_BACK_ANCHORS, MALE_BACK_ANCHORS,
  FACE_ANCHORS,
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
): SafeHTML {
  const isActive = anchor.regionSlugs.some(s => activeSlugs.has(s));
  if (!isActive) return html``;

  const isSelected = anchor.regionSlugs.some(s => selectedSlugs.has(s));
  const r = HIGHLIGHT_RADII[anchor.id] || 120;
  const circleR = isFace ? 55 : 45;
  const labelX = anchor.labelSide === 'right' ? anchor.x + circleR + 20 : anchor.x - circleR - 20;
  const ta = anchor.labelSide === 'right' ? 'start' : 'end';
  const s = isSelected ? circleR * 0.85 : circleR * 0.75;
  const hitR = Math.max(circleR + 20, 65);
  const strokeW = isFace ? 5 : 4;
  const fontSize = isFace ? 55 : 44;

  return html`
    <g class="tb-anchor" data-anchor-slugs="${anchor.regionSlugs.join(',')}" style="cursor:pointer">
      ${isSelected ? html`
        <circle cx="${anchor.x}" cy="${anchor.y}" r="${r}" fill="${primaryColor}" opacity=".12"/>
        <circle cx="${anchor.x}" cy="${anchor.y}" r="${r}" fill="none" stroke="${primaryColor}" stroke-width="5" opacity=".3"/>
      ` : false}
      ${!isSelected ? html`
        <circle cx="${anchor.x}" cy="${anchor.y}" r="${circleR + 12}" fill="${primaryColor}" opacity=".08">
          <animate attributeName="opacity" values=".08;.18;.08" dur="2.5s" repeatCount="indefinite"/>
        </circle>
      ` : false}
      <circle cx="${anchor.x}" cy="${anchor.y}" r="${circleR}"
        fill="${isSelected ? primaryColor : '#fff'}"
        stroke="${primaryColor}"
        stroke-width="${isSelected ? 0 : strokeW}"
        filter="url(#tb-shadow)"/>
      ${isSelected
        ? raw(`<svg x="${anchor.x - s / 2}" y="${anchor.y - s / 2}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`)
        : raw(`<svg x="${anchor.x - s / 2}" y="${anchor.y - s / 2}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${primaryColor}" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`)}
      <text x="${labelX}" y="${anchor.y + 14}" text-anchor="${ta}" font-size="${fontSize}" font-weight="600" fill="#334155" opacity="0" class="tb-anchor-label">${anchor.label}</text>
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

  return html`
    <svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
      <defs><filter id="tb-shadow"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity=".1"/></filter></defs>
      <path d="${raw(silhouette)}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="4" filter="url(#tb-shadow)"/>
      ${anchors.map(a => renderAnchor(a, selectedSlugs, activeSlugs, primaryColor, false))}
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

  return html`
    <svg viewBox="${faceVB}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
      <defs>
        <filter id="tb-fshadow"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity=".1"/></filter>
        <filter id="tb-shadow"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity=".1"/></filter>
      </defs>
      <path d="${raw(facePath)}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="4" filter="url(#tb-fshadow)"/>
      ${FACE_ZONE_LINES.map(line =>
        html`<line x1="272" y1="${line.y}" x2="1280" y2="${line.y}" stroke="#e2e8f0" stroke-width="4" stroke-dasharray="16 12"/>`
      )}
      ${FACE_ANCHORS.map(a => renderAnchor(a, selectedSlugs, activeSlugs, primaryColor, true))}
      ${raw('<style>.tb-anchor:hover .tb-anchor-label{opacity:1!important}</style>')}
    </svg>`;
}
