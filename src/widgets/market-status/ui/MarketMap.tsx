'use client';

import { MinusIcon, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ComposableMap, useGeographies, useMapContext } from 'react-simple-maps/core';
import { ZoomableGroup } from 'react-simple-maps/zoom';
import topology from 'world-atlas/countries-110m.json';

import type { MapItem, MarketMapView } from '@/entities/performance';
import { useMediaQuery } from '@/shared/lib';
import { Button } from '@/shared/ui';

import {
  type Box,
  fitView,
  mainBox,
  MAP_SIZE,
  type MapView,
  MAX_ZOOM,
  type MultiPolygon,
  type Point,
  type Polygon,
  PROJECTION,
  WORLD,
} from '../lib/map-fit';
import { itemFill } from './map-colours';
import { MapTooltip, type TooltipState } from './MapTooltip';
import { useMapFormat } from './use-map-format';

type Geography = ReturnType<typeof useGeographies>['geographies'][number];
type GeographyInput = Parameters<typeof useGeographies>[0]['geography'];

const ANTARCTICA = '010';
const ZOOM_STEP = 1.5;
const FLY_MS = 450;
const TOPOLOGY = topology as unknown as GeographyInput;
const EXTENT: [number, number][] = [
  [0, 0],
  [MAP_SIZE.width, MAP_SIZE.height],
];
const NON_SCALING = { vectorEffect: 'non-scaling-stroke' } as const;

const dropAntarctica = <T extends { id?: string | number }>(features: T[]) =>
  features.filter((f) => String(f.id) !== ANTARCTICA);
const isArea = (g: Geography['geometry']): g is Polygon | MultiPolygon =>
  g.type === 'Polygon' || g.type === 'MultiPolygon';

// Plain wheel and one finger scroll the page; Ctrl/⌘ + wheel or a pinch
// zooms; the mouse drags only once zoomed in; no double-click zoom.
function allowGesture(event: Event, zoom: number): boolean {
  if (event.type === 'wheel') {
    const wheel = event as WheelEvent;
    return wheel.ctrlKey || wheel.metaKey;
  }
  if (event.type === 'touchstart') return (event as TouchEvent).touches.length >= 2;
  if (event.type === 'mousedown') return zoom > 1 && (event as MouseEvent).button === 0;
  return false;
}

/** Map position with an eased flight between views (instant with reduced motion). */
function useMapPosition() {
  const still = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [pos, setPos] = useState<MapView>(WORLD);
  const frame = useRef<number | null>(null);
  const latest = useRef(pos);
  useEffect(() => {
    latest.current = pos;
  }, [pos]);

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  const flyTo = useCallback(
    (target: MapView, instant = false) => {
      stop();
      const from = latest.current;
      const begin = performance.now();
      const tick = (now: number) => {
        const p = instant || still ? 1 : Math.min(1, (now - begin) / FLY_MS);
        const e = 1 - (1 - p) ** 3;
        setPos({
          center: [
            from.center[0] + (target.center[0] - from.center[0]) * e,
            from.center[1] + (target.center[1] - from.center[1]) * e,
          ],
          // Even on a log scale, so zooming in and out feel alike.
          zoom: from.zoom * (target.zoom / from.zoom) ** e,
        });
        frame.current = p < 1 ? requestAnimationFrame(tick) : null;
      };
      frame.current = requestAnimationFrame(tick);
    },
    [still, stop],
  );

  useEffect(() => stop, [stop]);
  return { pos, setPos, flyTo, stop };
}

export type MarketMapProps = {
  view: MarketMapView;
  /** Markets the view should fit: the drilled region or the assistant's list; none = world. */
  fitIds: readonly string[];
  onOpen: (marketId: string) => void;
};

/**
 * The choropleth (spec §8), on its own chunk. Mouse: hover shows the
 * tooltip, click opens the market. Touch: a tap shows the tooltip with an
 * "Open" button; one finger scrolls the page, two fingers zoom. Keyboard:
 * each market is a button in Tab order, Enter opens it; Esc hides the
 * tooltip (the popover's own dismiss).
 */
export function MarketMap({ view, fitIds, onOpen }: MarketMapProps) {
  const t = useTranslations('marketStatus');
  const m = useMapFormat();
  const { pos, setPos, flyTo, stop } = useMapPosition();
  const [tip, setTip] = useState<TooltipState | null>(null);
  const item = tip ? view.items.find((i) => i.id === tip.id) : undefined;
  const touchTip = tip?.via === 'touch';

  // A tap tooltip points at a spot on screen: scrolling the page closes it
  // rather than leave its "Open" button over other cards.
  useEffect(() => {
    if (!touchTip) return;
    const close = () => {
      setTip(null);
    };
    window.addEventListener('scroll', close, { passive: true, once: true });
    return () => {
      window.removeEventListener('scroll', close);
    };
  }, [touchTip]);

  const zoomBy = (factor: number) => {
    flyTo({ center: pos.center, zoom: Math.min(MAX_ZOOM, Math.max(1, pos.zoom * factor)) });
  };

  return (
    <div>
      <ComposableMap
        width={MAP_SIZE.width}
        height={MAP_SIZE.height}
        projection="geoEqualEarth"
        projectionConfig={PROJECTION}
        role="group"
        aria-label={t('mapLabel', { metric: m.metricLabel(view.metric) })}
        className="block h-auto w-full touch-pan-x touch-pan-y rounded-md bg-map-sea select-none"
      >
        <MapLayers
          view={view}
          fitIds={fitIds}
          pos={pos}
          onMoveEnd={setPos}
          onGesture={stop}
          flyTo={flyTo}
          onOpen={onOpen}
          onTip={setTip}
        />
      </ComposableMap>
      <div className="mt-2 flex justify-end gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 aria-disabled:opacity-50"
          aria-label={t('zoomOut')}
          aria-disabled={pos.zoom <= 1.01}
          onClick={() => {
            if (pos.zoom > 1.01) zoomBy(1 / ZOOM_STEP);
          }}
        >
          <MinusIcon aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 aria-disabled:opacity-50"
          aria-label={t('zoomIn')}
          aria-disabled={pos.zoom >= MAX_ZOOM - 0.01}
          onClick={() => {
            if (pos.zoom < MAX_ZOOM - 0.01) zoomBy(ZOOM_STEP);
          }}
        >
          <PlusIcon aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 aria-disabled:opacity-50"
          aria-disabled={pos.zoom <= 1.01}
          onClick={() => {
            if (pos.zoom > 1.01) flyTo(WORLD);
          }}
        >
          {t('wholeWorld')}
        </Button>
      </div>
      {item && tip ? (
        <MapTooltip
          item={item}
          metric={view.metric}
          tip={tip}
          onOpen={onOpen}
          onClose={() => {
            setTip(null);
          }}
        />
      ) : null}
    </div>
  );
}

type MapLayersProps = Pick<MarketMapProps, 'view' | 'fitIds' | 'onOpen'> & {
  pos: MapView;
  onMoveEnd: (pos: MapView) => void;
  onGesture: () => void;
  flyTo: (target: MapView, instant?: boolean) => void;
  onTip: CountriesProps['onTip'];
};

/**
 * Shapes, zoom and fit. Flies to fit `fitIds` when they change, so a zoom
 * set by hand survives a month, window or metric change; the first fit is instant.
 */
function MapLayers({
  view,
  fitIds,
  pos,
  onMoveEnd,
  onGesture,
  flyTo,
  onOpen,
  onTip,
}: MapLayersProps) {
  const { projection } = useMapContext();
  const { geographies } = useGeographies({ geography: TOPOLOGY, parseGeographies: dropAntarctica });
  const shapes = useMemo(() => new Map(geographies.map((g) => [String(g.id), g])), [geographies]);
  const key = fitIds.join(',');
  const fitted = useRef<string | null>(null);

  useEffect(() => {
    if (shapes.size === 0 || fitted.current === key) return;
    const first = fitted.current === null;
    fitted.current = key;
    const project = (p: Point) => projection(p) ?? null;
    const boxes = view.items
      .filter((i) => fitIds.includes(i.id))
      .flatMap((i): Box[] => {
        const geometry = shapes.get(i.numericIso)?.geometry;
        const box = geometry && isArea(geometry) ? mainBox(geometry, project) : null;
        return box ? [box] : [];
      });
    flyTo(
      fitView(boxes, MAP_SIZE, (p) => projection.invert?.(p) ?? null),
      first,
    );
  }, [fitIds, flyTo, key, projection, shapes, view.items]);

  return (
    <ZoomableGroup
      center={pos.center}
      zoom={pos.zoom}
      minZoom={1}
      maxZoom={MAX_ZOOM}
      translateExtent={EXTENT}
      filterZoomEvent={(event) => allowGesture(event, pos.zoom)}
      onMoveStart={(_, event) => {
        // A gesture takes over from a flight in progress.
        if (event.sourceEvent) onGesture();
      }}
      onMoveEnd={({ coordinates, zoom }) => {
        if (coordinates && zoom) onMoveEnd({ center: coordinates, zoom });
      }}
    >
      <Patterns zoom={pos.zoom} />
      <Countries view={view} shapes={shapes} onOpen={onOpen} onTip={onTip} />
    </ZoomableGroup>
  );
}

const DOTS = 'mo-map-dots';
const HATCH = 'mo-map-hatch';

/** At-risk dots and off-track hatching, kept the same size on screen at any zoom. */
function Patterns({ zoom }: { zoom: number }) {
  const scale = `scale(${String(1 / zoom)})`;
  return (
    <defs>
      <pattern
        id={DOTS}
        width={4}
        height={4}
        patternUnits="userSpaceOnUse"
        patternTransform={scale}
      >
        <circle cx={2} cy={2} r={0.9} fill="var(--card)" fillOpacity={0.85} />
      </pattern>
      <pattern
        id={HATCH}
        width={4}
        height={4}
        patternUnits="userSpaceOnUse"
        patternTransform={`${scale} rotate(45)`}
      >
        <rect width={1.4} height={4} fill="var(--card)" fillOpacity={0.85} />
      </pattern>
    </defs>
  );
}

type CountriesProps = {
  view: MarketMapView;
  shapes: ReadonlyMap<string, Geography>;
  onOpen: (marketId: string) => void;
  onTip: (update: (prev: TooltipState | null) => TooltipState | null) => void;
};

/** Every country: plain land, then the markets in Tab order, then patterns and rings on top. */
const Countries = memo(function Countries({ view, shapes, onOpen, onTip }: CountriesProps) {
  const m = useMapFormat();
  const { projection } = useMapContext();
  // Above the main part of the country (not France with French Guiana, the US with Alaska).
  const focusPoint = (path: SVGPathElement, item: MapItem): [number, number] => {
    const geometry = shapes.get(item.numericIso)?.geometry;
    const box =
      geometry && isArea(geometry) ? mainBox(geometry, (p) => projection(p) ?? null) : null;
    const ctm = box && typeof path.getScreenCTM === 'function' ? path.getScreenCTM() : null;
    if (box && ctm) {
      const p = new DOMPoint((box[0][0] + box[1][0]) / 2, box[0][1]).matrixTransform(ctm);
      return [p.x, p.y];
    }
    const r = path.getBoundingClientRect();
    return [r.left + r.width / 2, r.top];
  };
  // Whether the next click and focus come from a finger, and whether a press is under way.
  const pointer = useRef({ type: 'mouse', down: false });
  const iso = new Set(view.items.map((i) => i.numericIso));
  const markets = view.items.filter((i) => shapes.has(i.numericIso));
  const show = (id: string, at: [number, number], via: TooltipState['via']) => {
    onTip(() => ({ id, at, via }));
  };
  const hideIf = (match: (prev: TooltipState) => boolean) => {
    onTip((prev) => (prev && match(prev) ? null : prev));
  };
  const pattern = (item: MapItem) =>
    view.metric !== 'status' || !item.inScope
      ? null
      : item.status === 'at_risk'
        ? 'dots'
        : item.status === 'off_track'
          ? 'hatch'
          : null;

  return (
    <>
      <g aria-hidden>
        {[...shapes.values()]
          .filter((g) => !iso.has(String(g.id)))
          .map((g) => (
            <path
              key={g.rsmKey}
              d={g.svgPath ?? undefined}
              fill="var(--map-land)"
              stroke="var(--border)"
              strokeWidth={0.5}
              style={NON_SCALING}
            />
          ))}
      </g>
      <g>
        {markets.map((item) => (
          <path
            key={item.id}
            d={shapes.get(item.numericIso)?.svgPath ?? undefined}
            role="button"
            tabIndex={0}
            aria-label={m.countryName(item, view.metric)}
            fill={itemFill(item, view)}
            // A thin surface gap between neighbours; markets outside the region keep an outline.
            stroke={item.inScope ? 'var(--card)' : 'var(--muted-foreground)'}
            strokeWidth={item.inScope ? 0.75 : 0.6}
            style={NON_SCALING}
            className="cursor-pointer outline-none focus-visible:stroke-foreground focus-visible:[stroke-width:2.5]"
            data-market={item.id}
            onPointerDown={(e) => {
              pointer.current = { type: e.pointerType, down: true };
              // Released anywhere (a drag, a scroll that ends in pointercancel): the press is over.
              const release = () => {
                pointer.current.down = false;
              };
              window.addEventListener('pointerup', release, { once: true });
              window.addEventListener('pointercancel', release, { once: true });
            }}
            onPointerMove={(e) => {
              if (e.pointerType !== 'touch') show(item.id, [e.clientX, e.clientY], 'pointer');
            }}
            onPointerLeave={(e) => {
              if (e.pointerType !== 'touch') {
                hideIf((prev) => prev.via === 'pointer' && prev.id === item.id);
              }
            }}
            onClick={(e) => {
              if (pointer.current.type === 'touch') show(item.id, [e.clientX, e.clientY], 'touch');
              else onOpen(item.id);
            }}
            onFocus={(e) => {
              // A press focuses too; the tooltip on focus is for the keyboard.
              if (pointer.current.down) return;
              show(item.id, focusPoint(e.currentTarget, item), 'focus');
            }}
            onBlur={() => {
              hideIf((prev) => prev.via === 'focus');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(item.id);
              }
            }}
          />
        ))}
      </g>
      <g aria-hidden pointerEvents="none">
        {markets.map((item) => {
          const d = shapes.get(item.numericIso)?.svgPath ?? undefined;
          const fill = pattern(item);
          return (
            <g key={item.id}>
              {fill ? <path d={d} fill={`url(#${fill === 'dots' ? DOTS : HATCH})`} /> : null}
              {item.highlighted ? (
                <path
                  d={d}
                  fill="none"
                  stroke="var(--ring)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  style={NON_SCALING}
                />
              ) : null}
              {item.selected ? (
                <path
                  d={d}
                  fill="none"
                  stroke="var(--foreground)"
                  strokeWidth={2}
                  style={NON_SCALING}
                />
              ) : null}
            </g>
          );
        })}
      </g>
    </>
  );
});
