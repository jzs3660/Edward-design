# Design system

This file is the human-readable counterpart to `assets/tokens/tokens.json`. The JSON tokens are canonical when values conflict.

## Canvas and safe area

- Slide size: 1920×1080.
- Horizontal outer margin: 110px.
- Main content width: 1700px.
- Top shell padding: 62px.
- Bottom shell padding: 54px.
- Brand header: 1700×45.
- Optional source footer: 1700×30.
- Inner slide heading starts below the header; only the cover heading is centered.
- Do not place critical content inside the outer 110px margin or within navigation overlays in live presentation mode.

## Visual character

The style combines restrained editorial typography with subtle technology cues:

- large, low-weight display headlines;
- dark ink/deep-purple and warm paper themes rather than generic black/white;
- quiet multi-color tile fields, aurora washes, motion forms, and photographic evidence;
- hairline dividers and low-opacity card surfaces;
- compact uppercase kickers and labels;
- gradients used as text color or translucent fill, not decorative borders;
- generous negative space and strong left alignment on inner pages.

Avoid glossy dashboard UI, heavy shadows, thick outlines, 3D charts, skeuomorphic cards, emoji, and dense text blocks.

## Core colors

| Token | Value | Use |
|---|---:|---|
| ink | `#111114` | Light-theme primary text and dark secondary surfaces |
| deepPurple | `#0F091D` | Dark-theme base |
| paper | `#F2F4F0` | Light-theme base |
| white | `#FFFFFF` | Dark-theme primary text |
| neutral700 | `#5E6263` | Light-theme descriptions |
| neutral500 | `#919596` | Light-theme muted annotations |
| cardLabel | `#008C94` | Light-theme labels and arrows |
| cyan | `#1EEAEA` | Accent family |
| violet | `#7558F8` | Accent family |
| pink | `#F94EA6` | Accent family |
| lime | `#A1F027` | Accent family |

Use semantic tokens from `assets/tokens/tokens.json`; do not substitute close colors by eye.

## Exact gradients

### Brand text

- Light: `linear-gradient(110deg, #039987 0%, #0281D0 48.56%, #4B56F8 100%)`.
- Dark: `linear-gradient(90deg, #9AFFF8 0%, #DAF4FF 49.04%, #CAB7FF 100%)`.

Use for header-right text, kickers, and selected labels. Gradient text must have content-hug width. A fixed wide text frame spreads the gradient and changes the color appearance.

### Accent text

- Light: `linear-gradient(90deg, #1F1F23 0%, #029090 100%)`.
- Dark: `linear-gradient(90deg, #F3B6FF 0%, #6DE4F9 50.96%, #77FAB4 100%)`.

Use for metric values and the emphasized phrase in callouts.

### Accent surfaces

- Callout: `linear-gradient(90deg, rgba(160,169,254,.16), rgba(46,238,238,.16) 47.9%, rgba(147,252,184,.16))`.
- Comparison card light: pastel gradient at 10% opacity.
- Comparison card dark: pastel gradient at 16% opacity.

The accent callout has no border. Its emphasis comes from translucent gradient fill, blur, typography, and spacing. The Figma source uses one gradient Paint at 16% opacity; HTML and PPTX preserve the same appearance by applying `.16` alpha to every stop. Do not apply `opacity: .16` to the Callout container, because that fades the dot and text too. Do not flatten or reinterpret the Paint opacity as a 100%-opaque gradient.

## Theme semantics

### Light

- Base: `#F2F4F0` or a packaged light background image.
- Primary text: `#111114`.
- Secondary text: `#5E6263`.
- Step number: `#008089`.
- Hairline: `rgba(17,17,20,.14)`.
- Card surface: `rgba(17,17,20,.02)`.
- Default callout surface: `rgba(17,17,20,.04)`.

### Dark

- Base: `#0F091D` or a packaged dark background image.
- Primary text: `#FFFFFF`.
- Secondary text: `rgba(255,255,255,.70)`.
- Step number: `#1EEAEA`.
- Hairline: `rgba(255,255,255,.14)`.
- Card surface: `rgba(255,255,255,.025)`.
- Default callout surface: `rgba(255,255,255,.06)`.

## Background treatments

Every slide requires one theme-compatible treatment.

- `base` (Light/Dark): quietest; dense cards and detailed comparisons.
- `elements-cover` (Light/Dark, cover only): full decorative tile field around centered cover content.
- `elements-inner` (Light/Dark, inner only): visible elements are concentrated on the right; the left content area remains calm.
- `atmosphere` (Light/Dark, inner): atmospheric form for metrics, comparisons, transitions, closings, and split-image pages.

Do not swap `elements-cover` and `elements-inner`. The generator and preflight treat that as an error. Atmosphere is intentionally an inner-page option in both themes.

HTML layers the canonical Lossless WebP background, Lossless WebP texture, and theme wash at runtime. PPTX resolves the same canonical background and converts it to a cached PNG buffer in memory. No duplicate compiled background tree is stored in the Skill.

## Texture rules

- Dark texture: soft-light blend at 55% opacity.
- Light texture: multiply blend at 34% opacity.
- Keep texture beneath all content.
- Never replace the texture with random noise or a generic stock grain.
- Do not add the texture WebP as an extra opaque PPTX layer. The PPTX adapter uses the canonical background exactly once and approximates unsupported HTML effects with native slide shapes only where documented.

## Radius, border, and blur

- Standard card/callout/image radius: 24px.
- Smaller utility radius: 8–16px.
- Full-bleed image radius: 0.
- Card border: 1px hairline semantic token.
- Default callout: no visible border.
- Accent callout: no visible border.
- Callout blur: 20px in HTML; use a precomposed/translucent equivalent in PPTX.

## Spacing rhythm

Use the packaged scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 112.

Important layout values:

- point/card gap: 60px for spacious parallel columns;
- dense card gap: 30px;
- callout internal padding: 20px on every side;
- callout dot-to-metric/body and metric-to-body gap: 12px;
- item label-to-title gap: normally 8–12px;
- item title-to-body gap: normally 8px;
- card internal padding: normally 32px, reduced only for dense 4/6 layouts.

## Alignment rules

- Cover title, subtitle, and kicker: centered.
- Inner page title, subtitle, kicker: left.
- Point, step, card, metric, comparison, and image-card content: left.
- Header logo: left; header URL/right text: right.
- Header logo is height-limited to 40px; cover identity logo is height-limited to 56px. Both calculate width from the intrinsic image ratio and must never be stretched.
- Small titles are single-line and left-aligned.
- Numeric metric values are left-aligned unless a custom data visualization explicitly requires another alignment.

## Background selection heuristic

Choose one dominant visual signal per slide:

- dense content -> quiet background;
- centered opening thesis -> elements-cover;
- sparse or metric inner page -> atmosphere;
- image-heavy -> quiet base or elements-inner;
- gradient accent callout -> reduce competing background color;
- 6-item grid -> base or restrained elements-inner, never the busiest background.

The packaged examples deliberately exercise both Atmosphere themes: the English metrics slide uses Dark Atmosphere and the English split-image closing uses Light Atmosphere. Treat these as validation examples, not as restrictions on which compatible layout may use Atmosphere.

Alternate themes when it helps section rhythm, but do not enforce strict zebra striping. A coherent story matters more than a mechanical pattern.
