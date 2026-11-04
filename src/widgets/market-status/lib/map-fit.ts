// The two GeoJSON shapes countries come in (structural, so no extra types package).
type Position = number[];
export type Polygon = { type: 'Polygon'; coordinates: Position[][] };
export type MultiPolygon = { type: 'MultiPolygon'; coordinates: Position[][][] };

export type Point = [number, number];
export type Box = [Point, Point];
export type MapView = { center: Point; zoom: number };

export type MapFrame = {
  width: number;
  height: number;
  /** Equal Earth scale; the centre is shared. */
  scale: number;
  /** How far the map can be panned (the world may be wider than the frame). */
  extent: [Point, Point];
};

const CENTER: Point = [0, 6.886];
/**
 * `wide`: the world without Antarctica fitted to 800 × 356 (d3 fitExtent,
 * 4px pad). `tall` (phones): land fills a 428-high frame and the Pacific
 * edges fall outside; every market stays in view (Australia ends at 795).
 */
export const FRAMES = {
  wide: {
    width: 800,
    height: 356,
    scale: 149.1,
    extent: [
      [0, 0],
      [800, 356],
    ],
  },
  tall: {
    width: 800,
    height: 428,
    scale: 180.1,
    extent: [
      [-79, 0],
      [879, 428],
    ],
  },
} as const satisfies Record<string, MapFrame>;
export const WORLD: MapView = { center: CENTER, zoom: 1 };
export const MAX_ZOOM = 8;
/** A fit leaves room around the markets and never zooms in so far that the context is lost. */
const FIT_MARGIN = 0.8;
const FIT_MAX_ZOOM = 5;

const toPoint = (p: Position): Point => [p[0] ?? 0, p[1] ?? 0];

function ringBox(ring: Position[], project: (p: Point) => Point | null): Box | null {
  let box: Box | null = null;
  for (const position of ring) {
    const p = project(toPoint(position));
    if (!p) continue;
    box = box
      ? [
          [Math.min(box[0][0], p[0]), Math.min(box[0][1], p[1])],
          [Math.max(box[1][0], p[0]), Math.max(box[1][1], p[1])],
        ]
      : [p, p];
  }
  return box;
}

const area = ([[x0, y0], [x1, y1]]: Box) => (x1 - x0) * (y1 - y0);

/**
 * Projected box of a country's largest part, so French Guiana or Alaska
 * do not stretch a fit across an ocean.
 */
export function mainBox(
  geometry: Polygon | MultiPolygon,
  project: (p: Point) => Point | null,
): Box | null {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let best: Box | null = null;
  for (const polygon of polygons) {
    const box = polygon[0] ? ringBox(polygon[0], project) : null;
    if (box && (!best || area(box) > area(best))) best = box;
  }
  return best;
}

/** Centre (lon/lat) and zoom that fit the boxes; the whole world for none. */
export function fitView(
  boxes: readonly Box[],
  size: { width: number; height: number },
  invert: (p: Point) => Point | null,
): MapView {
  if (boxes.length === 0) return WORLD;
  const x0 = Math.min(...boxes.map((b) => b[0][0]));
  const y0 = Math.min(...boxes.map((b) => b[0][1]));
  const x1 = Math.max(...boxes.map((b) => b[1][0]));
  const y1 = Math.max(...boxes.map((b) => b[1][1]));
  const center = invert([(x0 + x1) / 2, (y0 + y1) / 2]);
  if (!center) return WORLD;
  const fit = Math.min(size.width / (x1 - x0 || 1), size.height / (y1 - y0 || 1)) * FIT_MARGIN;
  return { center, zoom: Math.min(FIT_MAX_ZOOM, Math.max(1, fit)) };
}
