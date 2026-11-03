---
paths:
  - "src/**/ui/**"
  - "src/app/styles/**"
---

# UI rules

- Reuse order: `src/shared/ui` → shadcn registry (`pnpm dlx shadcn@latest search`) → new component.
- shadcn components live in `src/shared/ui` (aliases in `components.json`). Use built-in variants before custom classes.
- Semantic tokens only (`bg-surface-ai`, `text-status-at-risk`), defined in `@theme`. No raw hex, no arbitrary values.
- AI-generated content and source-of-truth data use different surface tokens and are labelled in text, not by colour alone.
- Accessibility: keyboard reachable, visible focus, ARIA names, `prefers-reduced-motion` respected, WCAG 2.1 AA contrast. Use the `accessibility` skill to audit.
- Charts: accessible table alternative, keyboard-reachable points, never colour as the only signal. Use the `dataviz` skill for palettes.
