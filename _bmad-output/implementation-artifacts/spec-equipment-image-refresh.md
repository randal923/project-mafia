---
title: 'Equipment Image Refresh'
type: 'feature'
created: '2026-07-12'
status: 'done'
baseline_commit: '1eb1fbe2935f55509d9b531e45e2e3a1fb11dbae'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The equipment catalog mixes one polished, transparent-background knife image with 110 flat SVG illustrations. The mismatch makes inventory, hover-card, and store equipment presentation feel visually unfinished.

**Approach:** Create one distinct transparent WebP image for every SVG-backed equipment item, using the Stiletto Knife as the visual reference, and convert the existing knife to the same delivery format without restyling it. Replace catalog image paths only after the complete asset set passes visual, alpha, and byte-budget checks; keep the store's default lazy loading and request thumbnail-sized optimized variants instead of oversized files.

## Boundaries & Constraints

**Always:** Preserve all equipment IDs, names, descriptions, stats, ordering, and alt text. Produce exactly one 512×512 transparent WebP per item with transparent corners, a clean isolated silhouette, generous padding, and useful detail at both 80px and card size. Preserve the knife's appearance while changing only its format. Match its polished, photorealistic product-render aesthetic for the other 110 items: a single period-appropriate object, centered or diagonally composed to suit its shape, crisp material texture, controlled studio highlights, noir-era character, and no cast shadow. Keep the final 111-file source set at or below 6.5 MiB, average at or below 60 KiB, and each file at or below 100 KiB without visible thumbnail degradation. Preserve lazy loading and request a roughly 104px store image candidate appropriate to the rendered frame. Keep `client/next-env.d.ts` untouched.

**Ask First:** Stop before switching from built-in image generation plus chroma-key removal to the CLI/native-transparency fallback. Also stop if an item cannot be represented faithfully as one isolated object without materially changing its catalog concept, or if the WebP byte budget cannot be met without visible degradation.

**Never:** Add labels, readable packaging text, trademarks, watermarks, scenery, people, hands, extra props, or a visible background. Do not use generated SVG/vector stand-ins, add project dependencies, add pagination or virtualization, enable AVIF delivery without measurements and human approval, change gameplay data, or start development/preview servers.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Catalog replacement | 110 equipment records reference SVGs and the knife references PNG | Each of 111 records references an existing, same-basename transparent WebP | Do not change that record or remove its prior asset until its WebP validates |
| Wide, tall, paired, or soft-edged item | Subject does not naturally fill a square | Preserve the whole recognizable silhouette with balanced padding and no clipping | Regenerate the individual asset with corrected framing |
| Chroma-key artifact | Green spill, opaque corner, halo, or missing subject pixels | Final WebP has a clean alpha edge and plausible subject coverage | Retry local edge cleanup once; ask before any native-transparency fallback |
| Store first view | All 111 cards are mounted after catalog fetch | Only near-viewport images load; each requests an optimized thumbnail-scale candidate | Preserve lazy loading; correct `sizes` rather than adding eager loads or preloads |
| Compression outlier | An asset exceeds 100 KiB or the set exceeds 6.5 MiB | Re-encode or regenerate while preserving recognizable detail | Ask before accepting a larger budget or visibly degrading an item |

</frozen-after-approval>

## Code Map

- `client/public/images/items/stiletto-knife.png` -- 512×512 RGBA style, composition, and transparency reference to convert without visual changes.
- `client/public/images/items/*.svg` -- 110 source identities to replace with generated transparent WebP assets.
- `server/src/seedData/equipments.json` -- canonical mapping from all 111 equipment records to public image paths.
- `client/src/components/Inventory/InventoryItemCard.tsx` -- largest square inventory presentation using `object-contain`.
- `client/src/components/ItemHoverCard/ItemHoverCard.tsx` -- smallest 80px legibility target.
- `client/src/components/Store/StoreItemCard.tsx` -- 104px-tall store image frame; needs an accurate `sizes` hint while retaining default lazy loading.
- `client/next.config.ts` -- currently uses Next.js's default WebP optimizer output; no AVIF configuration is needed.

## Tasks & Acceptance

**Execution:**
- [x] `client/public/images/items/*.webp` -- generate 110 chroma-keyed, knife-style equipment renders, remove their backgrounds locally, and convert the existing knife without restyling; normalize, compress, inspect, and retain 111 validated 512×512 transparent WebPs within budget.
- [x] `client/src/components/Store/StoreItemCard.tsx` -- add the store image's accurate `sizes` hint so Next.js serves thumbnail-scale variants while keeping default lazy loading.
- [x] `server/src/seedData/equipments.json` -- change only the 111 image suffixes to `.webp` after every target exists.
- [x] `client/public/images/items/*.{svg,png}` -- remove the 110 superseded SVGs and knife PNG only after the catalog and complete WebP set validate.

**Acceptance Criteria:**
- Given the equipment catalog, when image references are audited, then all 111 records point to existing `.webp` files and no record points to an SVG or PNG.
- Given the complete asset set, when dimensions and alpha are audited, then every file is 512×512, retains alpha transparency, has transparent corners, contains a non-empty subject, and has no obvious chroma-key fringe or clipping.
- Given the compressed WebP set, when file sizes are audited, then no file exceeds 100 KiB, the average does not exceed 60 KiB, and the total does not exceed 6.5 MiB.
- Given a visual contact sheet, when the set is reviewed at thumbnail scale, then every item is recognizable, individually distinct, period-appropriate, and cohesive with the knife reference.
- Given the store grid, when its image markup is inspected, then images remain lazy-loaded and advertise the rendered thumbnail size so the browser does not select oversized variants.

## Spec Change Log

## Design Notes

Use one built-in generation call per equipment item. Prompt from the catalog name, category, and description with the knife as Image 1 (style reference), while repeating the shared constraints: one isolated object, photorealistic studio-rendered noir aesthetic, square composition, flat removable chroma background, no shadows/background scene/text/logos/watermark, and no key color in the subject. Prefer an angle that maximizes recognition rather than forcing every item into the knife's exact diagonal. WebP is the committed source and delivery format because Next.js recommends it for most cases; AVIF is deferred because its roughly 20% transfer saving comes with roughly 50% slower cold encoding, which is a poor default for 111 unique store images.

## Verification

**Commands:**
- Asset audit script -- expected: 111 WebP references resolve; all assets satisfy dimension, alpha, transparent-corner, subject-coverage, per-file, average, and total-byte checks.
- `yarn --cwd client test` -- expected: all client tests pass.
- `yarn --cwd client lint` -- expected: lint passes without changing `next-env.d.ts`.
- `yarn --cwd server test` -- expected: all server tests pass.
- `yarn --cwd server typecheck` -- expected: server typecheck passes.

**Manual checks:**
- Inspect a labeled contact sheet at full size and thumbnail size for subject accuracy, consistency with the knife, clipping, halos, accidental text, duplicate-looking items, and weak silhouettes.

## Suggested Review Order

**Migration safety**

- Central path normalization keeps legacy persistence compatible with the new asset format.
  [`normalizeEquipmentImage.ts:9`](../../shared/normalizeEquipmentImage.ts#L9)

- Firestore catalog reads migrate stale image suffixes without requiring an immediate reseed.
  [`EquipmentService.ts:51`](../../server/src/services/EquipmentService.ts#L51)

- Player stash and loadout snapshots migrate lazily without mutating stored input.
  [`player.ts:355`](../../shared/player.ts#L355)

- Active and confiscated crew gear receive the same compatibility treatment.
  [`crew.ts:424`](../../shared/crew.ts#L424)

**Asset delivery**

- The canonical catalog switches all 111 records while preserving gameplay data.
  [`equipments.json:8`](../../server/src/seedData/equipments.json#L8)

- The store advertises its true 104px render width and retains lazy loading.
  [`StoreItemCard.tsx:65`](../../client/src/components/Store/StoreItemCard.tsx#L65)

- The knife demonstrates the normalized transparent 512px WebP source format.
  [`stiletto-knife.webp:1`](../../client/public/images/items/stiletto-knife.webp#L1)

**Regression coverage**

- Migration tests cover paths, players, crew confiscation, and stale Firestore documents.
  [`equipmentImageMigration.test.ts:27`](../../server/src/services/__tests__/equipmentImageMigration.test.ts#L27)
