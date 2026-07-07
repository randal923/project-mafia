---
title: 'Decision Modal Story Focus'
type: 'feature'
created: '2026-07-07'
status: 'done'
route: 'one-shot'
---

# Decision Modal Story Focus

## Intent

**Problem:** The DecisionModal story text did not have enough vertical presence, while the option buttons took too much space and competed with the narrative in a narrow modal.

**Approach:** Extract a reusable `StoryPanel` for framed story text, use it inside a slightly wider DecisionModal with more vertical presence, then make the option buttons shorter with smaller label and description text.

## Suggested Review Order

- Review the standalone story container styling and type scale.
  [`StoryPanel.tsx:6`](../../client/src/components/StoryPanel/StoryPanel.tsx#L6)

- Check how DecisionModal composes the story panel above tighter options.
  [`DecisionModal.tsx:78`](../../client/src/components/DecisionModal/DecisionModal.tsx#L78)

- Confirm Storybook covers the new standalone story panel.
  [`StoryPanel.stories.tsx:4`](../../client/src/components/StoryPanel/StoryPanel.stories.tsx#L4)

- Verify the design-system guidance distinguishes StoryPanel from NarrativeCard.
  [`design-system.md:87`](../../docs/design-system.md#L87)
