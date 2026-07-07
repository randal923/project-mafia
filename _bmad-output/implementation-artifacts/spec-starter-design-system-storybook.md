---
title: 'Starter Design System and Storybook'
type: 'feature'
created: '2026-07-07'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: 'b00fe087bee67cc232825854157b93bd2c09d75a'
context: []
---

<frozen-after-approval reason="human-owned intent -- do not modify unless human renegotiates">

## Intent

**Problem:** The project has BMad planning scaffolding but no Next.js app, design-system contract, or component viewer. Engineers and AI agents need a concrete UI foundation before feature work starts, especially because the game will rely on generated narrative content and should keep a consistent world tone.

**Approach:** Bootstrap a TypeScript-first Next.js frontend in `client/` with Storybook as the component workbench. Add Tailwind theme tokens, a lean design-system document, and a small set of reusable components that establish the initial browser-game interface language without locking the future game mechanics.

## Boundaries & Constraints

**Always:** Use Yarn. Keep the setup TypeScript-first. Keep the Next.js app package under `client/`. Use Next.js App Router conventions. Use Tailwind for app and component styling, with only the required Tailwind global entry/theme file. Use `next/font/google` with Jost as `--font-mafia-sans` and Cormorant Garamond weights 600/700 as `--font-mafia-serif`. Add only dependencies required for Next.js, React, Storybook, Tailwind, TypeScript, and lint/build support. Keep components accessible by default with explicit props, stable keys when lists are introduced, Tailwind theme tokens for reusable design values, and no browser-exposed secrets. Keep each exported component in its own file named after the main export.

**Ask First:** Adding a UI kit such as shadcn, MUI, Radix beyond direct component needs, animation libraries, backend code, database/schema work, authentication, multiplayer/realtime infrastructure, LLM API integration, or paid/hosted service configuration.

**Never:** Do not build gameplay systems, AI narrative generation, account flows, or backend endpoints in this slice. Do not add generic abstraction layers, factories, validators, adapters, or new helper frameworks. Do not copy The Crims branding, names, art, or protected assets.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| App shell renders | Developer runs the Next.js dev server | The first route shows a usable game-dashboard style shell composed from local design-system components | Build/runtime failures should surface through Next.js, not custom swallowed errors |
| Component workbench renders | Developer runs Storybook | Storybook lists seed components and visual foundations with representative states | Missing stories or invalid metadata fail through Storybook build output |
| Design contract is consumed | Engineer or AI agent opens the design-system document | The document explains Tailwind tokens, typography, layout, component rules, accessibility floor, and do/don't guidance for future UI work | Unknown future design decisions are marked as out of scope rather than silently invented |

</frozen-after-approval>

## Code Map

- `client/package.json` -- project scripts and runtime/dev dependencies for Next.js, Storybook, Tailwind, TypeScript, linting, and build commands.
- `client/yarn.lock` -- Yarn-managed dependency lockfile after install.
- `client/next.config.ts` -- minimal Next.js configuration.
- `client/tsconfig.json` -- strict TypeScript configuration for app, Storybook, and generated Next types.
- `.gitignore` -- excludes dependencies, build output, environment files, and local caches.
- `client/postcss.config.mjs` -- Tailwind PostCSS plugin configuration.
- `client/.storybook/main.ts` -- Storybook integration for Next.js.
- `client/.storybook/preview.ts` -- global Storybook Tailwind import and parameters.
- `docs/design-system.md` -- human/AI-facing design style contract for the initial mafia narrative browser-game UI.
- `client/src/app/layout.tsx` -- server component root layout, metadata, and Next font variable wiring.
- `client/src/app/page.tsx` -- first usable screen composed from seed components.
- `client/src/app/globals.css` -- Tailwind import, theme tokens, and minimal base layer.
- `client/src/components/Button/Button.tsx` -- accessible Tailwind-styled command button component.
- `client/src/components/Button/Button.stories.tsx` -- Button Storybook states.
- `client/src/components/StatPanel/StatPanel.tsx` -- compact Tailwind-styled status/readout component for game resources.
- `client/src/components/StatPanel/StatPanel.stories.tsx` -- StatPanel examples.
- `client/src/components/NarrativeCard/NarrativeCard.tsx` -- Tailwind-styled narrative event card for LLM-authored world text previews.
- `client/src/components/NarrativeCard/NarrativeCard.stories.tsx` -- NarrativeCard examples.

## Tasks & Acceptance

**Execution:**
- [x] `client/package.json` -- create Yarn scripts for `dev`, `build`, `lint`, `storybook`, and `build-storybook` -- makes the project runnable and reviewable.
- [x] `client/next.config.ts`, `client/tsconfig.json`, `.gitignore` -- add minimal project configuration -- provides a conventional Next.js TypeScript baseline.
- [x] `client/postcss.config.mjs`, `client/src/app/globals.css` -- configure Tailwind and theme tokens -- makes Tailwind the app styling system.
- [x] `client/.storybook/main.ts`, `client/.storybook/preview.ts` -- configure Storybook for Next.js and Tailwind -- enables isolated component review.
- [x] `client/src/app/layout.tsx`, `client/src/app/page.tsx` -- implement the starter app shell and requested font variables -- gives the design system a real first screen.
- [x] `client/src/components/Button/Button.tsx`, `client/src/components/Button/Button.stories.tsx` -- implement and document the command button -- establishes interactive control patterns.
- [x] `client/src/components/StatPanel/StatPanel.tsx`, `client/src/components/StatPanel/StatPanel.stories.tsx` -- implement and document resource readouts -- supports dashboard-style game state.
- [x] `client/src/components/NarrativeCard/NarrativeCard.tsx`, `client/src/components/NarrativeCard/NarrativeCard.stories.tsx` -- implement and document generated-world narrative previews -- anchors the LLM narrative concept visually.
- [x] `docs/design-system.md` -- document visual identity, tokens, layout, components, accessibility, and AI/engineer rules -- creates the handoff contract the user requested.

**Acceptance Criteria:**
- Given a clean checkout with dependencies installed, when `yarn build` runs from `client/`, then the Next.js app compiles successfully.
- Given dependencies are installed, when `yarn build-storybook` runs from `client/`, then Storybook produces a static build with the seed components.
- Given an engineer opens `docs/design-system.md`, when they create a new component, then they can identify the required Tailwind token usage, accessibility floor, and component-file conventions.
- Given the home route renders, when viewed on mobile and desktop widths, then text remains readable and primary UI elements do not overlap.
- Given Storybook opens, when browsing the Button, StatPanel, and NarrativeCard stories, then each component exposes at least two meaningful visual states.

## Design Notes

The initial direction should feel like a criminal-world operations console rather than a marketing landing page: dense, readable, and game-like, with narrative texture but no copied IP. Use Jost for operational UI text and Cormorant Garamond 600/700 for selective story, title, and world-flavor moments. Use a dark neutral base, restrained danger/accent colors, sharp typography, small-radius panels, and clear command hierarchy. Treat generated narrative text as first-class content by giving it a specific component pattern early.

## Verification

**Commands:**
- `cd client && yarn install` -- expected: dependencies install and `yarn.lock` is created.
- `cd client && yarn lint` -- expected: no lint errors.
- `cd client && yarn build` -- expected: Next.js production build succeeds.
- `cd client && yarn build-storybook` -- expected: Storybook static build succeeds.
