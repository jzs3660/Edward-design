# Export and presentation

The content JSON is the shared input. Folder HTML is the default, primary deliverable and the most faithful runtime. Generate and validate HTML first. Export PDF or PPTX only when the user explicitly requests that format; PDF is a flattened print artifact, while PPTX preserves editable text and shapes where practical.

## Runtime dependencies

Node 20+ is required. The Codex bundled workspace runtime provides Playwright, Artifact Tool, Sharp, Python, Poppler, and presentation helpers.

When working in Codex, resolve runtime paths first and set:

```bash
RUNTIME_NODE=/absolute/path/to/node
RUNTIME_NODE_MODULES=/absolute/path/to/node_modules
RUNTIME_BIN_DIR=/absolute/path/to/runtime/bin
```

Use the returned paths exactly. Do not install duplicate dependencies into the skill unless the runtime is unavailable.

## Folder HTML

```bash
node "$SKILL_DIR/scripts/generate-deck.mjs" \
  --input /absolute/path/deck.json \
  --out /absolute/path/output/deck
```

Output:

```text
deck/
  index.html
  deck.resolved.json
  assets/
    backgrounds/
    components/
    fonts/
    icons/
    logos/
    runtime/
    templates/
    textures/
    tokens/
    user/
```

Open `index.html` directly or serve the folder with a static server. It does not require Figma or a build step.

## Single-file HTML

```bash
node "$SKILL_DIR/scripts/generate-deck.mjs" \
  --input /absolute/path/deck.json \
  --out /absolute/path/output/deck \
  --single-file
```

Output: `deck.single.html` plus the resolved JSON/assets directory used during generation. The HTML file itself embeds CSS, JavaScript, bundled fonts, backgrounds, logos, icons, and local user assets.

Use for portable review, email/file delivery, offline playback, and web embedding. Large images/fonts increase file size; use folder output when hosting or versioning.

## Navigation

Audience view controls:

- Right Arrow / Page Down / Space: next slide.
- Left Arrow / Page Up: previous slide.
- Home / End: first / last.
- `G` or Escape: overview grid.
- `P`: presenter mode.
- `B` outside presenter mode: low-power animation mode.

The bottom navigation contains previous, next, overview, presenter, page count, and slide dots.

## Presenter mode

Presenter mode includes:

- current slide preview;
- next slide preview;
- slide purpose;
- speaking points;
- transition note;
- timer;
- first/previous/next/last controls;
- black screen;
- white screen;
- freeze/unfreeze audience;
- reopen audience window.

The presenter and audience windows synchronize through `BroadcastChannel` and `postMessage`. Popup permissions may be required to open the audience window.

Validate the final runtime and slide/notes alignment:

```bash
node "$SKILL_DIR/scripts/validate-presenter.mjs" \
  --html /absolute/path/output/deck/index.html \
  --require-notes
```

Omit `--require-notes` for an informal deck where notes are intentionally optional; missing notes are then warnings rather than errors.

Presenter keyboard controls:

- arrows/Page Up/Page Down/Space: navigate;
- `B`: black screen;
- `W`: white screen;
- `F`: freeze/unfreeze audience.

## Animation

HTML uses a restrained reveal sequence:

- heading starts at index 0;
- content items use incremental indices;
- callout uses a later index;
- duration: 560ms;
- stagger: 70ms;
- movement: 20px vertical plus opacity;
- reduced-motion preference disables animation;
- embed/overview/low-power modes render static content.

Do not animate every sub-line independently. Preserve reading order and keep motion subordinate to the message.

## Web hosting

Folder output is static. Serve it from any HTTPS static host. Confirm:

- asset URLs remain relative;
- the server serves SVG, PNG, TTF, OTF, CSS, JS, and HTML MIME types correctly;
- popups are permitted for presenter mode;
- the host’s content security policy allows local fonts and data URLs if single-file output is used;
- sensitive slides are not uploaded to a public URL.

## Optional PDF export

Generate HTML first, then:

```bash
RUNTIME_NODE_MODULES="$RUNTIME_NODE_MODULES" node "$SKILL_DIR/scripts/export-pdf.mjs" \
  --html /absolute/path/output/deck/index.html \
  --out /absolute/path/output/deck.pdf
```

The PDF uses 1920×1080 CSS pages (1440×810 points), prints backgrounds, disables animation/navigation, and emits one slide per page.

Always render the PDF to PNGs with Poppler and inspect every page. Do not trust successful export alone.

## Optional editable PPTX export

Generate folder HTML/resolved JSON first. Ensure compiled backgrounds exist; they are packaged by default.

```bash
RUNTIME_NODE="$RUNTIME_NODE" \
RUNTIME_NODE_MODULES="$RUNTIME_NODE_MODULES" \
RUNTIME_BIN_DIR="$RUNTIME_BIN_DIR" \
node "$SKILL_DIR/scripts/export-pptx.mjs" \
  --input /absolute/path/output/deck/deck.resolved.json \
  --asset-root /absolute/path/output/deck \
  --out /absolute/path/output/deck.pptx \
  --preview-dir /absolute/path/output/qa/pptx-preview
```

Validate the exported layout metadata before release:

```bash
node "$SKILL_DIR/scripts/validate-pptx-layout.mjs" \
  --layouts /absolute/path/output/qa/pptx-preview
```

PPTX behavior:

- native editable text boxes for headings, labels, body, callouts, and sources;
- native editable card/divider/callout shapes;
- SVG/PNG logo and icons;
- packaged precomposed texture backgrounds;
- replaceable user images;
- speaker notes from `notes`;
- slide names from stable IDs;
- optional Artifact Tool preview PNG/layout JSON/montage.

Some HTML-specific features are flattened or approximated in PPTX:

- Validated HTML remains the visual source of truth and release priority.
- PPTX is an optional editable adapter, not the reference renderer.
- A target PowerPoint installation may substitute fonts or calculate different glyph metrics even when the font files are bundled. Keep the text editable, run the packaged checks, and document any remaining application-specific adjustment instead of changing the HTML design to match a fallback renderer.

- CSS blend modes -> compiled background PNG;
- backdrop blur -> translucent shape approximation;
- gradient text -> theme accent solid where native gradient text is unreliable;
- CSS radial image mask -> image crop approximation unless a PowerPoint mask is added manually;
- web animations/presenter sync -> not included in PPTX.

The slide remains substantially editable; fidelity differences must be inspected and reported when material.

## PPTX validation

Use the presentation runtime helpers:

```bash
python render_slides.py /absolute/path/deck.pptx --output_dir /absolute/path/qa/pptx-rendered
python slides_test.py /absolute/path/deck.pptx
python create_montage.py --input_dir /absolute/path/qa/pptx-rendered --output_file /absolute/path/qa/pptx-montage.png --label_mode filename
```

Inspect every slide. Pay special attention to font substitution, title wrapping, dense 6-card layouts, callout text, and image crops.

Chrome/Skia may serialize CSS `background-clip:text` gradients as vector clipping boundaries that some PDF renderers expose as hairlines. The packaged print stylesheet therefore uses theme-matched solid text colors for gradient text in PDF while HTML retains the full gradients. Treat any visible clipping rectangle or hairline as a PDF release error.

## Background compilation for PPTX

PowerPoint cannot reproduce the HTML texture blend stack reliably. Rebuild the compiled backgrounds after any source/texture change:

```bash
RUNTIME_NODE_MODULES="$RUNTIME_NODE_MODULES" node "$SKILL_DIR/scripts/compile-backgrounds.mjs"
```

The script uses Sharp to combine:

- background source;
- theme texture with the registered blend/opacity;
- left-to-right readability wash.

## Output selection

| Need | Best output |
|---|---|
| faithful motion and presenter notes | folder HTML |
| portable offline presentation | single-file HTML |
| print/share with locked appearance | PDF |
| edit text and shapes in PowerPoint | PPTX |
| publish as a webpage | folder HTML on static host |

When the user asks for all formats, generate and verify them from the same resolved JSON so content remains synchronized.

## Delivery package

Recommended final structure:

```text
delivery/
  deck.json
  web/
    index.html
    assets/
  deck.single.html
  deck.pdf
  deck.pptx
  qa/
    html/
    pdf/
    pptx/
```

Keep QA files unless the user requests a minimal delivery. Never deliver only a screenshot when editable/source output was requested.
