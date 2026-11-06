'use client';

import { CircleDotIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import {
  type HeatCell,
  type HeatMapView,
  type HeatRow,
  MAP_SCALES,
  toneFill,
  toneText,
} from '@/entities/performance';
import type { Period } from '@/shared/api';
import { cn, useJoinParts } from '@/shared/lib';
import { Button } from '@/shared/ui';

import { useHeatFormat } from './use-heat-format';

/** A cell: its market, column, and the row index it had (to fall back on if the row goes). */
type Position = { id: string; col: number; row: number };

type Props = {
  view: HeatMapView;
  /** The month the dashboard shows: focus starts there. */
  period: Period;
  label: string;
  onOpen: (marketId: string, period: Period) => void;
  onToggle: (marketId: string) => void;
};

const keyOf = (p: Position) => `${p.id}|${String(p.col)}`;
const clamp = (n: number, max: number) => Math.min(Math.max(n, 0), max);
/** A mouse is the main pointer (the line's buttons are hidden): a tap opens too, as a click. */
const mouseFirst = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches;

/**
 * The heat map's grid: one Tab stop (roving tabindex), arrows move, Home /
 * End within a row, Ctrl+Home / Ctrl+End to the corners. Enter opens the
 * market at that month, Shift+Enter or Shift+click selects it. A tap on a
 * touch screen only shows the cell: the line under the grid has Open and
 * Select, as the map's touch tooltip does. With a mouse a click opens, so the
 * line only reads the cell out: buttons there would change under the mouse on
 * its way down to them (owner, 2026-11-06).
 */
export function HeatGrid({ view, period, label, onOpen, onToggle }: Props) {
  const t = useTranslations('heatMap');
  const tCommon = useTranslations('common');
  const h = useHeatFormat(view.metric, view.marketNotes);
  const { rows, periods } = view;
  const lastCol = periods.length - 1;
  const startCol = Math.max(0, periods.indexOf(period));

  const [active, setActive] = useState<Position | null>(null);
  // The line under the grid: the cell under the mouse while it is over the
  // grid, else the cell last focused or tapped (pinned), which its buttons act on.
  const [pinned, setPinned] = useState<Position | null>(null);
  const [hovered, setHovered] = useState<Position | null>(null);
  const cells = useRef(new Map<string, HTMLButtonElement>());
  const scroller = useRef<HTMLDivElement>(null);
  const headers = useRef(new Map<Period, HTMLTableCellElement>());
  const pointer = useRef('');
  const hadFocus = useRef(false);

  // The roving position, resolved against the rows as they are now.
  const rowIndex = (id: string) => rows.findIndex((r) => r.id === id);
  const lastRow = rows.length - 1;
  const at = (row: number, col: number): Position | null => {
    const r = clamp(row, lastRow);
    const id = rows[r]?.id;
    return id === undefined ? null : { id, col: clamp(col, lastCol), row: r };
  };
  const current: Position | null =
    active && rowIndex(active.id) !== -1
      ? { ...active, row: rowIndex(active.id) }
      : at(active?.row ?? 0, active?.col ?? startCol);

  const focusAt = useCallback((p: Position) => {
    setActive(p);
    cells.current.get(keyOf(p))?.focus();
  }, []);

  // Rows changed under the focus (an open, a drill): keep it on the grid.
  const refocus = useEffectEvent(() => {
    if (!hadFocus.current || !current) return;
    if (scroller.current?.contains(document.activeElement)) return;
    cells.current.get(keyOf(current))?.focus();
  });
  const rowKey = rows.map((r) => r.id).join(',');
  useLayoutEffect(() => {
    refocus();
  }, [rowKey]);

  // Open on the selected month: scroll it into the middle (phones).
  useLayoutEffect(() => {
    const box = scroller.current;
    const head = headers.current.get(period);
    if (!box || !head) return;
    box.scrollLeft = head.offsetLeft + head.offsetWidth / 2 - box.clientWidth / 2;
  }, [period]);

  const move = (e: KeyboardEvent<HTMLTableElement>) => {
    if (!current) return;
    const r = current.row;
    const ctrl = e.ctrlKey || e.metaKey;
    let row = r;
    let col = current.col;
    switch (e.key) {
      case 'ArrowRight':
        col += 1;
        break;
      case 'ArrowLeft':
        col -= 1;
        break;
      case 'ArrowDown':
        row += 1;
        break;
      case 'ArrowUp':
        row -= 1;
        break;
      case 'Home':
        col = 0;
        if (ctrl) row = 0;
        break;
      case 'End':
        col = lastCol;
        if (ctrl) row = lastRow;
        break;
      case 'Enter': {
        e.preventDefault();
        const id = current.id;
        const at = periods[current.col];
        if (e.shiftKey) onToggle(id);
        else if (at) onOpen(id, at);
        return;
      }
      default:
        return;
    }
    e.preventDefault();
    const next = at(row, col);
    if (next) focusAt(next);
  };

  const onPointerDown = (e: PointerEvent) => {
    pointer.current = e.pointerType;
  };
  // A finger that scrolled and lifted gives no click: forget it, so a later
  // key press is not taken for a tap.
  const forgetPointer = () => {
    pointer.current = '';
  };

  const shown = hovered ?? pinned;

  const shownRow = shown ? rows.find((r) => r.id === shown.id) : undefined;
  const shownCell = shown ? shownRow?.cells[shown.col] : undefined;

  return (
    // `min-w-0`: the grid scrolls inside the card, never widens the page (phones).
    <div className="flex min-w-0 flex-col gap-2">
      {/*
        `relative`: the scroll box must contain the grid's absolute bits (the
        `sr-only` "in the window" text in the month headers). Without it they
        sit at their column far to the right, outside the box, and widen the
        whole page on a phone.
      */}
      <div ref={scroller} className="relative overflow-x-auto">
        <table
          role="grid"
          aria-label={label}
          className="w-full border-separate border-spacing-0 text-xs"
          onKeyDown={move}
          onFocus={() => {
            hadFocus.current = true;
          }}
          onPointerCancel={forgetPointer}
          onKeyDownCapture={forgetPointer}
          onMouseLeave={() => {
            setHovered(null);
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) hadFocus.current = false;
          }}
        >
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 min-w-32 bg-card px-2 text-left font-medium text-muted-foreground"
              >
                {t('market')}
              </th>
              {periods.map((p) => {
                const inWindow = view.window.includes(p);
                return (
                  <th
                    key={p}
                    scope="col"
                    ref={(el) => {
                      if (el) headers.current.set(p, el);
                      else headers.current.delete(p);
                    }}
                    aria-current={p === period ? 'date' : undefined}
                    className={cn(
                      'min-w-10 px-0.5 pb-1 text-center font-normal whitespace-nowrap text-muted-foreground',
                      inWindow && 'rounded-t-sm bg-foreground font-semibold text-background',
                    )}
                  >
                    {/* "Mar 26" on screen; the whole month for a screen reader,
                        as it is the only place a cell's month is said. */}
                    <span aria-hidden>{h.monthShort(p)}</span>
                    <span className="sr-only">{h.month(p)}</span>
                    {inWindow ? (
                      <span className="sr-only">{tCommon('srAfter', { text: t('inWindow') })}</span>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} aria-current={row.current ? 'true' : undefined}>
                <RowHeader row={row} />
                {row.cells.map((c, col) => {
                  const pos = { id: row.id, col, row: index };
                  const isCurrent = current?.id === row.id && current.col === col;
                  return (
                    <td key={c.period} className={cn('p-0.5', c.inWindow && 'bg-foreground')}>
                      <CellButton
                        cell={c}
                        metric={view.metric}
                        marketNotes={view.marketNotes}
                        tabbable={isCurrent}
                        ref={(el) => {
                          if (el) cells.current.set(keyOf(pos), el);
                          else cells.current.delete(keyOf(pos));
                        }}
                        onPointerDown={onPointerDown}
                        onFocus={() => {
                          setActive(pos);
                          setPinned(pos);
                        }}
                        onMouseEnter={() => {
                          setHovered(pos);
                        }}
                        onClick={(shift) => {
                          const touch = pointer.current === 'touch';
                          pointer.current = '';
                          setActive(pos);
                          setPinned(pos);
                          if (shift) onToggle(row.id);
                          else if (!touch || mouseFirst()) onOpen(row.id, c.period);
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CellDetail
        row={shownRow}
        cell={shownCell}
        metric={view.metric}
        marketNotes={view.marketNotes}
        onOpen={onOpen}
        onToggle={onToggle}
      />
    </div>
  );
}

function RowHeader({ row }: { row: HeatRow }) {
  const t = useTranslations('heatMap');
  const tCommon = useTranslations('common');
  return (
    <th
      scope="row"
      className={cn(
        'sticky left-0 z-10 bg-card px-2 text-left font-normal whitespace-nowrap',
        (row.current || row.selected) && 'font-semibold',
      )}
    >
      <span className="flex items-center gap-1">
        {row.selected ? <CircleDotIcon aria-hidden className="size-3.5 shrink-0" /> : null}
        {row.name}
        {row.selected ? (
          <span className="sr-only">{tCommon('srAfter', { text: t('selected') })}</span>
        ) : null}
        {row.current ? (
          <span className="text-muted-foreground">{tCommon('after', { text: t('current') })}</span>
        ) : null}
      </span>
    </th>
  );
}

type CellProps = {
  cell: HeatCell;
  metric: HeatMapView['metric'];
  marketNotes: boolean;
  tabbable: boolean;
  ref: (el: HTMLButtonElement | null) => void;
  onPointerDown: (e: PointerEvent) => void;
  onFocus: () => void;
  onMouseEnter: () => void;
  onClick: (shift: boolean) => void;
};

function CellButton({
  cell,
  metric,
  marketNotes,
  tabbable,
  ref,
  onPointerDown,
  onFocus,
  onMouseEnter,
  onClick,
}: CellProps) {
  const h = useHeatFormat(metric, marketNotes);
  const scale = MAP_SCALES[metric];
  const tone = cell.step === null ? undefined : scale.tones[cell.step];
  return (
    <button
      ref={ref}
      type="button"
      tabIndex={tabbable ? 0 : -1}
      aria-label={h.cellName(cell)}
      // A fill and its ink from the scale tokens (SVG-style source tokens).
      style={
        tone === undefined
          ? undefined
          : { backgroundColor: toneFill(scale.kind, tone), color: toneText(scale.kind, tone) }
      }
      className={cn(
        'relative flex h-11 w-full min-w-10 items-center justify-center rounded-sm font-mono tabular-nums outline-none',
        'focus-visible:z-10 focus-visible:ring-4 focus-visible:ring-ring',
        tone === undefined && 'bg-muted text-muted-foreground',
      )}
      onPointerDown={onPointerDown}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      onClick={(e) => {
        onClick(e.shiftKey);
      }}
      // Enter is handled by the grid (with or without Shift).
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault();
      }}
    >
      {h.short(cell.value)}
      {cell.anomaly ? (
        <TriangleAlertIcon aria-hidden className="absolute top-0.5 right-0.5 size-3" />
      ) : null}
    </button>
  );
}

function CellDetail({
  row,
  cell,
  metric,
  marketNotes,
  onOpen,
  onToggle,
}: {
  row: HeatRow | undefined;
  cell: HeatCell | undefined;
  metric: HeatMapView['metric'];
  marketNotes: boolean;
  onOpen: (marketId: string, period: Period) => void;
  onToggle: (marketId: string) => void;
}) {
  const t = useTranslations('heatMap');
  const h = useHeatFormat(metric, marketNotes);
  const join = useJoinParts();
  const separator = useTranslations('common')('separator');
  if (!row || !cell) {
    return <p className="min-h-11 text-xs text-muted-foreground">{t('pick')}</p>;
  }
  const month = h.month(cell.period);
  return (
    <div className="flex min-h-11 min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <p className="min-w-0">
        {join([row.name, month, t('readout', { metric: h.metricName, value: h.long(cell.value) })])}
        {cell.anomaly ? (
          <span className="text-muted-foreground">
            {separator}
            <TriangleAlertIcon aria-hidden className="inline size-3.5 align-text-top" />{' '}
            {h.note(cell.anomaly.note)}
          </span>
        ) : null}
      </p>
      {/* Long market names: the buttons wrap, and so do their labels, on a phone.
          Touch only: with a mouse the cell itself opens (Shift+click selects). */}
      <div className="flex min-w-0 flex-wrap gap-2 pointer-fine:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-auto min-h-11 text-left whitespace-normal"
          onClick={() => {
            onOpen(row.id, cell.period);
          }}
        >
          {t('open', { market: row.name, month })}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-auto min-h-11 text-left whitespace-normal"
          onClick={() => {
            onToggle(row.id);
          }}
        >
          {row.selected ? t('remove', { market: row.name }) : t('add', { market: row.name })}
        </Button>
      </div>
    </div>
  );
}
