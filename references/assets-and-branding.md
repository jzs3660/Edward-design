# Assets and branding

All packaged assets are indexed by `assets/asset-sources.json` and category manifests. Runtime generation must not contact Figma.

For image prompting, slot-safe composition, and product screenshot treatment, also read `image-direction-and-screenshots.md`.

## Logo replacement

One logo for both themes:

```json
"logo": "./brand/logo.svg"
```

Theme-specific logos:

```json
"logo": {
  "light": "./brand/logo-on-light.svg",
  "dark": "./brand/logo-on-dark.svg"
}
```

Logo requirements:

- accept user-supplied local PNG, JPG/JPEG, WebP, or SVG files through `meta.logo`; paths are resolved relative to the input deck JSON and copied into the portable output;
- transparent SVG is preferred; transparent PNG or WebP is accepted; use JPG only when its opaque background is intentionally safe on the target slide theme;
- trim invisible artboard padding;
- retain the source aspect ratio exactly; browser preflight rejects a rendered/intrinsic ratio change above 1.5%;
- inner-header logo: maximum display height 40px, width calculated from the source ratio;
- cover-identity logo: maximum display height 56px, width calculated from the source ratio;
- scale an extremely wide mark down proportionally to the safe width; never force it into a fixed-width rectangle;
- HTML keeps SVG logos as vectors; PPTX rasterizes SVG logos to a transparent 4× PNG at export so viewers that ignore Office SVG fallbacks do not show a blank mark;
- single-file HTML inlines PNG, JPG/JPEG, WebP, and SVG with their correct MIME type; PPTX converts SVG and WebP logos to PNG while preserving the calculated display ratio;
- use adequate contrast for the target theme;
- do not recolor a multi-color brand without authorization;
- provide meaningful `brandName` for accessibility.

To remove the logo but keep the right text:

```json
"header": { "show": true, "showLogo": false, "showRightText": true }
```

To remove the entire header on a slide:

```json
"header": { "show": false }
```

## Right-header text

Default comes from `meta.url`. Override globally or per slide with `rightText`. Keep it short and one line. This can be a URL, product name, confidentiality label, event name, or section context.

The text uses a content-hug gradient. Do not place it in a full-width text box because gradient interpolation changes.

## Packaged logos

- `assets/logos/mark-light.svg`
- `assets/logos/mark-dark.svg`
- `assets/logos/wordmark-light.svg`
- `assets/logos/wordmark-dark.svg`

These reproduce the source deck defaults. The skill is designed for public reuse, so generated decks should replace them when a different brand is requested. Confirm redistribution permission before publishing any branded output.

PPTX compatibility rule: do not embed a logo as SVG with a transparent 1×1 fallback. The exporter must materialize the logo as a real transparent PNG while preserving the calculated display ratio. This rule applies to packaged and user-supplied SVG logos.

## Icon registry

Available names:

- `integration`
- `history`
- `skill`
- `run-circle`
- `download`
- `copy`
- `key`
- `action`
- `capabilities`
- `help`

Every icon has a light and dark SVG under `assets/icons/`. They were exported from the existing design-system icons and were not redrawn.

Rules:

- select an icon by semantic fit;
- do not create arbitrary new icon geometry;
- do not use emoji;
- do not paste tiny glyphs into the top-left of a 60px frame;
- render the glyph at true 32px visual size in the standardized 60×60 box;
- use a component-only 60×60 SVG with no Figma canvas, selection background, or oversized frame nodes;
- Light icon surface: `#FFFFFF`, 10px radius; Dark icon surface: white at 8% opacity, 12px radius;
- clip the HTML icon box to the registered radius. Dense 48px cards scale the radius proportionally to 8px Light / 9.6px Dark;
- use the matching light/dark variant;
- decorative icons use empty alt text; meaningful icons require adjacent text, not redundant alt labels.

## Image slot index

| Slot | Pixel size | Ratio | Fit | Radius | Typical use |
|---|---:|---:|---|---:|---|
| team | 1700×340 | 5:1 | cover + radial mask | 0 | team/workshop/environment below three content items |
| feature | 760×428 | 16:9 | cover | 24 | split image + text |
| card | 546.67×410 | 4:3 | cover | 24 | image card |
| image-card | flexible | 16:10 | cover | 24 | evidence gallery |
| full-bleed | 1920×1080 | 16:9 | cover | 0 | hero/section reset |

## Image selection

Use images as evidence, not decoration.

Prioritize:

1. user-provided verified product screenshots;
2. user-provided consented team/event photos;
3. diagrams or artifacts that support a claim;
4. licensed stock photography only when it adds context;
5. generated imagery only when the user requests it and it is clearly appropriate.

Reject or replace:

- screenshots containing sensitive data;
- customer logos/names without permission;
- watermarked stock images;
- low-resolution assets;
- images with no connection to the slide takeaway;
- arbitrary crops that cut off the important subject.

## Crop control

Use `image.position` to preserve the subject:

```json
"image": {
  "src": "./images/team.jpg",
  "alt": "Workshop participants reviewing a plan",
  "position": "50% 30%"
}
```

Common values:

- portrait subject high in frame: `50% 25%`;
- centered UI screenshot: `50% 50%`;
- subject on right, text on left: `70% 50%`;
- team mask source default: `50% 38%`.

Inspect the final rendered crop, not just the source image.

## User asset materialization

`generate-deck.mjs` copies local images/logos into `output/assets/user/` and rewrites the resolved JSON. The copied file name is deterministic from the slide/item role, which makes exports portable and prevents collisions.

Folder HTML shares assets. Single-file HTML inlines packaged and copied assets as data URLs. PPTX reads the copied files from the generated deck directory.

The folder generator is reference-aware: it copies only the packaged files actually referenced by the rendered deck, plus the font faces and licenses required by the deck language/components. It must not copy README previews, alternate backgrounds, unused icons, unused language fonts, font source archives, or maintenance manifests into every deck.

## Background and texture assets

Source backgrounds:

- Light: base, elements-cover, elements-inner, atmosphere;
- Dark: base, elements-cover, elements-inner, atmosphere.

Elements is usage-specific: covers may use the full composition; inner pages use the right-weighted composition. Atmosphere is a valid inner-page option in both themes.

Textures:

- light overlay;
- dark overlay;
- source texture reference.

All canonical backgrounds, textures, Hero, Showcase, and README previews use Lossless WebP. “Lossless” is a packaging invariant, not a visual-quality suggestion: do not use `quality: 95`, `quality: 100`, or another lossy WebP setting for these files. Preserve the original pixel dimensions and verify decoded RGBA equality when migrating from PNG.

PPTX does not read committed duplicate PNG backgrounds. `export-pptx.mjs` resolves the same canonical WebP selected by HTML, converts it to a PNG buffer with Sharp in memory, and caches that buffer for the export run. This preserves the current background pixels and avoids storing an additional `assets/backgrounds/compiled/` tree. Exact Figma-exported Elements variants must not receive an extra texture or wash during this conversion.

## Asset update procedure

1. Export the exact source node at its configured size.
2. Encode packaged raster assets as Lossless WebP while preserving dimensions and decoded pixels; keep logos/icons as SVG. For icons, run `node scripts/normalize-icons.mjs` to remove Figma canvas nodes without changing the design-system path, then run `node scripts/normalize-icons.mjs --check`.
3. Update the category manifest and `assets/asset-sources.json`.
4. Confirm HTML references the canonical WebP and PPTX converts that same file to PNG in memory; do not create committed compiled copies.
5. Run `scripts/validate-assets.mjs` to enforce the lossless format rule, reject duplicate compiled assets, and regenerate SHA-256 hashes.
6. Regenerate examples and run visual QA.

Do not make silent visual substitutions. If the source asset cannot be redistributed, record it as local-required and provide a documented replacement mechanism.
