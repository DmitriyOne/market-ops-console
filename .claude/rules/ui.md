---
paths:
  - "src/**/ui/**"
  - "src/app/styles/**"
---

# UI rules

- Reuse order: `src/shared/ui` → shadcn registry (`pnpm dlx shadcn@latest search`) → new component.
- shadcn components live in `src/shared/ui` (aliases in `components.json`). Use built-in variants before custom classes.
- Semantic tokens only (`bg-surface-ai`, `text-status-at-risk`), defined in `@theme`. No raw hex, no arbitrary values. A shadcn component added later is cleaned the same way; the three values kept in generated code are listed in DESIGN.md §6 with the reason (0.11.1).
- AI-generated content and source-of-truth data use different surface tokens and are labelled in text, not by colour alone.
- Accessibility: keyboard reachable, visible focus, ARIA names, `prefers-reduced-motion` respected, WCAG 2.1 AA contrast. Use the `accessibility` skill to audit.
- Focus (0.11.0): a control that is busy for a moment is `aria-disabled`, not `disabled` (a disabled control drops focus to the page's start); when a button removes itself, move focus to a named neighbour; inside a modal sheet the keyboard can't reach a toast, so its action is repeated in the panel; keyboard-only visuals (a focus ring drawn by hand, moving a view) check `:focus-visible`, since a tap focuses too.
- Charts: accessible table alternative, keyboard-reachable points, never colour as the only signal. Use the `dataviz` skill for palettes.
