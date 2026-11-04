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
| Map | `map-sea`, `map-land`, `map-hatch` |
| Attainment scale | `scale-1` … `scale-7`, text on each step: `scale-N-foreground` |

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
  heading).
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
  "New content" pill, `rounded-sm` for the confidence bars.
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

## 6. Inventory

### `src/shared/ui` (shadcn, Radix)

| Component | Use it for |
|---|---|
| `Button` | every button; variants `default`, `outline`, `ghost`, `destructive`, `link` |
| `Textarea` | the composer (`rows={1}`, grows with content) |
| `HoverCard` | evidence card on fine pointers (hover and keyboard focus) |
| `Popover` | the same card on coarse pointers (tap) |
| `Collapsible` | "What the data shows" (closed by default) |
| `DropdownMenu` | theme and locale switches |
| `Tooltip` | the name of an icon-only control on hover and focus (New chat) |
| `Skeleton` | content not known yet, in the shape of what replaces it (`ConversationSkeleton`: question bubble + answer frame); no pulse under reduced motion |
| `Toaster` / `toast.success` / `toast.error` (sonner) | short confirmations and failures that are not tied to a field ("Thanks for the feedback", "Couldn't copy"); top centre, as wide as the text up to 28rem |
| `ErrorBoundary`, `WidgetBoundary` | a failing widget explains itself and offers "Try again" without taking the page down; dashboard widgets pass `name` ("Try again: Key figures") |
| `Card` | dashboard widget frame: `border border-border ring-0`, `h2` inside `CardTitle`, actions in `CardAction` |
| `Breadcrumb` | the drill-down path; callers give it its `aria-label` |
| `MonthPicker` (ours) | month grid with a year switch for monthly data (`Popover` + `Button`, months without data disabled, arrow keys); in `PeriodPicker` |
| `ToggleGroup` | one-of-few choices (Executive / Analyst, 1 / 3 / 12 months): `bg-muted p-0.5`, active item `bg-card shadow-sm`, items `min-h-11` |
| `Sheet` | phone settings (language, theme) from the bottom |
| `Table` | every chart's table alternative; caption `sr-only` |
| `ChartContainer` | Recharts frame (trimmed shadcn chart): series colours are token vars on each mark, legend and tooltip drawn by the chart; a pixel `height` when the chart can be hidden |
| `Sparkline` | 12-month line in text colour; decorative (`aria-hidden`) unless given a `label` |

### Dashboard building blocks (0.5.0)

`DashboardHeader` (path, `PeriodPicker`, `ModeSwitch`, language, theme; phone `SettingsSheet`), `ScopeTitle`, `KpiStrip` / `KpiCard`, `MarketStatus` / `StatusTile`, `TopRisks`, `RevenueTrend` (Recharts via `next/dynamic`). Entity UI shared with the assistant: `StatusChip`, `StatusIcon`, `useKpiFormat`, `DatasetGate` (one message when the dataset fails).

- Status tiles: `bg-status-*-muted text-status-*`; off-track adds a `bg-hatch` band (utility in `globals.css`); no status → `bg-muted`; highlighted from the assistant → `ring-2 ring-ring`, and the accessible name says so.
- Line patterns in charts: actual solid `chart-1`, forecast dashed `chart-5`, prior year dotted `chart-3`, anomaly ring `chart-4`; the legend draws the pattern, not just the colour.

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
