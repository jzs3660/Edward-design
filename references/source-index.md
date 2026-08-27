# Source and provenance index

This index separates design verification sources from runtime dependencies.

## Runtime independence

Generated decks use only this packaged skill plus user-supplied content/assets. They do not fetch tokens, components, fonts, icons, backgrounds, or layout rules from Figma at generation time.

Figma is required only when maintaining or re-verifying the skill. The source PDFs are visual references only.

## Primary design source

The system was verified against the approved internal Aident PPT design file and its editable component/template section. Private file keys, URLs, and node identifiers are intentionally omitted from this public package. The packaged tokens, component registry, assets, layout catalog, and validation contracts are the public runtime source of truth.

The source audit covered Brand Header, Source Footer, Point, Step, Metric, Callout, Card, Image Mask, Icon, Workflow, Kicker, Divider, Comparison, Background Layer, Texture Overlay, Chinese Typography, and Gradient Swatches components. It also covered all registered Light/Dark cover and inner-page templates, including Elements and Atmosphere background variants.

## Source PDFs

Two local authoring PDFs were used as visual references; they are not distributed with this repository, and their local paths are intentionally omitted.

The editable Figma copy remains the primary geometry/component source. PDFs are used to verify composition, imagery, and overall sequence, not to recover editability.

## Reference implementation used for granularity

- Repository: `https://github.com/op7418/guizang-ppt-skill`.
- Audited commit: `c91369c449d34755d320a8b81d0734000d99d1ab` (2026-08-07); rechecked on 2026-08-27.
- Reviewed areas: SKILL workflow, reference documentation, HTML templates, background assets, presenter runtime, layout validator, and overflow/title-gap checks.
- The local comparison is documented in `references/reference-gap-matrix.md`.

The reference repository is not a runtime dependency and is not copied into this skill.

## Font sources

| Family | Source | Packaging status |
|---|---|---|
| Outfit | `https://github.com/Outfitio/Outfit-Fonts` | bundled under OFL |
| Instrument Serif | `https://github.com/Instrument/instrument-serif` | bundled under OFL |
| Noto Sans | `https://github.com/google/fonts/tree/main/ofl/notosans` | bundled under OFL |
| Noto Sans SC | `https://github.com/google/fonts/tree/main/ofl/notosanssc` | bundled under OFL |
| Smiley Sans | `https://github.com/atelier-anchor/smiley-sans` | bundled under OFL |
| Noto Serif CJK | `https://github.com/notofonts/noto-cjk` | bundled under OFL |

License files live under `assets/fonts/licenses/`. `assets/fonts/manifest.json` is canonical.

## Asset provenance

- Backgrounds, textures, logos, and icons were exported from the primary Figma file/Stage 2 system.
- Icons are curated existing Aident design-system symbols, not redrawn approximations.
- Gradients are transcribed from final Figma style/component values.
- Compiled PPTX backgrounds are derivative build artifacts generated locally from the packaged source background + texture + wash.
- User images/logos are never included in the source manifests; they are copied into each generated output’s `assets/user/` directory.

Machine-readable details: `assets/asset-sources.json` plus category manifests.

## Updating from Figma

1. Confirm the intended source node and variant.
2. Inspect properties and geometry programmatically.
3. Export the exact asset; do not redraw.
4. Update the relevant machine-readable tokens/registry first.
5. Update HTML and PPTX adapters.
6. Update this index and the packaged asset provenance without publishing private design-file identifiers.
7. Recompile backgrounds if required.
8. Regenerate SHA-256 manifest.
9. Run EN/ZH HTML preflight, PDF render, PPTX render, and slide overflow tests.

Do not add a live Figma API call to the generation path. The maintenance process should end by packaging stable local files.
