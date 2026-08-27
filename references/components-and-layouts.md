# Components and layouts

The machine-readable registry is `assets/components/registry.json`. This file explains selection, anatomy, variants, and content constraints.

## Shared slide shell

Every slide contains:

1. background image;
2. texture layer and theme wash;
3. optional brand header on inner pages only;
4. heading block;
5. content-main region;
6. optional callout under content-main;
7. optional source footer.

The shell owns spacing. Components must not set arbitrary slide-level coordinates.

## Brand header

Dimensions: 1700×45, positioned inside the 110px horizontal margins.

Properties:

- `show`: hides the entire header while preserving slide alignment.
- `showLogo`: shows/hides the left logo.
- `showRightText`: shows/hides the right URL/text.
- `rightText`: replaces the URL or short descriptor.
- `meta.logo`: one logo for both themes or separate `light`/`dark` paths.

The logo is replaceable. Use a transparent SVG/PNG with visible bounds trimmed. Its original aspect ratio is immutable: the inner-slide header uses a 40px display height and the cover identity uses 56px; width is always calculated from the source ratio. PPTX reads the source dimensions and performs the same calculation. An extremely wide logo may be scaled down proportionally or rejected for leaving the slide bounds, but is never forced into a fixed-width box.

The right text uses gradient Outfit and hugs content. Keep it to one line.

Cover slides never render this page header. Cover identity is handled inside the centered cover heading as `kicker`, replaceable `logo`, or `none`.

## Kicker

- English: Noto Sans 24/150%, compact uppercase.
- Chinese: Noto Sans SC 24/150%.
- Gradient text and content-hug width.
- Typical pattern: `SECTION · TOPIC`, not a full sentence.
- Optional; removing it must not leave an empty fixed-height frame.

## Slide heading

- `cover`: centered inside a 1800×960 Hero area with no page header; title 116px in both languages.
- every other type: left.
- Cover order: optional identity (`kicker` or replaceable logo), title, optional subtitle.
- Inner order: optional kicker, title, optional subtitle.
- Title is a takeaway, not a topic label.
- Subtitle adds context but must not repeat the title.
- The heading block and content block must not overlap; preflight checks both.

Cover layouts:

- `text-only`: the whole identity/title/subtitle stack is horizontally and vertically centered.
- `media-bottom`: the centered text stack sits above a 1360×360 replaceable image with a 32px structural gap.
- `full-bleed`: one replaceable full-slide image with a readability overlay; no page header.

For `split-image-text` with a callout, keep the page title on one line (30 English characters or 14 Chinese characters). This preserves the 760×428 media slot and a readable gap above the callout.

## Source footer

- Optional on any non-cover slide.
- Use for data, claims, studies, or images when attribution is needed.
- English: Noto Sans Semibold 16/150%.
- Chinese: Noto Sans SC Medium 16/150%.
- One line, lower left.
- Light text color: `#919596` at 100% opacity.
- Dark text color: `#FFFFFF` at 55% opacity.
- Remove entirely when no source is needed; do not leave “Source:” as a placeholder in delivery.

## Point block

Purpose: parallel principles, observations, benefits, or arguments.

Variants:

- theme: light/dark;
- count/layout: 2, 3, 4, 6;
- label: shown/hidden;
- icon: shown/hidden.

Anatomy:

1. optional 60×60 icon box containing an exact 32px design-system glyph;
2. optional 18px label;
3. one-line Outfit/Noto Sans SC title;
4. Noto Sans/Noto Sans SC description.

Widths within the 1700px region:

- 2 columns: 760px;
- 3 columns: 486.67px;
- 4 columns: 335px;
- 6 items: 3×2 layout based on the 3-column grid.

Point content is always left-aligned. Use hairline dividers between columns; reset the left divider at the beginning of row two in the 6-item layout.

## Step block and workflow

Purpose: ordered process with exactly 3 or 4 steps.

Variants:

- theme: light/dark;
- count: 3/4;
- step label: shown/hidden;
- arrows: shown/hidden;
- dividers: shown by default.

Anatomy:

1. step number (`01`, `02`, …) in Instrument Serif Italic or Smiley Sans, using `#008089` on Light and `#1EEAEA` on Dark;
2. optional small label;
3. one-line title;
4. short description;
5. an independent arrow row above the Step row.

Three-step width is 486.67px; four-step width is 335px. The workflow width remains 1700px in both cases. Never widen the slide to fit another step.

Each Step component contains only number, optional label, title, and body; it never contains an arrow. The Workflow owns an independent 16px arrow row with exactly one visible direction line above every Step, including the final Step. A three-step Workflow therefore has three arrows and a four-step Workflow has four. The row retains the registered 60px column gaps. The Step row uses 120px gaps so the optional 1px divider sits at the center of each gap. The arrow row is visibly above the entire Step row: its box ends 32px before the Step row begins. The optional Workflow label has a separate 12px gap above the arrows.

## Metric block

Purpose: quantitative signals with brief interpretation.

Variants:

- theme: light/dark;
- count/layout: 2, 3, 4, 6;
- label: shown/hidden.

Anatomy:

1. optional label;
2. one-line gradient value;
3. one-line title;
4. short description.

Values use 110% line height in English; Chinese follows the registered 150% Noto Sans SC role. Do not use a metric slide for unverified numbers. Mark illustrative numbers in the source/footer and replace before final delivery.

## Card

Purpose: contained modules, capabilities, plans, offers, use cases, or grouped evidence.

Variants:

- theme: light/dark;
- count/layout: 2, 3, 4, 6;
- media: image/no image;
- label: shown/hidden;
- icon: shown/hidden.

No-image card anatomy:

1. optional icon;
2. optional label;
3. one-line title;
4. description.

Image card anatomy:

1. 4:3 image slot for 2/3-up cards, or side image for dense 4/6-up cards;
2. optional label;
3. one-line title;
4. description.

Use a 24px radius and 1px semantic hairline. The surface is 2–2.5% opacity, not solid gray. Dense 6-card layouts reduce internal spacing and type according to the renderer but retain hierarchy and readability.

For a 6-card slide, the page title must remain one line. The packaged generator enforces a cross-format budget of 30 English characters or 12 Chinese characters and browser preflight treats wrapping as a release error.

Do not mix image and no-image cards randomly unless the visual difference carries meaning.

## Image mask

Registered ratios:

- team: 1700×480, full-width radial alpha mask;
- feature: 760×428, 16:9 with 24px radius;
- card: 546.67×410, 4:3 with 24px radius;
- full bleed: 1920×1080.

Team mask provenance:

- frame `95:216` clips content at 1700×480;
- mask `95:217` is alpha with radial gradient from white at 85% alpha to transparent;
- source image `95:218` fills the masked frame.

The CSS implementation uses a radial ellipse mapped from that Figma transform. Preserve the size and mask; replace only the image.

The registered Team slide does not add a separate title/body caption below the image. Supporting text must use the optional Callout and Source components already present in the Figma slide component. Because the 480px mask must remain intact, the Team slide title is limited to one cross-format-safe line (30 English characters or 12 Chinese characters in the packaged generator).

## Callout

Purpose: support the main content with a takeaway, condition, caveat, rule, next action, or highlighted number.

Rules:

- Never a standalone slide.
- Compatible with points, cards, metrics, workflow, comparison, image-cards, team, split-image-text, and full-bleed.
- Optional; not every slide needs one.
- Outer width: 1700px.
- Body-only/default height: 70px; labeled/accent height: 88px; actual height hugs content.
- No border in either variant.

Variants:

- `default`: quiet translucent theme surface with blur.
- `accent`: reusable `#A0A9FE → #2EEEEE (47.9%) → #93FCB8` gradient at 16% Paint opacity with 20px blur. Apply 16% only to the background gradient stops in HTML/PPTX; the dot and text remain fully opaque. Never render the fill at 100%.

Anatomy:

1. required 12×12 dot (`#008089` light, `#1EEAEA` dark);
2. optional short metric/label in Outfit or Noto Serif SC;
3. required supporting sentence;
4. 20px padding and 12px gap between every adjacent item.

Use either of these registered content variants:

- `labeled`: `metric` or `label` + `body`;
- `body-only`: `body` without an empty or invented lead label.

Both variants keep the same outer width, 16px radius, 20px background blur, 20px padding, required dot, and hug-height behavior. The Team component in the current source system uses the body-only variant by default.

Callout text and gradient-width elements must hug content where appropriate. Do not use a fixed 1px text height.

## Comparison

Purpose: before/after, current/target, option A/B, fragmented/coherent.

- Exactly two cards.
- One may use `tone: "accent"`.
- Each card supports label, title, optional body, and 3–4 bullets.
- Use equal width and height.
- Keep bullets parallel in grammar and approximate length.
- Accent is a translucent fill, not a thick outline.

## Image cards

Purpose: evidence-led stories where the image is primary.

- Count: 2 or 3.
- Image ratio: 16:10 in HTML; use a verified crop.
- Title: one line.
- Description: 1–2 short lines.
- Optional callout may explain the image rule, implication, or decision.

Do not use repeated generic decorative images. Every image should support the slide title.

## Team layout

Purpose: ownership, collaboration, operating rhythm, or human context.

- One 1700×480 radial-mask photo.
- No separate caption, title/body row, or two-column text block below the image.
- Optional supporting text uses the registered Callout below the image; provenance uses the optional Source footer.
- The page heading carries the slide takeaway and remains a single line: maximum 30 English characters or 12 Chinese characters.
- Use a current, consented, relevant image.
- Avoid adding biographies or names unless the presentation requires them.

## Split image + text

Purpose: feature/evidence plus explanation or next step.

- One 760×428 image.
- Image left by default; `imageSide: "right"` reverses it.
- Content title may wrap, unlike small component titles.
- Preserve an 80px gap between image and text.
- A callout may sit below the split content.

## Full bleed

Purpose: cinematic opener, section reset, quote, or visual proof.

- One 1920×1080 image.
- Readability wash is required.
- Keep text inside a 1120px width on the safe side of the composition.
- Confirm image subject is not hidden by the wash/text.
- Use sparingly; it should feel like a change in rhythm.

## Layout routing matrix

| Content | Preferred layout | Alternate | Avoid |
|---|---|---|---|
| 2–4 parallel principles | points | cards | workflow |
| 5–6 compact capabilities | cards 6 | points 6 | 6 full paragraphs |
| ordered stages | workflow | points with explicit order | cards with no sequence |
| 2–6 numbers | metrics | cards when explanation dominates | decorative chart |
| two states/options | comparison | split-image-text for visual evidence | unrelated cards |
| screenshots/photos as proof | image-cards | split-image-text | decorative thumbnails |
| team/collaboration | team | full-bleed | tiny portraits grid |
| opening/closing thesis | cover | full-bleed | dense card grid |

## Density rules

- 2-up: generous copy and imagery.
- 3-up: standard component density.
- 4-up: short title and 1–2-line body.
- 6-up: title typically 2–4 words; body one concise sentence; no oversized label/icon combination.
- If a 6-up slide requires more text, split it or use two sequential 3-up slides.

## Composition with callout and source

The content zone is a vertical stack:

```text
content-main (flexible)
gap 28
callout (optional, hug; default body-only min 70, labeled/accent min 88)
gap/source margin
source footer (optional, 30)
```

Adding a callout or source reduces available content height. The renderer packs dense layouts, but content planning must still respect the available space.

## Unsupported patterns

- standalone callout;
- inner centered title;
- 5-column layout;
- 5-step workflow;
- uncontrolled freeform absolute text boxes;
- mixed unregistered icon sizes;
- emoji used as a visual glyph;
- pure white/black slide without packaged background treatment;
- text manually positioned outside the slide shell;
- small title deliberately wrapped to two lines.
