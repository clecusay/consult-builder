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
  { id: 'neck', label: 'Neck', x: 100, y: 78, labelSide: 'right', regionSlugs: ['neck'] },
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
  { id: 'neck', label: 'Neck', x: 100, y: 72, labelSide: 'right', regionSlugs: ['neck'] },
  { id: 'chest', label: 'Chest', x: 138, y: 142, labelSide: 'right', regionSlugs: ['chest'] },
  { id: 'arms', label: 'Arms', x: 22, y: 228, labelSide: 'left', regionSlugs: ['arms'] },
  { id: 'abdomen', label: 'Abdomen', x: 100, y: 245, labelSide: 'right', regionSlugs: ['abdomen'] },
  { id: 'flanks', label: 'Flanks', x: 38, y: 205, labelSide: 'left', regionSlugs: ['flanks'] },
  { id: 'hands', label: 'Hands', x: 8, y: 348, labelSide: 'left', regionSlugs: ['hands'] },
  { id: 'thighs', label: 'Thighs', x: 125, y: 408, labelSide: 'right', regionSlugs: ['thighs'] },
  { id: 'lower-legs', label: 'Lower Legs', x: 75, y: 520, labelSide: 'left', regionSlugs: ['lower-legs'] },
];

// ── Component ───────────────────────────────────────────────────────────────

interface BodySilhouetteProps {
  gender: 'female' | 'male';
  selectedRegionSlugs: Set<string>;
  activeRegionSlugs: Set<string>;
  onAnchorClick: (regionSlugs: string[]) => void;
  primaryColor?: string;
}

export function BodySilhouette({
  gender,
  selectedRegionSlugs,
  activeRegionSlugs,
  onAnchorClick,
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

  return (
    <svg
      viewBox={`-15 -15 230 ${viewBoxH}`}
      className="h-full w-full"
      style={{ maxHeight: 600 }}
    >
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
      {visibleAnchors.map((anchor) => {
        const isSelected = anchor.regionSlugs.some((s) => selectedRegionSlugs.has(s));
        const labelX = anchor.labelSide === 'right' ? anchor.x + 18 : anchor.x - 18;
        const textAnchor = anchor.labelSide === 'right' ? 'start' : 'end';

        const isHovered = hoveredId === anchor.id;

        return (
          <g
            key={anchor.id}
            className="cursor-pointer"
            onClick={() => onAnchorClick(anchor.regionSlugs)}
            onMouseEnter={() => setHoveredId(anchor.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
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
              fill="white"
              stroke={isSelected ? primaryColor : '#e2e8f0'}
              strokeWidth={isSelected ? '2' : '1.5'}
              className="transition-all duration-150"
              filter="url(#anchor-shadow)"
            />

            {/* Plus icon */}
            <line
              x1={anchor.x - 4}
              y1={anchor.y}
              x2={anchor.x + 4}
              y2={anchor.y}
              stroke={isSelected ? primaryColor : '#94a3b8'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1={anchor.x}
              y1={anchor.y - 4}
              x2={anchor.x}
              y2={anchor.y + 4}
              stroke={isSelected ? primaryColor : '#94a3b8'}
              strokeWidth="2"
              strokeLinecap="round"
            />

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

      {/* Drop shadow filter */}
      <defs>
        <filter id="anchor-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.1" />
        </filter>
      </defs>
    </svg>
  );
}

export { FEMALE_ANCHORS, MALE_ANCHORS };
