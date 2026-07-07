---
title: 'Narrative Card Layout Refinement'
type: 'feature'
created: '2026-07-07'
status: 'done'
route: 'one-shot'
---

# Narrative Card Layout Refinement

## Intent

**Problem:** NarrativeCard needed clearer vertical rhythm between the tag, body copy, and action while the title was reading too large for the card.

**Approach:** Reduce the title scale by one Tailwind step, add more top spacing before the body and action, and align the optional action row to the right.

## Suggested Review Order

- Confirm the title scale, story spacing, and right-aligned action layout.
  [`NarrativeCard.tsx:40`](../../client/src/components/NarrativeCard/NarrativeCard.tsx#L40)
