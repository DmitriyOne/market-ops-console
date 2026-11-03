# 0009. Theming and dark mode

**Context.** Light and dark themes are a UX requirement. Must work with shadcn/ui, Tailwind v4 and the App Router without a flash of the wrong theme.

**Decision.** The official shadcn/ui approach (checked in shadcn and Tailwind docs via Context7, 2026-11-03):
- `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`; `<html suppressHydrationWarning>`.
- Provider in `src/app/providers`; theme toggle (Light / Dark / System) built from shadcn `DropdownMenu` + `Button`, lives in `features/switch-theme`.
- Tokens in `src/app/styles/globals.css`: `@custom-variant dark (&:is(.dark *));`, values in `:root` and `.dark` (OKLCH), exposed through `@theme inline`. Our semantic tokens (status, confidence, AI vs source surfaces, chart and heat-map scales) follow the same pattern as shadcn's `--warning` example.
- Charts read colours from CSS variables (shadcn `ChartConfig`), so they switch theme with no JS.

**Alternatives.** Media-query only (no manual toggle); own provider with a cookie (more code, same result).

**Consequences.** One extra dependency (`next-themes` 0.4.6, last release March 2025, React 19 compatible). Every token needs a contrast-checked dark value; the heat-map diverging scale is validated in both themes.
