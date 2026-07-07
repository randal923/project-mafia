---
title: 'Tag Component'
type: 'feature'
created: '2026-07-07'
status: 'done'
route: 'one-shot'
---

# Tag Component

## Intent

**Problem:** NarrativeCard owned the inline tag markup, making the “South Pier” treatment unavailable to other components.

**Approach:** Extract the label styling into a reusable `Tag` component, compose it from NarrativeCard, and document the intended use.

## Suggested Review Order

- Review the reusable label styling.
  [`Tag.tsx:6`](../../client/src/components/Tag/Tag.tsx#L6)

- Confirm NarrativeCard now composes the tag instead of owning its markup.
  [`NarrativeCard.tsx:2`](../../client/src/components/NarrativeCard/NarrativeCard.tsx#L2)

- Check Storybook coverage for normal and longer labels.
  [`Tag.stories.tsx:4`](../../client/src/components/Tag/Tag.stories.tsx#L4)

- Verify the design-system guidance keeps the tag place-focused.
  [`design-system.md:82`](../../docs/design-system.md#L82)
