# Page layout catalog

This is the selection contract for the packaged page templates. It complements `components-and-layouts.md`: that file defines component anatomy; this file defines page composition, content limits, compatible backgrounds, and optional regions.

All dimensions are CSS/Figma pixels on a 1920×1080 canvas. HTML, PDF, and PPTX must be generated from the same resolved deck JSON.

## Shared page contract

Every inner page uses this vertical shell:

```text
110px left/right safe margin -> 1700px content width
62px top padding
45px optional header
heading: kicker? + title + subtitle?
content-main
28px structural gap when Callout exists
Callout? (1700px wide, hug height; default 70px, labeled/accent 88px)
Source? (one line, lower left)
54px bottom safe padding
```

- Only Cover centers its heading. Every inner layout is left-aligned.
- Every slide uses a registered Light/Dark background; never use plain white or black.
- `elements-cover` is Cover-only. `elements-inner` and `atmosphere` are inner-only.
- Source and Callout are optional and consume vertical space when present.
- Page title, subtitle, content, Callout, and Source may never overlap.
- Small item titles are one line. Descriptions use auto/hug height inside the registered component budget.
- Use `base` for the densest content, `elements-inner` for right-weighted decoration, and `atmosphere` for sparse/metric/image-led inner pages.

## Catalog summary

| Layout | Registered variants | Main content geometry | Callout | Source | Preferred background |
|---|---|---|---|---|---|
| Cover | text-only, media-bottom, full-bleed | centered hero; optional 1360×360 image | no | no | elements-cover or full-bleed image |
| Points | 2, 3, 4, 6 | 1700px columns; 6 = 3×2 | yes | yes | base / elements-inner |
| Cards | 2, 3, 4, 6; image/no-image | equal-height row(s); 6 = 3×2 | yes | yes | base / restrained elements-inner |
| Metrics | 2, 3, 4, 6 | equal columns; 6 = 3×2 | yes | yes | atmosphere / base |
| Workflow | 3 or 4 steps | fixed 1700px row with arrows/dividers | yes | yes | base / elements-inner |
| Comparison | 2 states | two equal cards | yes | yes | base / atmosphere |
| Image cards | 2 or 3 | equal 16:10 media cards | yes | yes | base / elements-inner |
| Team | 3 content items + one 1700×340 masked image | three columns above image | no | no | elements-inner / atmosphere |
| Split image + text | image left/right | 760×428 media + 80px gap + text | yes | yes | base / elements-inner / atmosphere |
| Full bleed | one hero image | 1920×1080 image + wash | yes, sparingly | yes | supplied image |

## Cover

### `text-only`

- No page header.
- Identity above title: `kicker`, replaceable `logo`, or `none`.
- Title/subtitle stack is horizontally and vertically centered inside the hero area.
- Cover title uses the 116px display token, not the 100px inner H1 token.
- Replacement logo is limited by 56px height; width comes from its intrinsic ratio.
- Use for deck opening, section reset, or closing thesis.

### `media-bottom`

- Same centered identity/title/subtitle stack, moved upward to make room for the image.
- Replaceable image: 1360×360, below the text with a 32px structural gap.
- Do not reduce the gap to rescue long copy. Shorten the title/subtitle.
- Use for an opener that needs product, environment, or evidence imagery.

### `full-bleed`

- One replaceable 1920×1080 image with a contrast wash.
- No page header.
- Keep title copy inside a maximum 1120px readable text width.
- Keep the image subject clear of the title/wash region through `image.position`.

## Points

Use for parallel principles, arguments, observations, or benefits.

| Count | Grid | Item width | Title budget EN | Title budget ZH | Body guidance |
|---:|---|---:|---:|---:|---|
| 2 | 2×1 | 760px | 42 chars | 14 chars | up to 2 short lines |
| 3 | 3×1 | 486.67px | 30 chars | 14 chars | 1–2 short lines |
| 4 | 4×1 | 335px | 24 chars | 10 chars | 1–2 short lines |
| 6 | 3×2 | 486.67px | 24 chars | 10 chars | one concise sentence |

- Icon and label are independently optional.
- Item title and all content are left-aligned.
- Divider resets at the first item of row two for six items.
- If six descriptions need more than one concise sentence, use two 3-point slides.

## Cards

Use for capabilities, offers, plans, modules, use cases, or grouped evidence.

| Count | Grid | Media | Page-title rule | Body guidance |
|---:|---|---|---|---|
| 2 | 2×1 | image or none | normal heading budget | 2–3 short lines |
| 3 | 3×1 | image or none | normal heading budget | 1–2 short lines |
| 4 | 2×2 or 4×1 per registered adapter | image or none | prefer one line | 1–2 short lines |
| 6 | 3×2 | image or none | exactly one line: EN 30 / ZH 12 | one concise sentence |

- Rows use equal visual height; descriptions remain inside each card.
- Description height is auto/hug within the card, never an arbitrary fixed text height that leaves a large empty block.
- Icon and label are independently optional.
- Do not randomly mix image and no-image cards in one grid.
- A six-card slide uses compact registered spacing and a quiet background. If the page title wraps, change the copy or layout.

## Metrics

Use for verified quantitative signals.

| Count | Grid | Value/title behavior | Description |
|---:|---|---|---|
| 2 | 2×1 | large value, one-line title | up to 2 lines |
| 3 | 3×1 | large value, one-line title | 1–2 lines |
| 4 | 4×1 | compact value, one-line title | short |
| 6 | 3×2 | compact value, one-line title | one concise sentence |

- Label is optional.
- Values use gradient text with content-hug width.
- Numbers must be verified or explicitly marked illustrative in Source.
- Prefer `atmosphere` when the page is sparse; use `base` for six metrics.

## Workflow

Use only for an actual ordered sequence.

| Steps | Width per step | Arrows | Labels |
|---:|---:|---|---|
| 3 | 486.67px | optional between steps | optional per step |
| 4 | 335px | optional between steps | optional per step |

- The whole workflow remains 1700px wide; never widen the slide.
- Step number, optional label, one-line title, and description are left-aligned.
- The arrow row is separate from every Step component and renders one visible direction line above every Step, including the final Step (`arrows = steps`).
- Keep the arrow row visually above the complete Step row with a 32px arrow-to-Step gap; numbers and Step copy never share the arrow lane.
- Step numbers use `#008089` on Light and `#1EEAEA` on Dark.
- `showArrows`, `showStepLabels`, and `showDividers` are independent variants in HTML and PPTX.
- Do not create five steps; split the sequence or group stages.

## Comparison

- Exactly two equal cards: current/target, option A/B, or before/after.
- Each side supports optional label, title, body, and 3–4 parallel bullets.
- One side may use `tone: "accent"`; accent is a translucent fill, never a thick border.
- Keep both sides balanced in grammar, bullet count, and visual height.
- Use `base` for dense bullets and `atmosphere` only when surrounding content stays sparse.

## Image cards

- Exactly 2 or 3 cards.
- Media is 16:10 with `cover` crop and 24px radius.
- Each card uses a one-line title and 1–2 short description lines.
- Images must provide evidence; do not repeat generic decorative images.
- Optional Callout belongs below the entire grid, not inside one card.

## Team

- Page title is one line: maximum 30 English characters or 12 Chinese characters.
- Content-main contains exactly three left-aligned content items and one 1700×340 radial-alpha masked image below them.
- Replace only the source image; preserve mask size and geometry.
- Do not add a Callout, Source footer, caption row, or second text block below the image.
- Put image provenance/consent in speaker notes.
- Prefer a current, consented photo showing real collaboration or operating context.

## Split image + text

- One 760×428, 16:9 image with 24px radius.
- `imageSide` can be `left` or `right`; the package default is left image / right text.
- Preserve the 80px gap between media and text.
- `contentTitle` may wrap; it is not a small card title.
- With Callout, the page title must be one line: EN 30 / ZH 14.
- Do not move the main slide heading into the two-column content region.

## Full bleed

- One verified 1920×1080 image with a readability wash.
- Use sparingly for a thesis, section reset, quote, or visual proof.
- Keep overlay copy inside the safe text width and away from the subject.
- A Callout is allowed only when it remains a supporting overlay and contrast/spacing stay readable.
- Source may identify image provenance or a material claim.

## Callout compatibility

Callout is compatible with Points, Cards, Metrics, Workflow, Comparison, Image cards, Split image + text, and Full bleed. Team does not use it. Callout is never a page type.

Two content variants are registered:

```json
{ "tone": "default", "body": "Body-only supporting statement." }
```

```json
{ "tone": "accent", "metric": "RULE", "body": "Labeled supporting statement." }
```

- `metric` or `label` is optional; `body` is required.
- Default and accent variants have no stroke.
- Accent uses translucent gradient fill plus blur.
- Outer width is 1700px; height hugs content with a 70px minimum for default body-only and an 88px minimum for labeled or Accent variants.
- The required dot, optional lead, and body use a 12px gap between adjacent items.

## Source compatibility

- Source is optional on every inner layout.
- Add it for data, claims, studies, or image provenance.
- It stays one line at the lower left and never overlaps content or Callout.
- Remove the field entirely when no source is needed; do not leave a delivery placeholder.

## Failure routing

| Failure | Required response |
|---|---|
| item title wraps | shorten, reduce count, or choose a wider layout |
| six-card/Team page title wraps | shorten title or select another layout |
| description exceeds component | edit copy or split slide; do not use a fixed hidden overflow box |
| Callout collides with content | shorten/collapse content or remove Callout; do not flatten structural gaps |
| Team needs more than three content items or a separate caption | split the story or use Split image + text |
| five workflow steps requested | group into 3/4 steps or use two slides |
| image subject is cropped | change `image.position`; never stretch the image |
| replacement logo is distorted | restore intrinsic ratio and height-limited contain sizing |
