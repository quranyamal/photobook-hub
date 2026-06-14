# ADR-0006 UI Component Strategy

Status: Accepted

Date: 2026-06-14

---

## Context

PhotoBook Hub requires a consistent, accessible, and maintainable UI component library for all customer-facing pages and the admin panel.

The questions to answer:

1. Should we build components from scratch, use a full component library, or use a headless + styled approach?
2. How do we ensure components stay consistent with the Tailwind v4 design system already in place?
3. How do we avoid vendor lock-in while still moving fast at MVP stage?

---

## Decision

Use **shadcn/ui** as the component strategy.

shadcn/ui is not a traditional component library — it is a collection of copy-pasteable, unstyled-to-styled components built on top of Radix UI primitives and Tailwind CSS. Components are copied into `src/components/ui/` and owned by the project.

Components installed for MVP:
- `Button` — primary interaction element
- `Input` — form text fields
- `Label` — accessible form labels
- `Form` — react-hook-form integration with field-level error display
- `Card` — content containers for dashboard and order summaries

Additional components are added per sprint as needed via `pnpm dlx shadcn@latest add <component>`.

Design tokens are defined as CSS variables in `globals.css`, compatible with Tailwind v4's `@theme` directive.

---

## Consequences

### Positive

* Components live in the codebase — fully customisable without forking a library
* Built on Radix UI primitives — accessible by default (keyboard navigation, ARIA attributes, focus management)
* Tailwind v4 compatible — tokens defined via CSS variables and `@theme`
* Fast to set up — the CLI scaffolds components with sensible defaults
* No runtime dependency on an external component library — bundle size is minimal
* Easy to extend or replace individual components without migration risk

### Negative

* Each component must be individually added via CLI or manually maintained
* Upgrades to shadcn/ui patterns require manually updating copied files
* More initial setup than dropping in a full library like MUI or Chakra

---

## Alternatives Considered

### Material UI (MUI)

A full React component library with built-in design system.

Rejected because: heavy bundle, opinionated styling that conflicts with Tailwind, requires significant theming work to match the project's design direction.

### Chakra UI

Accessible component library with a design system.

Rejected because: does not integrate well with Tailwind CSS; would require maintaining two styling systems.

### Headless UI (Tailwind Labs)

Unstyled accessible components from the Tailwind team.

Rejected because: smaller component set than shadcn/ui; more styling work required; shadcn/ui builds on a similar philosophy but provides more complete components out of the box.

### Custom components from scratch

Build every component without a library.

Rejected because: accessibility is non-trivial to implement correctly (focus traps, ARIA, keyboard nav). Radix UI handles this correctly; reinventing it adds risk and time without business value.

---

## References

- `CLAUDE.md` — Technology Stack (shadcn/ui listed)
- shadcn/ui: https://ui.shadcn.com
- Radix UI: https://www.radix-ui.com
- Tailwind CSS v4: https://tailwindcss.com
