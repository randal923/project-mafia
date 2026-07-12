"use client";

import { CITY_GRID_COLUMNS, CITY_GRID_ROWS } from "@shared/cityMap";
import { DISTRICTS, type DistrictId } from "@shared/district";
import type { TurfState } from "@shared/territory";
import { useState } from "react";

/**
 * The city as a street map: paper-gray blocks cut by streets, wider
 * avenues along district lines, a harbor along the Docks — and family
 * colors as the only color on the page. Every irregularity is a
 * deterministic hash of turf ids and lattice points, so the map is
 * stable across renders and identical for every player.
 */

const CELL = 100;
const STREET = 9;
const AVENUE = 24;
const PADDING = 26;
const WATERFRONT = 52;
const LABEL_BAND = 8;

/** Columns after which a vertical avenue runs (district seam). */
const AVENUE_AFTER_COLUMN = new Set([4]);
/** Rows after which a horizontal avenue runs (district seams). */
const AVENUE_AFTER_ROW = new Set([1, 3, 5]);

/** Cumulative x of each lattice column 0..10 and y of each row 0..7. */
function latticePositions(
  count: number,
  avenueAfter: Set<number>,
): number[] {
  const positions = [PADDING];
  for (let i = 0; i < count; i += 1) {
    const gap = i === count - 1 ? 0 : avenueAfter.has(i) ? AVENUE : STREET;
    positions.push(positions[i]! + CELL + gap);
  }
  return positions;
}

const X = latticePositions(CITY_GRID_COLUMNS, AVENUE_AFTER_COLUMN);
const Y = latticePositions(CITY_GRID_ROWS, AVENUE_AFTER_ROW);

const WIDTH = X[CITY_GRID_COLUMNS]! + PADDING;
const HEIGHT = Y[CITY_GRID_ROWS]! + WATERFRONT + PADDING + LABEL_BAND;

// ---- deterministic texture helpers ----

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 0..1, stable for a seed. */
function rand01(seed: string): number {
  return (hash(seed) % 10_000) / 10_000;
}

/** Jitter for a lattice vertex, shared by every cell touching it. */
function vertexJitter(col: number, row: number): { dx: number; dy: number } {
  // The map border stays straight; interior corners wander.
  const interiorX = col > 0 && col < CITY_GRID_COLUMNS;
  const interiorY = row > 0 && row < CITY_GRID_ROWS;
  return {
    dx: interiorX ? (rand01(`vx:${col},${row}`) - 0.5) * 26 : 0,
    dy: interiorY ? (rand01(`vy:${col},${row}`) - 0.5) * 26 : 0,
  };
}

type Pt = { x: number; y: number };

function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Point inside a warped cell quad at fractional (u, v). */
function bilerp(corners: [Pt, Pt, Pt, Pt], u: number, v: number): Pt {
  return lerp(lerp(corners[0], corners[1], u), lerp(corners[3], corners[2], u), v);
}

function quadPath(corners: [Pt, Pt, Pt, Pt]): string {
  const [a, b, c, d] = corners;
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)} L ${c.x.toFixed(1)} ${c.y.toFixed(1)} L ${d.x.toFixed(1)} ${d.y.toFixed(1)} Z`;
}

function subQuad(
  corners: [Pt, Pt, Pt, Pt],
  u0: number,
  v0: number,
  u1: number,
  v1: number,
): [Pt, Pt, Pt, Pt] {
  return [
    bilerp(corners, u0, v0),
    bilerp(corners, u1, v0),
    bilerp(corners, u1, v1),
    bilerp(corners, u0, v1),
  ];
}

// ---- the grayscale-with-one-color palette ----

const PAPER = "#dcdedf";
const WATER = "#b9c3c9";
const BLOCK_SHADES = ["#c7cacb", "#bfc2c4", "#cdd0d1", "#b7babc"] as const;
const STREET_LINE = "#eceded";
const INK = "#43464a";
const FAINT_INK = "#83878b";

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** Tints a gray block shade toward the owning family's color. */
function tint(shade: string, color: string, strength: number): string {
  const [gr, gg, gb] = hexToRgb(shade);
  const [cr, cg, cb] = hexToRgb(color);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * strength);
  return `rgb(${mix(gr, cr)}, ${mix(gg, cg)}, ${mix(gb, cb)})`;
}

/** Split fractions for a cell's inner blocks — 1, 2, or 4 lots. */
function cellCuts(turfId: string): { us: number[]; vs: number[] } {
  const layout = hash(`${turfId}:layout`) % 10;
  const wobble = (seed: string) => 0.42 + rand01(seed) * 0.2;
  return {
    us: layout < 6 ? [0, wobble(`${turfId}:u`), 1] : [0, 1],
    vs: layout % 3 !== 0 ? [0, wobble(`${turfId}:v`), 1] : [0, 1],
  };
}

/** Anchor cell for each district's label. */
const DISTRICT_LABEL_ANCHORS: Record<DistrictId, { x: number; y: number }> = {
  downtown: { x: 5, y: 2 },
  hillcrest: { x: 0, y: 0 },
  ironworks: { x: 0, y: 2 },
  neon_strip: { x: 0, y: 4 },
  old_quarter: { x: 5, y: 0 },
  riverside: { x: 5, y: 4 },
  the_docks: { x: 0, y: 6 },
};

type CityMapSvgProps = {
  onSelect: (turfId: string) => void;
  selectedTurfId: string | null;
  turfs: TurfState[];
  /** Highlights the viewer's own holdings with a stronger border. */
  viewerUid: string;
};

export function CityMapSvg({
  onSelect,
  selectedTurfId,
  turfs,
  viewerUid,
}: CityMapSvgProps) {
  // Shield checks tolerate the map's 45s polling staleness.
  const [now] = useState(() => Date.now());

  const cornersOf = (turf: TurfState): [Pt, Pt, Pt, Pt] => {
    // A lattice vertex sits at the near edge of its cell; the far side of
    // the previous cell ends a street-width earlier (none at the border).
    const gapBeforeColumn = (col: number) =>
      col >= CITY_GRID_COLUMNS ? 0 : AVENUE_AFTER_COLUMN.has(col - 1) ? AVENUE : STREET;
    const gapBeforeRow = (row: number) =>
      row >= CITY_GRID_ROWS ? 0 : AVENUE_AFTER_ROW.has(row - 1) ? AVENUE : STREET;
    const corner = (col: number, row: number): Pt => {
      const j = vertexJitter(col, row);
      const x = (col > turf.x ? X[col]! - gapBeforeColumn(col) : X[col]!) + j.dx;
      const y = (row > turf.y ? Y[row]! - gapBeforeRow(row) : Y[row]!) + j.dy;
      return { x, y };
    };
    return [
      corner(turf.x, turf.y),
      corner(turf.x + 1, turf.y),
      corner(turf.x + 1, turf.y + 1),
      corner(turf.x, turf.y + 1),
    ];
  };

  const waterTop = Y[CITY_GRID_ROWS]! + 6;

  return (
    <svg
      aria-label="City map"
      className="h-auto w-full rounded-panel border border-line shadow-panel"
      role="group"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    >
      {/* paper */}
      <rect fill={PAPER} height={HEIGHT} width={WIDTH} x={0} y={0} />

      {/* the harbor along the Docks */}
      <rect
        fill={WATER}
        height={HEIGHT - waterTop}
        width={WIDTH}
        x={0}
        y={waterTop}
      />
      {[2, 5, 8].map((pierCol) => (
        <rect
          fill={PAPER}
          height={24}
          key={pierCol}
          width={14}
          x={X[pierCol]! + CELL / 2 - 7 + (rand01(`pier:${pierCol}`) - 0.5) * 30}
          y={waterTop}
        />
      ))}
      <text
        fill={FAINT_INK}
        fontSize={13}
        letterSpacing={5}
        x={PADDING + 6}
        y={waterTop + 36}
      >
        THE HARBOR
      </text>

      {/* avenue center lines */}
      {[...AVENUE_AFTER_COLUMN].map((col) => {
        const x = X[col]! + CELL + AVENUE / 2;
        return (
          <line
            key={`av-x-${col}`}
            stroke={STREET_LINE}
            strokeDasharray="14 10"
            strokeWidth={3}
            x1={x}
            x2={x}
            y1={PADDING - 8}
            y2={waterTop}
          />
        );
      })}
      {[...AVENUE_AFTER_ROW].map((row) => {
        const y = Y[row]! + CELL + AVENUE / 2;
        return (
          <line
            key={`av-y-${row}`}
            stroke={STREET_LINE}
            strokeDasharray="14 10"
            strokeWidth={3}
            x1={PADDING - 8}
            x2={WIDTH - PADDING + 8}
            y1={y}
            y2={y}
          />
        );
      })}

      {/* turf blocks */}
      {turfs.map((turf) => {
        const corners = cornersOf(turf);
        const isSelected = turf.id === selectedTurfId;
        const isOwn = turf.ownerUid === viewerUid;
        const shielded = Boolean(
          turf.shieldUntil && Date.parse(turf.shieldUntil) > now,
        );
        const { us, vs } = cellCuts(turf.id);
        const inset = 0.035;

        const lots: string[] = [];
        const lotFills: string[] = [];
        for (let ui = 0; ui < us.length - 1; ui += 1) {
          for (let vi = 0; vi < vs.length - 1; vi += 1) {
            const u0 = us[ui]! + (ui === 0 ? 0 : inset);
            const u1 = us[ui + 1]! - (ui === us.length - 2 ? 0 : inset);
            const v0 = vs[vi]! + (vi === 0 ? 0 : inset);
            const v1 = vs[vi + 1]! - (vi === vs.length - 2 ? 0 : inset);
            lots.push(quadPath(subQuad(corners, u0, v0, u1, v1)));
            const shade =
              BLOCK_SHADES[hash(`${turf.id}:lot:${ui}:${vi}`) % BLOCK_SHADES.length]!;
            lotFills.push(
              turf.ownerColor
                ? tint(
                    shade,
                    turf.ownerColor,
                    0.5 + rand01(`${turf.id}:tint:${ui}:${vi}`) * 0.22,
                  )
                : shade,
            );
          }
        }

        const center = bilerp(corners, 0.5, 0.5);

        return (
          <g className="cursor-pointer" key={turf.id} onClick={() => onSelect(turf.id)}>
            {lots.map((d, i) => (
              <path d={d} fill={lotFills[i]} key={i} />
            ))}

            {/* landmark plaza */}
            {turf.landmarkId ? (
              <>
                <circle
                  cx={center.x}
                  cy={center.y}
                  fill={PAPER}
                  r={24}
                  stroke={turf.ownerColor ?? FAINT_INK}
                  strokeWidth={2.5}
                />
                <text
                  className="pointer-events-none select-none"
                  fill={turf.ownerColor ?? INK}
                  fontSize={24}
                  textAnchor="middle"
                  x={center.x}
                  y={center.y + 8}
                >
                  ★
                </text>
              </>
            ) : turf.buildings.length > 0 ? (
              <text
                className="pointer-events-none select-none"
                fill={INK}
                fontSize={13}
                textAnchor="middle"
                x={center.x}
                y={center.y + 4}
              >
                {"▪".repeat(Math.min(3, turf.buildings.length))}
              </text>
            ) : null}

            {/* owner nameplate */}
            {turf.ownerName ? (
              <text
                className="pointer-events-none select-none"
                fill={INK}
                fontSize={11}
                fontWeight={600}
                textAnchor="middle"
                x={center.x}
                y={bilerp(corners, 0.5, 0.88).y}
              >
                {turf.ownerName.length > 14
                  ? `${turf.ownerName.slice(0, 13)}…`
                  : turf.ownerName}
              </text>
            ) : null}

            {/* ownership / selection / shield border */}
            {(isSelected || isOwn || shielded) && (
              <path
                d={quadPath(corners)}
                fill="none"
                stroke={
                  isSelected ? "#a3792a" : (turf.ownerColor ?? FAINT_INK)
                }
                strokeDasharray={shielded && !isSelected ? "7 5" : undefined}
                strokeWidth={isSelected ? 4 : 2.5}
              />
            )}
          </g>
        );
      })}

      {/* roundabouts where the avenues cross */}
      {[...AVENUE_AFTER_ROW].map((row) => {
        const col = [...AVENUE_AFTER_COLUMN][0]!;
        const cx = X[col]! + CELL + AVENUE / 2;
        const cy = Y[row]! + CELL + AVENUE / 2;
        return (
          <g key={`ra-${row}`}>
            <circle cx={cx} cy={cy} fill={PAPER} r={13} stroke="#a9adaf" strokeWidth={2} />
            <circle cx={cx} cy={cy} fill="#c3c6c8" r={5} />
          </g>
        );
      })}

      {/* district names */}
      {(Object.keys(DISTRICT_LABEL_ANCHORS) as DistrictId[]).map((district) => {
        const anchor = DISTRICT_LABEL_ANCHORS[district];
        return (
          <text
            className="pointer-events-none select-none uppercase"
            fill={FAINT_INK}
            fontSize={14}
            fontWeight={700}
            key={district}
            letterSpacing={3}
            opacity={0.9}
            // Labels east of the main avenue shift clear of its roundabouts.
            x={X[anchor.x]! + (anchor.x === 5 ? 30 : 6)}
            y={Y[anchor.y]! - (anchor.y === 0 ? 8 : 5)}
          >
            {DISTRICTS[district].label}
          </text>
        );
      })}
    </svg>
  );
}
