'use client';

import { useState } from 'react';
import { FEMALE_SILHOUETTE_PATH, MALE_SILHOUETTE_PATH } from './silhouette-paths';

// ── Anchor definitions ──────────────────────────────────────────────────────

export interface BodyAnchor {
  id: string;
  label: string;
  x: number;
  y: number;
  labelSide: 'left' | 'right';
  regionSlugs: string[];
}

// Female silhouette is 200 x 665 — one anchor per region, no bilateral duplicates
const FEMALE_ANCHORS: BodyAnchor[] = [
  { id: 'face', label: 'Face', x: 100, y: 25, labelSide: 'right', regionSlugs: ['upper-face', 'midface', 'lower-face', 'lips'] },
  { id: 'neck', label: 'Neck', x: 100, y: 88, labelSide: 'right', regionSlugs: ['neck'] },
  { id: 'chest', label: 'Chest', x: 135, y: 150, labelSide: 'right', regionSlugs: ['chest'] },
  { id: 'arms', label: 'Arms', x: 27, y: 245, labelSide: 'left', regionSlugs: ['arms'] },
  { id: 'abdomen', label: 'Abdomen', x: 100, y: 260, labelSide: 'right', regionSlugs: ['abdomen'] },
  { id: 'flanks', label: 'Flanks', x: 42, y: 215, labelSide: 'left', regionSlugs: ['flanks'] },
  { id: 'hands', label: 'Hands', x: 10, y: 375, labelSide: 'left', regionSlugs: ['hands'] },
  { id: 'intimate', label: 'Intimate', x: 100, y: 335, labelSide: 'right', regionSlugs: ['intimate'] },
  { id: 'thighs', label: 'Thighs', x: 122, y: 440, labelSide: 'right', regionSlugs: ['thighs'] },
  { id: 'lower-legs', label: 'Lower Legs', x: 78, y: 560, labelSide: 'left', regionSlugs: ['lower-legs'] },
];

// Male silhouette is 200 x 608 — one anchor per region
const MALE_ANCHORS: BodyAnchor[] = [
  { id: 'face', label: 'Face', x: 100, y: 22, labelSide: 'right', regionSlugs: ['upper-face', 'midface', 'lower-face', 'lips'] },
  { id: 'neck', label: 'Neck', x: 100, y: 82, labelSide: 'right', regionSlugs: ['neck'] },
  { id: 'chest', label: 'Chest', x: 138, y: 142, labelSide: 'right', regionSlugs: ['chest'] },
  { id: 'arms', label: 'Arms', x: 22, y: 228, labelSide: 'left', regionSlugs: ['arms'] },
  { id: 'abdomen', label: 'Abdomen', x: 100, y: 245, labelSide: 'right', regionSlugs: ['abdomen'] },
  { id: 'flanks', label: 'Flanks', x: 38, y: 205, labelSide: 'left', regionSlugs: ['flanks'] },
  { id: 'hands', label: 'Hands', x: 8, y: 348, labelSide: 'left', regionSlugs: ['hands'] },
  { id: 'thighs', label: 'Thighs', x: 125, y: 408, labelSide: 'right', regionSlugs: ['thighs'] },
  { id: 'lower-legs', label: 'Lower Legs', x: 75, y: 520, labelSide: 'left', regionSlugs: ['lower-legs'] },
];

// Region-appropriate highlight radii
function getHighlightRadius(anchorId: string): number {
  switch (anchorId) {
    case 'face': return 30;
    case 'neck': return 22;
    case 'chest': return 40;
    case 'abdomen': return 38;
    case 'flanks': return 28;
    case 'arms': return 32;
    case 'hands': return 22;
    case 'intimate': return 28;
    case 'thighs': return 45;
    case 'lower-legs': return 40;
    default: return 30;
  }
}

// ── Component ───────────────────────────────────────────────────────────────

interface BodySilhouetteProps {
  gender: 'female' | 'male';
  selectedRegionSlugs: Set<string>;
  activeRegionSlugs: Set<string>;
  onAnchorClick: (regionSlugs: string[]) => void;
  onAnchorHover?: (anchorId: string | null) => void;
  onFaceClick?: () => void;
  primaryColor?: string;
}

export function BodySilhouette({
  gender,
  selectedRegionSlugs,
  activeRegionSlugs,
  onAnchorClick,
  onAnchorHover,
  onFaceClick,
  primaryColor = '#e84393',
}: BodySilhouetteProps) {
  const path = gender === 'female' ? FEMALE_SILHOUETTE_PATH : MALE_SILHOUETTE_PATH;
  const anchors = gender === 'female' ? FEMALE_ANCHORS : MALE_ANCHORS;
  const viewBoxH = gender === 'female' ? 685 : 628;

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Only show anchors whose region slugs match active (configured) regions
  const visibleAnchors = anchors.filter((a) =>
    a.regionSlugs.some((slug) => activeRegionSlugs.has(slug))
  );

  function handleMouseEnter(anchorId: string) {
    setHoveredId(anchorId);
    onAnchorHover?.(anchorId);
  }

  function handleMouseLeave() {
    setHoveredId(null);
    onAnchorHover?.(null);
  }

  return (
    <svg
      viewBox={`-15 -15 230 ${viewBoxH}`}
      className="h-full w-full"
      style={{ maxHeight: 600 }}
    >
      <defs>
        {/* Drop shadow filter */}
        <filter id="anchor-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.1" />
        </filter>

        {/* Pulse animation for unselected anchors */}
        <style>{`
          @keyframes anchorPulse {
            0%, 100% { r: 11; opacity: 0.08; }
            50% { r: 15; opacity: 0.18; }
          }
        `}</style>
      </defs>

      {/* Body outline */}
      <path
        d={path}
        fill="#faf5f5"
        stroke={primaryColor}
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        fillRule="evenodd"
        opacity="0.9"
      />

      {/* Anchor buttons */}
      {visibleAnchors.map((anchor, index) => {
        const isSelected = anchor.regionSlugs.some((s) => selectedRegionSlugs.has(s));
        const labelX = anchor.labelSide === 'right' ? anchor.x + 18 : anchor.x - 18;
        const textAnchor = anchor.labelSide === 'right' ? 'start' : 'end';
        const isHovered = hoveredId === anchor.id;

        return (
          <g
            key={anchor.id}
            className="cursor-pointer"
            onClick={() => {
              if (anchor.id === 'face' && onFaceClick) {
                onFaceClick();
              } else {
                onAnchorClick(anchor.regionSlugs);
              }
            }}
            onMouseEnter={() => handleMouseEnter(anchor.id)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Pulse glow on unselected, active anchors */}
            {!isSelected && (
              <circle
                cx={anchor.x}
                cy={anchor.y}
                r="11"
                fill={primaryColor}
                style={{
                  animation: `anchorPulse 2.5s ease-in-out ${index * 0.3}s infinite`,
                }}
              />
            )}

            {/* Hover highlight — radial glow centered on anchor */}
            {isHovered && !isSelected && (
              <circle
                cx={anchor.x}
                cy={anchor.y}
                r={getHighlightRadius(anchor.id)}
                fill={primaryColor}
                opacity="0.1"
                style={{ transition: 'opacity 0.2s ease' }}
              />
            )}

            {/* Outer glow when selected */}
            {isSelected && (
              <circle
                cx={anchor.x}
                cy={anchor.y}
                r="16"
                fill={primaryColor}
                opacity="0.15"
              />
            )}

            {/* Circle background */}
            <circle
              cx={anchor.x}
              cy={anchor.y}
              r="11"
              fill={isSelected ? primaryColor : 'white'}
              stroke={isSelected ? primaryColor : '#e2e8f0'}
              strokeWidth={isSelected ? '2' : '1.5'}
              className="transition-all duration-150"
              filter="url(#anchor-shadow)"
            />

            {/* Selected: white checkmark */}
            {isSelected ? (
              <path
                d={`M${anchor.x - 4} ${anchor.y} l3 3 5-6`}
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <>
                {/* Plus icon (horizontal) */}
                <line
                  x1={anchor.x - 4}
                  y1={anchor.y}
                  x2={anchor.x + 4}
                  y2={anchor.y}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Plus icon (vertical) */}
                <line
                  x1={anchor.x}
                  y1={anchor.y - 4}
                  x2={anchor.x}
                  y2={anchor.y + 4}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Hover label */}
            <text
              x={labelX}
              y={anchor.y + 1}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              fill="#475569"
              fontSize="9"
              fontWeight="600"
              fontFamily="system-ui, sans-serif"
              style={{ opacity: isHovered || isSelected ? 1 : 0, transition: 'opacity 0.15s ease' }}
            >
              {anchor.label}
            </text>

            {/* Hover target (larger invisible circle) */}
            <circle
              cx={anchor.x}
              cy={anchor.y}
              r="16"
              fill="transparent"
            />
          </g>
        );
      })}
    </svg>
  );
}

export { FEMALE_ANCHORS, MALE_ANCHORS };

// ── Face Silhouette ──────────────────────────────────────────────────────

interface FaceAnchor {
  id: string;
  label: string;
  x: number;
  y: number;
  labelSide: 'left' | 'right';
  regionSlug: string;
}

const FACE_ANCHORS: FaceAnchor[] = [
  { id: 'upper-face', label: 'Upper Face', x: 100, y: 65, labelSide: 'right', regionSlug: 'upper-face' },
  { id: 'midface', label: 'Midface', x: 100, y: 135, labelSide: 'right', regionSlug: 'midface' },
  { id: 'lips', label: 'Lips', x: 100, y: 195, labelSide: 'right', regionSlug: 'lips' },
  { id: 'lower-face', label: 'Lower Face', x: 100, y: 235, labelSide: 'right', regionSlug: 'lower-face' },
];

// Simple face outline path — oval head shape with jawline
const FACE_OUTLINE_PATH =
  'M100 10 C55 10, 25 55, 25 105 C25 145, 30 175, 45 205 C55 225, 70 248, 85 260 Q100 270, 115 260 C130 248, 145 225, 155 205 C170 175, 175 145, 175 105 C175 55, 145 10, 100 10 Z';

// Ear paths
const LEFT_EAR_PATH = 'M25 100 C18 100, 12 110, 12 125 C12 140, 18 150, 25 150';
const RIGHT_EAR_PATH = 'M175 100 C182 100, 188 110, 188 125 C188 140, 182 150, 175 150';

function getFaceHighlightRadius(anchorId: string): number {
  switch (anchorId) {
    case 'upper-face': return 35;
    case 'midface': return 35;
    case 'lips': return 25;
    case 'lower-face': return 25;
    default: return 30;
  }
}

interface FaceSilhouetteProps {
  selectedRegionSlugs: Set<string>;
  activeRegionSlugs: Set<string>;
  onAnchorClick: (regionSlugs: string[]) => void;
  onAnchorHover?: (anchorId: string | null) => void;
  primaryColor?: string;
}

export function FaceSilhouette({
  selectedRegionSlugs,
  activeRegionSlugs,
  onAnchorClick,
  onAnchorHover,
  primaryColor = '#e84393',
}: FaceSilhouetteProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const visibleAnchors = FACE_ANCHORS.filter((a) => activeRegionSlugs.has(a.regionSlug));

  function handleMouseEnter(anchorId: string) {
    setHoveredId(anchorId);
    onAnchorHover?.(anchorId);
  }

  function handleMouseLeave() {
    setHoveredId(null);
    onAnchorHover?.(null);
  }

  return (
    <svg
      viewBox="-5 -5 210 285"
      className="h-full w-full"
      style={{ maxHeight: 500 }}
    >
      <defs>
        <filter id="face-anchor-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.1" />
        </filter>
        <style>{`
          @keyframes faceAnchorPulse {
            0%, 100% { r: 11; opacity: 0.08; }
            50% { r: 15; opacity: 0.18; }
          }
        `}</style>
      </defs>

      {/* Face outline */}
      <path
        d={FACE_OUTLINE_PATH}
        fill="#faf5f5"
        stroke={primaryColor}
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Ears */}
      <path d={LEFT_EAR_PATH} fill="none" stroke={primaryColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
      <path d={RIGHT_EAR_PATH} fill="none" stroke={primaryColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />

      {/* Subtle zone dividers */}
      <line x1="40" y1="100" x2="160" y2="100" stroke={primaryColor} strokeWidth="0.5" opacity="0.2" strokeDasharray="4 3" />
      <line x1="45" y1="165" x2="155" y2="165" stroke={primaryColor} strokeWidth="0.5" opacity="0.2" strokeDasharray="4 3" />
      <line x1="55" y1="215" x2="145" y2="215" stroke={primaryColor} strokeWidth="0.5" opacity="0.2" strokeDasharray="4 3" />

      {/* Anchor buttons */}
      {visibleAnchors.map((anchor, index) => {
        const isSelected = selectedRegionSlugs.has(anchor.regionSlug);
        const labelX = anchor.labelSide === 'right' ? anchor.x + 18 : anchor.x - 18;
        const textAnchor = anchor.labelSide === 'right' ? 'start' : 'end';
        const isHovered = hoveredId === anchor.id;

        return (
          <g
            key={anchor.id}
            className="cursor-pointer"
            onClick={() => onAnchorClick([anchor.regionSlug])}
            onMouseEnter={() => handleMouseEnter(anchor.id)}
            onMouseLeave={handleMouseLeave}
          >
            {!isSelected && (
              <circle
                cx={anchor.x}
                cy={anchor.y}
                r="11"
                fill={primaryColor}
                style={{
                  animation: `faceAnchorPulse 2.5s ease-in-out ${index * 0.3}s infinite`,
                }}
              />
            )}

            {isHovered && !isSelected && (
              <circle
                cx={anchor.x}
                cy={anchor.y}
                r={getFaceHighlightRadius(anchor.id)}
                fill={primaryColor}
                opacity="0.1"
                style={{ transition: 'opacity 0.2s ease' }}
              />
            )}

            {isSelected && (
              <circle
                cx={anchor.x}
                cy={anchor.y}
                r="16"
                fill={primaryColor}
                opacity="0.15"
              />
            )}

            <circle
              cx={anchor.x}
              cy={anchor.y}
              r="11"
              fill={isSelected ? primaryColor : 'white'}
              stroke={isSelected ? primaryColor : '#e2e8f0'}
              strokeWidth={isSelected ? '2' : '1.5'}
              className="transition-all duration-150"
              filter="url(#face-anchor-shadow)"
            />

            {isSelected ? (
              <path
                d={`M${anchor.x - 4} ${anchor.y} l3 3 5-6`}
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <>
                <line
                  x1={anchor.x - 4} y1={anchor.y}
                  x2={anchor.x + 4} y2={anchor.y}
                  stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"
                />
                <line
                  x1={anchor.x} y1={anchor.y - 4}
                  x2={anchor.x} y2={anchor.y + 4}
                  stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"
                />
              </>
            )}

            <text
              x={labelX}
              y={anchor.y + 1}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              fill="#475569"
              fontSize="9"
              fontWeight="600"
              fontFamily="system-ui, sans-serif"
              style={{ opacity: isHovered || isSelected ? 1 : 0, transition: 'opacity 0.15s ease' }}
            >
              {anchor.label}
            </text>

            <circle cx={anchor.x} cy={anchor.y} r="16" fill="transparent" />
          </g>
        );
      })}
    </svg>
  );
}
