# 0015. Persisted UI state before first paint: inline script in `<head>`

**Context.** The assistant panel on desktop can be collapsed to a rail, and the choice is remembered. The pages are prerendered once for every visitor (static SSG, ADR 0010), so the server cannot know the choice. Reading it in React (`useEffect`, `useLayoutEffect`) runs after the browser has already painted the static HTML: the owner saw the panel open and then close about a second later (2026-11-03).

**Decision** (owner decision, 2026-11-03): the pattern from the Next.js guide "Preventing flash before hydration" (`docs/01-app/02-guides/preventing-flash-before-hydration`, checked via Context7, 2026-11-03), the same mechanism `@wrksz/themes` already uses for the theme (ADR 0009):
- A small inline `<script>` in the `<head>` of the root layout `app/[locale]/layout.tsx` reads `localStorage` `mo:assistant-collapsed` while the HTML is parsed and sets `data-assistant-collapsed` on `<html>` before the first paint. `<html suppressHydrationWarning>` is already set.
- **How it gets into the HTML (0.9.0):** `BeforePaintScripts` (`src/app/providers`) inserts one `<script>` holding all three marks through Next's `useServerInsertedHTML`, the way `@wrksz/themes` inserts its own. It lands in the `<head>` of the static HTML (checked in the build) and is not part of the React tree. A plain `<script>` in the layout's JSX also worked, but React renders the tree again on the client, where such a script never runs, and warned "Encountered a script tag while rendering React component" (owner, 2026-11-05).
- The script is the stringified function `applyPanelCollapsed` in `src/widgets/app-shell/model/panel-collapsed-script.ts`, a module without `'use client'` so the server layout can import it; the function is unit-tested directly. A blocked storage (`try/catch`) leaves the panel open.
- Layout is CSS only: the custom variant `assistant-collapsed` (`&:where([data-assistant-collapsed] *)`) switches widths and visibility. React reads and writes the same attribute through `useSyncExternalStore` (`use-panel-collapsed.ts`), so there is one source of truth.

**Alternatives.**
- `useEffect` / `useLayoutEffect`: both run after the first paint of static HTML; the flash stays.
- Cookie read on the server (`cookies()`): correct HTML from the server, but the route becomes dynamic and loses SSG (ADR 0010).
- Partial prerendering / Cache Components: needs a server per request for the dynamic part; same loss.
- A proxy that rewrites to two prerendered variants: twice the pages for one boolean, more moving parts.
- `next/script` with `strategy="beforeInteractive"`: the same inline script with extra wiring; the guide uses a plain `<script>`.

**Consequences.**
- Any future persisted UI state that changes the first paint uses the same pattern: an attribute on `<html>` plus CSS, not `matchMedia` or state in the first render (`DESIGN.md` §7).
- Applied a second time in 0.5.0 for the phone `?tab=assistant` link: `SECTION_SCRIPT` (`src/features/switch-section/model/section-script.ts`) sets `data-section="assistant"`, the `section-assistant` variant shows the assistant area in the static fallback, and the app shell removes the attribute on mount (from then on the URL decides). From 0.9.0 `?tab=alerts` too (`data-section="alerts"`, variant `section-alerts`: the alerts skeleton instead of Overview).
- Applied a third time in 0.7.0 for `?mode=analyst`: `MODE_SCRIPT` (`src/features/switch-mode/model/mode-script.ts`) sets `data-mode="analyst"`, and the `mode-analyst` variant shows the Analyst parts of the static skeletons (the markets table, the map card's metric picker and hint; from 0.8.0 also the radar and the heat map), so the page does not grow on hydration. Unlike `data-section`, the attribute stays: `useModeAttribute` keeps it in step with the URL, so skeletons shown later (data loading, a remembered view not read yet) also have the mode's shape.
- Not used for the remembered table/chart toggles (0.5.0, `useStoredFlag`): those cards are never in the static HTML (they wait for the dataset), so the hook reports "unknown" while hydrating and the card keeps its skeleton until the choice is read. No script, no flash.
- A future `Content-Security-Policy` must allow these inline scripts by hash or nonce; the theme script needs the same. There is no CSP today.
- The script blocks parsing for a few microseconds; it must stay tiny and must never throw.
