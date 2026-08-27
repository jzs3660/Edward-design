# Image direction and screenshot framing

Read this reference when a deck needs supplied photographs, product screenshots, diagrams, or user-authorized generated imagery. It supplements `assets-and-branding.md`; it does not authorize image generation, external downloads, or use of third-party brands.

## First decide the image's job

Every image must do at least one of these:

- prove a product behavior or result;
- show the people, environment, or artifact behind a claim;
- explain a relationship that prose cannot communicate as quickly;
- create a deliberate visual reset on a Cover or Full-bleed page.

Remove imagery that only decorates an already dense slide. Never generate visible slide titles, captions, logos, UI chrome, metrics, or footer text inside an image; those remain editable deck content.

## Slot contract

| Slot | Target | Composition requirement |
|---|---:|---|
| Cover media-bottom | 1360×360 | wide evidence strip; keep the subject away from the outer 8% |
| Team | 1700×340 | wide group/environment image below three content items; important faces and objects stay near the center 70% so the radial mask does not remove them |
| Split image + text | 760×428, 16:9 | reserve visual breathing room toward the text column; use `imageSide` to decide the safe side |
| Card image | 546.67×410, 4:3 | one subject or one readable interface state; avoid a collage inside a card |
| Image card | 16:10 | evidence-led screenshot, photo, or diagram with a clear focal point |
| Full bleed | 1920×1080, 16:9 | leave a calm title-safe area; protect the subject with `image.position` |

Do not solve a ratio mismatch by stretching. Crop with `cover`, switch to `contain` for screenshots that must remain fully readable, or choose another registered layout.

## Prompt contract for authorized generated imagery

When the user requests generated imagery, write the prompt in this order:

1. **purpose** — what claim or idea the image must support;
2. **subject** — the concrete people, object, interface, or system shown;
3. **setting/action** — observable context rather than abstract adjectives;
4. **composition** — target ratio, focal location, and title/text-safe area;
5. **visual treatment** — restrained editorial lighting, quiet neutral surfaces, subtle cyan/blue/violet accents when appropriate;
6. **evidence constraints** — no invented product UI, customer logo, metric, or performance claim;
7. **exclusions** — no embedded typography, presentation frame, watermark, decorative border, fake chart labels, or illegible pseudo-text.

Reusable suffix:

```text
Compose for [SLOT AND RATIO], with the primary subject at [POSITION] and a calm safe area on [SIDE]. Editorial, precise, credible, restrained color, realistic materials and lighting. No text, logo, watermark, slide frame, device mockup, decorative border, fake metrics, or invented interface details.
```

Use the generated file only after checking resolution, crop, factual implications, and whether it is visibly synthetic in a context that requires documentary evidence. Record generated provenance in the Source or delivery notes when relevant.

## Product screenshot framing

Treat a screenshot as evidence, not as a background texture.

- Preserve the useful UI region at readable scale; crop empty browser chrome before shrinking the product.
- Redact personal data, tokens, internal URLs, customer names, and confidential workspaces before import.
- Use `contain` when every control or label matters. Use `cover` only when the screenshot is illustrating one localized behavior and the crop has been inspected.
- Keep screenshots level and undistorted. Do not apply perspective, device mockups, heavy shadows, or thick frames unless the user explicitly requests that presentation.
- Prefer the slide/card surface and registered radius as the frame. Do not bake an Aident page header, title, Callout, or Source into the screenshot.
- If the source aspect ratio is unsuitable, capture or redesign the screenshot at the target slot ratio instead of compressing it.

## Split composition

For `split-image-text`:

- keep the text column on the left and the image on the right;
- keep the image's left edge calm next to the text and avoid a subject that visually collides with the copy column;
- preserve the registered 80px media/text gap;
- keep the main page heading outside the split region;
- use one image only.

## Verification

Inspect the rendered slide at 1920×1080 and confirm:

- the subject survives the final crop/mask;
- screenshot text that matters is readable;
- no image carries editable slide copy;
- no sensitive or unauthorized content appears;
- alt text describes the evidence, not its styling;
- Source/provenance is present when the image or claim requires it;
- the image does not collide with the heading, Callout, Source, or safe margins.
