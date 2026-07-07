# Project Mafia Design System

This document is the starting visual and component contract for the browser game UI. It applies to app screens, Storybook examples, and future AI-assisted implementation work until a later UX pass replaces or extends it.

## Product Feel

Project Mafia should feel like an operations console for a living crime world. The interface is dense, readable, and tense. It should not feel like a marketing landing page, a generic admin template, or a copy of any existing crime game brand.

Use narrative texture where it helps the player understand the world. Keep controls direct and practical.

## Tokens

The Next.js app lives in `client/`. Styling uses Tailwind utilities. Tokens live in `client/src/app/globals.css` in Tailwind's `@theme` block.

### Typography

- Font definitions live in `client/src/app/mafiaFonts.ts` so the app and Storybook share the same font variables.
- Storybook includes `Foundations/Typography`, backed by `client/src/design-system/typographyStyles.ts`, for the approved semantic type styles.
- `--font-mafia-sans`: Oswald through `next/font/google`, weights `400`, `500`, `600`, and `700`.
- `--font-mafia-display`: Bebas Neue through `next/font/google`.
- Use Oswald for operational UI: body text, forms, ledgers, descriptions, repeated interface text, and secondary labels.
- Use Bebas Neue for screen titles, chapter states, stat values, buttons, major labels, and high-impact story moments.
- Pick typography by content intent, such as screen title, panel heading, command label, narrative body, or metadata. Do not choose sizes ad hoc when a documented semantic style fits.
- Do not use viewport-scaled font sizes. Use fixed `rem` sizes and media queries.
- Letter spacing is `0` unless a future design pass explicitly changes it.

### Color

- Page base: near-black neutral, not blue-black.
- Surfaces: black and warm-black panels with visible thin borders.
- Title: light warm off-white for major headings without competing with story body copy.
- Danger: restrained red for heat, risk, hostile turns, and urgent narrative state.
- Brass: emphasis, title color, labels, selected command borders, and status markers.
- Teal: focus, informational accents, and selected operational state.
- Profit green: positive economic movement only.

Do not turn whole screens into one hue family. Red, brass, teal, green, and neutral each have specific jobs.

### Shape, Spacing, Depth

- Use `2px` radius for compact controls and panels.
- Panels should be framed by borders and horizontal rules first, shadow second.
- Use tight, repeatable spacing from the global `--space-*` scale.
- Avoid nested cards. Page sections should be layout regions; cards are for repeated items, panels, and focused tools.

## Components

### Button

File: `client/src/components/Button/Button.tsx`

Use for explicit commands only.

- `primary`: decisive turn or commit actions, shown as black controls with brass borders.
- `secondary`: contextual actions that move play forward, shown with lower-contrast brass emphasis.
- `quiet`: low-emphasis actions such as archive or cancel.
- Disabled buttons must stay visible and non-interactive.
- Button text must be short and action-led.

### StatPanel

File: `client/src/components/StatPanel/StatPanel.tsx`

Use for compact game resources and operational readings.

- Keep values short.
- Use `profit` only for positive economic movement.
- Use `danger` for heat, risk, scarcity, or hostile pressure.
- Use `neutral` for ordinary resources.

### NarrativeCard

File: `client/src/components/NarrativeCard/NarrativeCard.tsx`

Use for LLM-authored world events, rumors, consequences, and story hooks.

- The title should carry the story beat.
- Body text should be one focused narrative moment, not a full scene dump.
- Use `urgent` when the player should treat the event as risky or time-sensitive.
- Include an action when there is a clear next player decision.

### Tag

File: `client/src/components/Tag/Tag.tsx`

Use for compact labels inside cards, ledgers, and decision surfaces.

- Keep labels short.
- Use tags to identify place, category, or metadata, not primary status or risk.
- Pair tags with surrounding copy when the label affects player decisions.

### Frame

File: `client/src/components/Frame/Frame.tsx`

Use to frame focused story text or other concise content inside a larger interaction surface, such as a modal or decision flow.

- Keep the story concise enough to read before choosing.
- Use it when narrative context is more important than surrounding controls.
- Do not use it for repeated event feeds; use `NarrativeCard` for those.

### DecisionModal

File: `client/src/components/DecisionModal/DecisionModal.tsx`

Use for player-facing narrative choices with exactly two options.

- Keep the title short and consequence-oriented.
- The intro should frame the choice in one focused story beat.
- Each option must include a label and plain-language consequence description.
- Use native dialog behavior through the component's controlled `open` prop.

### DropdownMenu

File: `client/src/components/DropdownMenu/DropdownMenu.tsx`

Use for compact single-choice controls.

- Prefer native select behavior over custom menu JavaScript.
- Labels must describe the choice, not the data type.
- Use helper text when the choice affects turn resolution or player risk.

### NavigationBar

File: `client/src/components/NavigationBar/NavigationBar.tsx`

Use for primary game navigation between major surfaces.

- Keep labels short and noun-based.
- Use `activeItemId` so the current surface is clear through more than color.
- Badges should be short counts or urgent markers only.

### Toast

File: `client/src/components/Toast/Toast.tsx`

Use for short feedback after game actions resolve.

- `success`: completed action or favorable outcome.
- `failure`: blocked action, lost resource, or exposed crew.
- `info`: new neutral information.
- `warning`: elevated risk or pending consequence.
- Toast text should be actionable or explanatory, not decorative flavor copy.

### Table

File: `client/src/components/Table/Table.tsx`

Use for dense ledgers, crew lists, resource logs, district reports, and other structured game data.

- Always provide a concise caption so the table has an accessible name.
- Use descriptions when a table affects player decisions or turn resolution.
- Keep column headers short and noun-based.
- Mark the identifying first column as a row header when rows have names.
- Use right alignment for numeric values.
- Use `profit` only for positive economic movement and `danger` for risk, heat, or scarcity.
- Provide an empty message for tables that can legitimately have no rows.

## Layout

- First screens should be usable product surfaces, not landing pages.
- Prefer dashboards, ledgers, maps, crew views, city districts, and event feeds.
- Use CSS grid for major regions and stable dimensions for panels and repeated controls.
- Mobile layouts stack into one column and preserve command hierarchy.
- Text must never overlap controls or adjacent panels.

## Accessibility Floor

- Interactive elements must be keyboard reachable.
- Focus states must be visible against the active surface.
- Use semantic HTML before ARIA.
- Buttons remain native `button` elements unless a route link is required.
- Color cannot be the only way to understand risk, profit, urgency, or selection.
- Body copy should stay readable on dark surfaces.

## File Rules

- One exported top-level component per component file.
- Name files after the main export.
- Use named component exports.
- Keep component props explicit and minimal.
- Use Tailwind utilities in component `className` values.
- Do not add CSS modules for components.
- Add a Storybook story for every reusable component.
- Stories must show at least two meaningful states for components with variants.

## Do

- Build from Tailwind theme tokens in `client/src/app/globals.css`.
- Use Oswald for readable interface copy.
- Use Bebas Neue for condensed, all-caps game UI moments.
- Keep game surfaces information-rich but scannable.
- Treat generated narrative as product content, not decoration.

## Do Not

- Do not add a UI kit, animation library, or styling framework without approval.
- Do not add component CSS modules.
- Do not introduce decorative blobs, floating cards inside cards, or generic SaaS hero sections.
- Do not copy names, art, language, or branding from existing crime games.
- Do not expose secrets or LLM prompts in browser-rendered code.
- Do not invent gameplay rules in component work unless a product spec requires them.
