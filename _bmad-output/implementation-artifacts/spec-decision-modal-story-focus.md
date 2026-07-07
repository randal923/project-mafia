---
title: 'Decision Modal Story Focus'
type: 'feature'
created: '2026-07-07'
status: 'done'
route: 'one-shot'
---

# Decision Modal Story Focus

## Intent

**Problem:** The Modal story text did not have enough vertical presence, while the option buttons took too much space and competed with the narrative in a narrow modal.

**Approach:** Extract a reusable `Frame` for framed content, use it around story text inside a slightly wider Modal with more vertical presence, then make the option buttons shorter with smaller label and description text.

## Suggested Review Order

- Review the standalone story container styling and type scale.
  [`Frame.tsx:6`](../../client/src/components/Frame/Frame.tsx#L6)

- Check how Modal composes the story panel above tighter options.
  [`Modal.tsx:78`](../../client/src/components/Modal/Modal.tsx#L78)

- Confirm Storybook covers the new standalone frame.
  [`Frame.stories.tsx:4`](../../client/src/components/Frame/Frame.stories.tsx#L4)

- Verify the design-system guidance distinguishes Frame from NarrativeCard.
  [`design-system.md:87`](../../docs/design-system.md#L87)
