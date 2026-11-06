# DESIGN.md

The visual language of Market Ops Console: what to build screens from,
which tokens to colour them with, how much space to give them.

> **Read before writing markup.** Every new screen, card, row or control
> starts here. This file describes **what is in the code**, not a wish list.
> If the code and this file disagree, the code wins and this file is fixed
> in the same commit.

Where things live: tokens in `src/app/styles/globals.css` (contrast-checked
in `src/app/styles/tokens.test.ts`), components in `src/shared/ui/`, the
reasoning in `docs/decisions/0009-theming-dark-mode.md` (tokens and themes)
and `docs/decisions/0014-design-direction.md` (assistant A, dashboard D,
fonts). The reference boards are on the Claude Design canvas linked from
ADR 0014: "A · Assistant", "D + A · Design system", "D + A · States".

---

## 0. Lookup order: invent nothing

1. **`src/shared/ui`**: is there a project component? See §6.
2. **shadcn registry**, checked with the command, not from memory:
   `pnpm dlx shadcn@latest search <name>`, then
   `pnpm dlx shadcn@latest add <name>` (it lands in `src/shared/ui`).
3. **A new component**, only after asking the owner, in the lowest FSD
   layer that reuses it.

## 1. Colour

Raw values (OKLCH) live only in `:root` and `.dark` in `globals.css`.
Markup uses the semantic tokens below, as Tailwind classes
(`bg-card`, `text-muted-foreground`). **No raw colours, no arbitrary
values** (`bg-[#fff]`, `w-[37px]`).

| Purpose | Tokens |
|---|---|
| Page and surfaces | `background`, `card`, `popover`, `muted` |
| Text | `foreground`, `muted-foreground` |
| Lines and focus | `border`, `input` (control borders, 3:1), `ring` |
| Primary action | `primary` / `primary-foreground` (ink on paper, not a brand colour) |
| Error | `destructive` (= off-track red) |
| **AI-generated content** | `surface-ai` (background), `surface-ai-border`, `surface-ai-label` (label, accents) |
| **Source-of-truth data** | `surface-data` (the "What the data shows" block, evidence) |
| Status | `status-on-track`, `status-at-risk`, `status-off-track`, each with `-muted` for its chip background |
| Map | `map-sea` (= `muted`), `map-land` (= `card`), `map-hatch` |
| shadcn component tokens | `secondary` (chips, `Button` `secondary`), `accent` (menu item hover and focus), `chart-1` … `chart-5` (chart series, §6); `sidebar-*` come with shadcn and are unused |
| Map and heat-map scales (0.6.0; heat map 0.8.0) | diverging `scale-div-1` … `scale-div-6` (orange · grey · blue), sequential `scale-seq-1` … `scale-seq-5` (blue); SVG fills read these source tokens, not `--color-*` aliases |
| Heat-map cell text (0.8.0) | `scale-div-N-foreground`, `scale-seq-N-foreground`: black or white (`scale-ink-dark` / `scale-ink-light`), whichever reads on the step at ≥ 4.5:1 |
| Radar series (0.8.0) | `series-1` … `series-4`: blue · teal · violet · wine, apart from the status hues; checked with the dataviz validator (CVD ΔE ≥ 9, ≥ 3:1 on the card) and paired with a dash pattern and a marker shape each |
| Mixed from the tokens above (0.11.1, `@theme inline`) | `secondary-hover` (`Button` `secondary` on hover: `secondary` with 5 % `foreground`), `table-footer` (`muted` at 50 % over `card`, opaque: the total row and its sticky first cell share one tone) |

Rules:

- **AI and data never share a surface.** AI text sits on `surface-ai` with
  the ✦ label "AI answer · may be incomplete"; real numbers sit on
  `surface-data` with the ▣ label. Both are named in text, not by colour
  alone (`.claude/rules/ui.md`).
- **Status is shape + word + colour**: ● On track, ▲ At risk, ■ Off track
  (`StatusChip`). Never colour alone.
- **Status exists only for the latest month at range 1m.** For a past month
  show "latest only" or the latest status labelled with its month
  ("Status, May 2026").
- **Confidence** is three equal bars in `surface-ai-label` plus the word;
  only Low adds "Treat as directional" in `status-at-risk`. The
  `confidence-*` tokens are defined but not used for the label.
- **Every text pair used is in `tokens.test.ts`** (4.5:1 text, 3:1 controls
  and charts) for both themes. A new pairing gets a line there first.

## 2. Typography

- **Space Grotesk** for text, **JetBrains Mono** for numbers (KPIs, table
  figures, axes, periods under charts): `font-sans` / `font-mono`, always
  with `tabular-nums` for columns. Cyrillic falls back to the system
  sans-serif by design (ADR 0014).
- Scale in use: `text-xs` (12px: meta, table cells, chips, hints),
  `text-sm` (14px: body in panels, buttons), `text-base` (16px: panel
  title, composer field; 16px stops iOS zoom), `text-lg` (empty-state
  heading). shadcn's `sm` buttons and toggles keep their `text-[0.8rem]`
  (§6).
- Weights: 400 body, 500 labels and buttons, 600 titles, names in tables,
  chips.
- Table headers: `text-xs uppercase tracking-wide text-muted-foreground`.
- Percent values always with one decimal (`92.0%`, `+2.0%`); the formats
  are in `src/shared/config/i18n/formats.ts`, never `toFixed` in a
  component.

## 3. Radius, shadow, motion

- `--radius: 0.875rem`; Tailwind steps derive from it. In use:
  `rounded-xl` for cards and answer surfaces, `rounded-lg` for buttons and
  source buttons, `rounded-full` for chips, suggestion buttons and the
  "New content" pill, `rounded-sm` for the confidence bars. Small shadcn
  controls (0.11.1): `xs` buttons and the `sm` toggle group keep their
  `min(radius-md, 10px)` (§6), `sm` buttons and toggles use `rounded-md`
  (the generated `min(radius-md, 12px)` is `radius-md` at this radius),
  the tooltip arrow `rounded-xs`.
- Shadow: only on floating layers (hover card, popover, dropdown, the "New
  content" pill: `shadow-sm` / the shadcn default). Cards are flat with a
  `border`.
- Motion: short and meaningful only (chevron rotation, popover fade). Every
  animation has `motion-reduce:` off; the streaming caret stops pulsing;
  scrolling to new content is instant under `prefers-reduced-motion`.

## 4. Spacing and targets

- 4px grid. Common: `gap-2` / `gap-1.5` inside a block, `gap-3` / `gap-4`
  between blocks, `p-3` cards, `p-4` panel body, `px-3 py-2` table cells.
- **Touch targets ≥ 44px**: `min-h-11` buttons, `size-11` icon buttons,
  `min-h-14` tab bar. Floating cards keep 15px from the viewport edge
  (`collisionPadding={15}`).
- Clickable things show `cursor: pointer` (global rule in `globals.css`);
  disabled (`disabled` or `aria-disabled="true"`) shows `not-allowed` and has
  no hover or press effect: `Button` uses the `interactive:` variant
  (`globals.css`) for both. Use `aria-disabled` instead of `disabled` when the
  control must keep focus or a tooltip (New chat, a locked rating).

## 5. Screen frame

- **Desktop (≥ `lg`, 64rem):** header row, then the dashboard (`main#main`)
  and the assistant as a right `aside` (`w-96`), collapsible to a 56px rail
  (`w-14`) with a dot badge for unseen answers. The collapsed state is
  remembered (`localStorage` `mo:assistant-collapsed`) and applied before
  first paint through `data-assistant-collapsed` on `<html>`, so the panel
  never flashes open (ADR 0015).
- **Phone (< `lg`):** one section at a time, Overview or Assistant
  (`?tab=`), with the bottom tab bar (`SectionTabBar`, labels always
  shown). Switching sections is CSS (`max-lg:hidden`), so the assistant is
  mounted once and keeps the conversation.
- Skip link "Skip to content" → `#main`. Scroll containers are `relative`,
  so `sr-only` children cannot stretch the page.
- The dashboard scrolls inside `main#main`, under a header that stays put.
  Popups are portalled to the body, so the shell passes `<main>` to them as
  their boundary (`PopperBoundary`): a menu, popover, tooltip or hover card
  opened there flips and sizes within it and hides once its trigger has
  scrolled under the header. Popups in the header are outside it.
- **Mode before paint:** an Analyst link (`?mode=analyst`) sets
  `data-mode="analyst"` on `<html>` before the first paint (`MODE_SCRIPT`,
  ADR 0015), and the page keeps it in step with the URL. Skeleton parts that
  exist only in Analyst carry `mode-analyst:` (`hidden mode-analyst:block`),
  so the static page already has the Analyst shape and nothing jumps.

## 6. Inventory

### `src/shared/ui` (shadcn, Radix)

| Component | Use it for |
|---|---|
| `Button` | every button; variants `default`, `outline`, `secondary`, `ghost`, `destructive`, `link` |
| `Textarea` | the composer (`rows={1}`, grows with content) |
| `HoverCard` | evidence card on fine pointers (hover and keyboard focus); a click or Enter on the source closes it until the pointer or focus leaves the button (0.11.1, it blinked) |
| `Popover` | the same card on coarse pointers (tap); the map tooltip (virtual anchor at the pointer or the country) |
| `Collapsible` | "What the data shows" (closed by default) |
| `DropdownMenu` | theme, locale and currency switches (the currency menu: symbol, code, name, then the rates' date and the demo note, at least `min-w-72`, as wide as its row in the phone sheet; a pick in the sheet closes the sheet), breadcrumb steps, the map metric picker (`modal={false}`, one trigger width), the markets filter and `Export ▾`. After a mouse or touch pick focus goes back to the trigger without the ring (`focusVisible: false`); Enter or Escape keep the ring (ours, 0.12.0) |
| `Tooltip` | the name of an icon-only control on hover and focus (New chat); hover only, so a note a touch user needs goes in a `Popover` (the table's ⚠ and bell, 0.11.0) |
| `PopperBoundary` (ours) | the scroll area popups inside it belong to; `AppShell` provides `<main>`. `DropdownMenuContent`, `PopoverContent`, `TooltipContent` and `HoverCardContent` read it themselves (§5) |
| `Logo` (ours) | the app mark next to the app name: an M in a rounded square (`size-8 rounded-sm`), `bg-foreground text-background` so dark mode inverts it; `aria-hidden` (0.12.0). The favicon (`app/icon.svg`) and the preview image draw the same mark (0.13.0, ADR 0018) |
| `StatusScreen` (ours) | the 404 and 500 screen (design A, 0.13.0): `Logo` + app name in the corner (a `<header>`); centred: the code (`font-mono text-7xl sm:text-8xl text-input`, `aria-hidden`; `input` gives 3.3:1 in both themes, enough for text this size), `h1`, text, a detail line (address, error ID), buttons `size="lg" h-11` (44 px targets). On a phone the buttons stay under the text, not pinned to the bottom (owner). Texts come in as props, so the global error page can use it without providers |
| `Skeleton` | content not known yet, in the shape of what replaces it (`ConversationSkeleton`: question bubble + answer frame); no pulse under reduced motion |
| `Toaster` / `toast.success` / `toast.error` (sonner) | short confirmations and failures that are not tied to a field ("Thanks for the feedback", "Couldn't copy", a rolled-back alert save); top centre, as wide as the text up to 28rem; `toast.error(message, { label, onClick })` adds one text button (Retry); visible toasts take clicks over a modal sheet (`globals.css`), and pressing one does not close the sheet; the keyboard can't reach them there, so a failed alert save repeats its Retry in the panel (0.11.0) |
| `ErrorBoundary`, `WidgetBoundary` | a failing widget explains itself and offers "Try again" without taking the page down; dashboard widgets pass `name` ("Try again: Key figures") |
| `Card` | dashboard widget frame: `border border-border ring-0`, `h2` inside `CardTitle`, actions in `CardAction` |
| `Breadcrumb` | the drill-down path; callers give it its `aria-label` |
| `MonthPicker` (ours) | month grid with a year switch for monthly data (`Popover` + `Button`, months without data disabled, arrow keys); in `PeriodPicker` |
| `ToggleGroup` | one-of-few choices (Executive / Analyst, 1 / 3 / 12 months): `bg-muted p-0.5`, active item `bg-card shadow-sm`, items `min-h-11` |
| `Sheet` | phone settings (language, theme) from the bottom; the alerts panel from the right on desktop (`w-full sm:max-w-md`, scrolls inside). Backdrop and panel both animate 200 ms, so they leave in one frame |
| `Input`, `Label`, `Select`, `Switch`, `Checkbox` | the alert rule form (0.9.0): `h-11` fields, label above, hint and error below in `text-xs` (error `text-destructive`), tied by `aria-describedby`; the generated sizes use scale steps, not arbitrary values |
| `AlertDialog` | a confirmation before an action that removes something (delete a rule) |
| `Table` | every chart's table alternative; caption `sr-only` |
| `ChartContainer` | Recharts frame (trimmed shadcn chart): series colours are token vars on each mark, legend and tooltip drawn by the chart; a pixel `height` when the chart can be hidden. Import it from `@/shared/ui/chart`, not the index, and only inside a `next/dynamic` chart, so Recharts stays out of the first bundle |
| `Sparkline` | 12-month line in text colour; decorative (`aria-hidden`) unless given a `label` |

**Arbitrary values (0.11.1).** shadcn writes some; they were replaced
with tokens or scale steps where `cn` still merges them right:
`bg-secondary-hover` (§1), `rounded-md` for `min(radius-md, 12px)`,
`ring-3` for `ring-[3px]`, `min-w-24` for `min-w-[96px]`, `rounded-xs` for
`rounded-[2px]`, and `ToggleGroup`'s gap as a class per `spacing` step
(`0`–`4`) instead of an inline `--gap` style with a cast.

`cn` is shadcn's package, imported as-is (ADR 0002), with tailwind-merge's
default config: it knows Tailwind's own names and arbitrary values. A size
or radius under a name of our own (`text-compact`) would read as a colour
or as an unknown class and drop the variant's class, so those stay as
shadcn wrote them; a colour token (`bg-*`) merges fine. `button.test.tsx`
pins it. Kept, each with a comment:

| Where | Value | Why it stays |
|---|---|---|
| `Button` `xs` / `icon-xs`, `ToggleGroup` `sm` | `rounded-[min(var(--radius-md),10px)]` | a radius name of our own would not replace `rounded-lg` in `cn` |
| `Button` `sm`, `Toggle` `sm` | `text-[0.8rem]` | a font-size name of our own would read as a text colour in `cn` |
| `TooltipContent` arrow | `translate-y-[calc(-50%_-_2px)]` | half the arrow plus the 2px gap to the bubble; no scale step |
| `CardHeader` with `CardAction` | `grid-cols-[1fr_auto]` | title takes the room, the action its own width; `grid-cols-N` are equal columns |
| `CardHeader` with `CardDescription` | `grid-rows-[auto_auto]` | two rows as tall as their content; `grid-rows-N` are equal rows |
| `SectionTabBar` (ours) | `pb-[max(0.625rem,env(safe-area-inset-bottom))]` | the phone's home indicator area; `env()` has no utility |
| `MarketStatus` map skeleton (ours) | `aspect-[800/428]`, `md:aspect-[800/356]` | the map's own SVG frames, so the skeleton has the map's shape |

Not values, and fine: selector variants (`data-[size=sm]:`, `has-[>img]:`),
container-query steps (`@min-[11rem]:`), and references to a CSS variable
(`px-(--card-spacing)`, `origin-(--radix-…)`). A new shadcn component is
checked the same way when it is added: replace, or list it here with the
reason.

### Dashboard building blocks (0.5.0)

`DashboardHeader` (`Logo` + app name, path, `PeriodPicker`, `ModeSwitch`, alerts, `CurrencySwitch` (the code, "USD"), language, theme; phone: logo + name + `SettingsSheet` (language, currency, theme, reset), then the path), `ScopeTitle`, `KpiStrip` / `KpiCard`, `MarketStatus` / `StatusTile` / `MarketMap` / `MapLegend` / `MapTooltip`, `MetricPicker`, `TopRisks`, `TopMovers`, `RevenueTrend` (Recharts via `next/dynamic`), and in Analyst `MarketsTable` with `MarketFilter`, `SelectionChips`, `SelectionBar` and `ExportMenu` (0.7.0), `HeatMap` / `HeatGrid` and `ComparisonRadar` (Recharts via `next/dynamic`) (0.8.0), `AlertsButton` in the header and `AlertsPanel` / `RuleList` / `RuleForm` / `RulePreview` / `MarketsField` / `DeleteRuleDialog` (0.9.0, `features/configure-alerts`); `AlertMark` (the bell) from `entities/alert-rule`. Entity UI shared with the assistant: `StatusChip`, `StatusIcon`, `useKpiFormat`, `DatasetGate` (one message when the dataset fails).

- Status tiles: `bg-status-*-muted text-status-*`; off-track adds a `bg-hatch` band (utility in `globals.css`); no status → `bg-muted`; selected (`markets`) → `ring-2 ring-ring`, the open market → `border-foreground`; the accessible name says both.
- "Calculated" badge: a 44px `Popover` trigger (tap opens the formula; a tooltip would never open on a phone), the dashed chip drawn inside it with no background of its own; it keeps the top-right corner (the label wraps) and shows a calculator icon (Σ would read as a sum; most formulas are ratios) when the card's content box is under `11rem` (container query); a plain `<button>` with `min-h-11 min-w-11`, because `Button` paints a hover box around the whole target.
- Phone tab bar (owner, variant E, 2026-11-04): the same segmented look: a `rounded-2xl bg-muted border p-1` track, the current section a `bg-card shadow-sm` chip (`rounded-xl`, `min-h-13`, semibold label); the unread dot has a `ring-muted` edge.
- Skeletons are built from the same `Card` / `CardHeader` / `CardAction` / `CardContent` as the widget, so the title, the corner button and the body sit where the real card puts them. The markets table skeleton is row-shaped (header, 13 markets and the total, 44px each), the heat map's has the card's lines (notice, legend, month row, 13 rows of 44px, the line under the grid, hint, notes), the radar's a chart block under Top risks; Analyst-only parts of a skeleton use `mode-analyst:` (§5).
- Segmented switches (mode, range): `ToggleGroup` `spacing={1}` in a `rounded-xl bg-muted p-1` track; items `min-h-11 px-4`, on = `bg-card shadow-sm`.
- Table/chart toggles: the button names the view it switches to ("Show as table" ↔ "Show as chart"), no `aria-pressed`; remembered with `useStoredFlag` (`mo:revenue-trend-table`, `mo:heat-map-table`, `mo:radar-table`).
- Markets table (0.7.0): sortable headers are ghost buttons inside `<th>` (`min-h-11`, uppercase label, arrow icon at 40% when not sorted) with `aria-sort` on the cell; market names are ghost buttons; the first column `sticky left-0 bg-card`; numbers `font-mono tabular-nums` right-aligned; total in `TableFooter` (`bg-table-footer`, the sticky first cell the same tone, no hover tint, 0.11.1). Filter = `DropdownMenu` (not modal): "At risk or off track", per region an "All of …" checkbox (`indeterminate` shows a dash) and indented market checkboxes that keep the menu open, "Clear all" last; "N of M selected" next to the trigger; `secondary` rounded-full chips with an × on the row below. Market code in `font-mono text-muted-foreground` before the name; an anomaly is a ghost `size-11` ⚠ in `text-status-off-track` that opens a `Popover` with the note on a click or a tap, the note as its name and the popover's (0.11.0); an alert is a ghost `size-11` bell that opens a `Popover` with the rule names on a click or a tap (0.9.0). Removing a chip moves focus to the chip now in its place (or the one before); after the last one, to the card title. The Market status card shows the same chips as a `role="group"` bar labelled "Selected"; clearing it moves focus to the card title. `Export ▾` = `DropdownMenu` with two two-line items (format + what it is for); while the workbook is made the trigger shows a spinner and "Preparing…" (`aria-busy`) and the items wait; a failure is a `toast.error`.
- Market status view switch (0.6.0): `Map / Tiles / Table` as a segmented `ToggleGroup` with icons, remembered with `useStoredChoice` (`mo:market-status-view`; the old `mo:market-status-table` flag still counts). Default: map from `md`, tiles on a phone.
- Market map (0.6.0, `MarketMap` via `next/dynamic`): markets `role="button"` paths with a surface gap stroke, status by colour + pattern (dots at risk, hatching off track, in `card` colour), the open market a `foreground` outline, selected markets a dashed `ring`; keyboard focus a 2.5px `foreground` ring over a 5px `card` halo, drawn after every layer, and a Tab to a market off a zoomed view re-centres on it (keyboard only, 0.11.0); plain land `map-land` with a `border` hairline on `map-sea`. Phones get a taller 800 × 428 frame. A reload with a drill or a selection opens on its fit: the map stays behind a same-size skeleton until the first fit is set (before paint), never the whole world and then a jump. Zoom buttons under the map: 44px on desktop, 36px look with a 44px hit area (`after:-inset-1`) on phones. Legend: a swatch with the same pattern, the step as "from – to" through the app's number formats, and the count.
- Chart motion: `motion-safe:animate-reveal-x` (sparklines), `motion-safe:animate-grow-x origin-left` (bars), Recharts line animation off under `prefers-reduced-motion`. Window marker: dashed `muted-foreground` line (1 month) or `muted` band (3 / 12 months), labelled above the plot.
- Grid cells that hold a card get `min-w-0`, so a wide table scrolls inside its card.
- Top movers bars: `chart-5` for growth, `chart-4` for decline (chart tokens, not status ones); the signed number is the signal.
- Line patterns in charts: actual solid `chart-1`, forecast dashed `chart-5`, prior year dotted `chart-3`, anomaly ring `chart-4`; the legend draws the pattern, not just the colour.
- Heat map (0.8.0): a `<table role="grid">`; cells are 44px buttons (`min-w-10`) with a 2px gap, filled with the step's `scale-*` token and its `-foreground` ink; `font-mono tabular-nums`; focus `ring-4 ring-ring`; a cell's name is its value (and anomaly), the row and column headers give the market and the month, the month header "Mar 26" with the whole month in `sr-only` (0.11.0); anomaly a ⚠ in the top-right corner; the window's headers `bg-foreground text-background` and its cells framed by the same colour in the gap; a selected row has a ◉ icon and semibold name, the open market "· open now"; the line under the grid previews the hovered cell while the mouse is over the grid and otherwise shows the cell last focused or tapped, with two outline `sm` buttons (`min-h-11`, labels wrap), Open and Select that act on it; the scroll box is `relative` so the headers' `sr-only` text cannot widen the page. The table view keeps the ⚠ marks, a list of the anomalies under it, "selected" and "open now". Legend: swatches with "from – to" in the cell's long format.
- Mode badge (0.8.0): next to the page `h1`, a `rounded-full text-xs` chip with an icon and the view's name, `bg-foreground text-background` in Analyst and `bg-muted` in Executive (the words differ too); the line under it is `aria-live="polite"`.
- Alerts (0.9.0): the bell is lucide `Bell` (warning, `text-status-at-risk`) or `BellRing` (critical, `text-status-off-track`), never alone: the rule names follow as text ("Critical alert: …"). Header: a ghost `size-11` bell with the count in a `bg-foreground text-background` pill; the phone's Alerts tab has the same pill. Panel: a muted line saying which month the rules check, then a segmented `ToggleGroup` (Firing · N | Rules · N, like the mode switch) with the primary "New rule" beside it; the form replaces the panel under a ghost "← Back"; in "Chosen markets" each market row is its `Label` (`min-h-11`, the whole row toggles), and a save without a market focuses the first one. Rules as rows (name semibold, the rule in plain words `text-xs muted`, severity + "Flags N markets now", an on/off `Switch` whose hit area is stretched to 46 px with `after:-inset-y-3.5`, ghost Edit / Delete `h-11`), "New rule" primary; the form below the same title; a live preview in a `bg-muted/50` box (`aria-live="polite"`); the demo switch in a dashed box at the bottom. While a rule is written its row is `opacity-60` and `aria-busy`, with a `LoaderCircle` (`motion-safe:animate-spin`) and "Saving…"; its switch is `aria-disabled` (not `disabled`, which drops focus). A failed write shows in its row as a `border-destructive/40` box with `CircleAlert`, the reason, an outline Retry and a ghost Dismiss (both `h-11`); a failed new rule's box is above the list; afterwards focus goes to the row or the named list, which take focus from code only and show the `ring-3 ring-ring/50` ring (0.11.0). Above the rules, "Firing now" (`h3`, focusable for the toast's Show): a row per market with the bell, the name, one muted line per rule (figure · rule) and an outline `h-11` "Open" (the market's name in its label).
- Comparison radar (0.8.0): series `series-1…4`, solid / dashed / dotted / dash-dot with circle / square / triangle / diamond markers, fill at 6 %; portfolio `muted-foreground` dashed, no fill; no radius ticks (positions are relative); the HTML legend draws line + marker; tooltip and table show real values.

### Assistant building blocks (`src/widgets/assistant-panel/ui`)

`AssistantPanel` (header "✦ Assistant · Answers in English", New chat, log, composer),
`Conversation` (`role="log"`, sticky bottom, "New content"), `AnswerMessage`
(states below), `SourceButton` + `EvidenceCard` (numbers, status, 12-month
chart with the anomaly marked), `DataCheckBlock` (table: Scope, Attain.,
Growth, Status; "Not mentioned in the answer"; attention summary;
"Show on dashboard"; status for the latest month only), `AnswerActions` (Copy,
👍 / 👎 with a reason), `StatusChip`.

Answer states, each from the "A · Assistant" board:

| State | Look |
|---|---|
| Streaming | neutral frame (`muted` border, no AI colour yet), caret, "Sources and confidence appear when the answer is complete" |
| Answer | `surface-ai` with ✦ label, paragraphs, confidence, sources, then the data block |
| Can't answer | dashed `muted` box with ⊘ "I can't answer this from the data"; suggestions after two in a row |
| Stopped | dashed `surface-ai`, "Stopped — answer incomplete", "Ask again" |
| Error | `status-off-track-muted` alert with the message and "Try again" |

The answer's kind is known only at the end of the stream (`done`), which is
why streaming starts neutral.

## 7. Do not

- Raw colours or arbitrary values; a colour that is not a token.
- Colour as the only signal (status, confidence, "not mentioned").
- Render AI text as HTML or Markdown: plain paragraphs only.
- Icons as emoji: use `lucide-react` with `aria-hidden` and a text label.
- A second copy of a shadcn component "with small changes".
- Layout that depends on `matchMedia` for the first paint (it flashes on
  the static page); use CSS, keep `useMediaQuery` for behaviour.

## 8. Before opening the editor

- [ ] Searched `shared/ui` and the shadcn registry.
- [ ] Every colour is a token; new pairs added to `tokens.test.ts`.
- [ ] Strings in all three message files; numbers through `formats.ts`.
- [ ] Targets ≥ 44px, focus visible, works with the keyboard.
- [ ] Checked in light and dark, `en-GB` and `ru-RU`, phone and desktop.
- [ ] `motion-reduce:` on anything that moves.

## 9. How this file stays true

Written from the code on 2026-11-03. It goes stale when a component or
token is added without a line here: the reviewer of that change asks for
the line. Quick checks:

```bash
# tokens defined vs tokens documented
grep -o -- '--color-[a-z0-9-]*' src/app/styles/globals.css | sort -u
# shared/ui components
ls src/shared/ui
```
