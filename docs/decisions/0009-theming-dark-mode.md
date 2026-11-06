# 0009. Theming and dark mode

**Context.** Light and dark themes are a UX requirement. Must work with shadcn/ui, Tailwind v4 and the App Router without a flash of the wrong theme.

**Decision.** The shadcn/ui approach (checked in shadcn and Tailwind docs via Context7, 2026-11-03), with `@wrksz/themes` instead of `next-themes` (owner decision, 2026-11-03, see below):
- `@wrksz/themes` `ThemeProvider` from `@wrksz/themes/next` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`; `<html suppressHydrationWarning>`. It is a server component (builds the anti-flash script on the server and injects it with `useServerInsertedHTML`), so it is mounted in the root layout `app/[locale]/layout.tsx`; `useTheme` comes from `@wrksz/themes/client`.
- theme toggle (Light / Dark / System) built from shadcn `DropdownMenu` + `Button`, lives in `features/switch-theme`.
- Tokens in `src/app/styles/globals.css`: `@custom-variant dark (&:is(.dark *));`, values in `:root` and `.dark` (OKLCH), exposed through `@theme inline`. Our semantic tokens (status, confidence, AI vs source surfaces, chart and heat-map scales) follow the same pattern as shadcn's `--warning` example.
- Charts read colours from CSS variables (shadcn `ChartConfig`), so they switch theme with no JS.

**Alternatives.** Media-query only (no manual toggle); own provider with a cookie (more code, same result).

**Why not next-themes.** With React 19 / Next 16.2+, `next-themes` 0.4.6 renders its `<script>` inside the React tree and the browser warns "Encountered a script tag while rendering React component" ([issue #385](https://github.com/pacocoursey/next-themes/issues/385), open; fix PR #386 unmerged; no release since March 2025). `@wrksz/themes` is a drop-in replacement (same props, same `theme` storage key, so saved preferences carry over) that injects the script outside the tree.

**Consequences.** One extra dependency (`@wrksz/themes` 2.1, MIT, peer `next >=16`). Every token needs a contrast-checked dark value; the heat-map diverging scale is validated in both themes.
