---
title: 'Table Component'
type: 'feature'
created: '2026-07-07'
status: 'done'
route: 'one-shot'
---

# Table Component

## Intent

**Problem:** The design system did not have a reusable table primitive for ledgers, crew lists, resource logs, and other dense game data.

**Approach:** Add a typed semantic `Table` component with captions, optional descriptions, density control, right-aligned numeric columns, toned cells, row headers, and an empty state. Document the component contract and add Storybook states for ledger, compact, and empty usage.

## Suggested Review Order

**Component Contract**

- Start with the typed data shape and supported table variants.
  [`Table.tsx:7`](../../client/src/components/Table/Table.tsx#L7)

- Check caption, description, empty-state, and header rendering behavior.
  [`Table.tsx:67`](../../client/src/components/Table/Table.tsx#L67)

- Review row header and cell rendering semantics.
  [`Table.tsx:110`](../../client/src/components/Table/Table.tsx#L110)

**Story Coverage**

- Confirm the representative ledger data covers alignment, tones, and row headers.
  [`Table.stories.tsx:4`](../../client/src/components/Table/Table.stories.tsx#L4)

- Check compact and empty Storybook states.
  [`Table.stories.tsx:61`](../../client/src/components/Table/Table.stories.tsx#L61)

**Design Contract**

- Verify usage guidance matches the component API.
  [`design-system.md:125`](../../docs/design-system.md#L125)
