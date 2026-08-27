# Content schema

The generator accepts one JSON file. `references/deck.schema.json` describes the general shape; `scripts/generate-deck.mjs` performs the stricter semantic and layout-budget validation.

The schema and generator reject unknown fields. A misspelling such as `showDivder` is an error rather than a silently ignored option; use only the registered keys documented here.

All visible presentation copy is data-driven. Cover and inner headings, point/card/metric/step/comparison fields, numeric values, bullet lists, callouts, sources, and speaker notes are editable in this JSON. The generator never requires visible copy to be baked into a background image. Exported PPTX uses native text boxes for these fields; edit the JSON and regenerate when HTML, PDF, and PPTX must remain synchronized.

## Root object

```json
{
  "meta": {},
  "slides": []
}
```

## Meta fields

| Field | Required | Type | Meaning |
|---|---|---|---|
| `title` | yes | string | Document title and browser/PDF title |
| `language` | yes | `en` or `zh` | Selects typography and copy budgets |
| `brandName` | recommended | string | Accessible logo label |
| `url` | optional | string | Default right-header text |
| `logo` | optional | string or object | One logo path or `{light,dark}` theme paths |
| `header` | optional | object | Global header visibility and right text |

Header object:

```json
{
  "show": true,
  "showLogo": true,
  "showRightText": true,
  "rightText": "example.com"
}
```

Per-slide `header` overrides the global header.

## Shared slide fields

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique stable kebab-case ID |
| `type` | yes | Registered layout type |
| `theme` | yes | `light` or `dark` |
| `background` | recommended | `base`, `elements-cover`, `elements-inner`, or `atmosphere` according to page usage |
| `coverIdentity` | cover only | `kicker`, `logo`, or `none` |
| `coverLayout` | cover only | `text-only`, `media-bottom`, or `full-bleed` |
| `kicker` | optional | Compact category/section label |
| `title` | yes | Takeaway headline |
| `subtitle` | optional | One supporting sentence |
| `callout` | optional | Supporting default/accent callout |
| `source` | optional | One-line attribution/source |
| `notes` | optional | Presenter notes |

Stable IDs enable deep linking, presenter sync, QA reports, and deterministic screenshots.

## Background values

Both themes support the same semantic names:

- `elements-cover`: cover only; the decorative field may use both sides around centered content.
- `elements-inner`: inner only; the visible decorative field is weighted to the right so the left title/content area remains readable.
- `atmosphere`: Light/Dark inner-page atmosphere for metrics, comparisons, transitions, and image/text layouts.
- `base`: quiet Light/Dark surface for dense cards or detailed comparisons.

If omitted, covers use `elements-cover` and inner slides use `elements-inner`. Legacy `paper`/`ink`/`motion`/`aurora`/`elements` values are accepted and migrated contextually, but new decks should use the semantic names above.

## Items

Point/card/metric/comparison/image-card items use a shared extensible object. Only fields relevant to the selected layout are rendered.

```json
{
  "icon": "integration",
  "showIcon": true,
  "label": "ALIGN",
  "showLabel": true,
  "title": "Shared context",
  "body": "Keep goals, constraints, and ownership visible.",
  "image": {
    "src": "./images/context.png",
    "alt": "Planning view showing goals and owners",
    "position": "50% 30%",
    "fit": "cover"
  }
}
```

Optional labels and icons:

- omit `label` or set `showLabel: false`;
- omit `icon` or set `showIcon: false`;
- do not leave empty strings to simulate removal.

## Callout

```json
{
  "tone": "accent",
  "metric": "RULE",
  "body": "One concise supporting statement tied to the main content."
}
```

- `tone`: `default` or `accent`.
- `metric`: optional short emphasis phrase; `label` is accepted as an alternate key.
- `body`: concise supporting sentence.
- English maximum: 180 characters.
- Chinese maximum: 70 characters.
- A callout cannot be a slide `type`.
- Omit both `metric` and `label` for the registered body-only variant. Do not pass an empty string and do not invent a label only to fill the component.

## Presenter notes

```json
{
  "purpose": "What this slide must accomplish.",
  "talk": [
    "First speaking point.",
    "Second speaking point."
  ],
  "transition": "How to introduce the next slide."
}
```

PPTX stores notes on the slide. HTML presenter mode displays them beside current/next previews.

## Cover

Required: shared fields only. Optional identity, kicker/subtitle, and image layout. A cover never renders the inner-page brand header.

```json
{
  "id": "cover",
  "type": "cover",
  "theme": "dark",
  "background": "elements-cover",
  "coverIdentity": "logo",
  "coverLayout": "text-only",
  "title": "A clear presentation title",
  "subtitle": "One sentence describing purpose and scope."
}
```

Cover title is centered automatically. `coverIdentity: "logo"` uses `meta.logo` or the packaged theme logo above the title. Use `"kicker"` to show the kicker instead, or `"none"` for no top identity. Do not set `titleAlignment` on inner slides.

## Points

`items`: exactly 2, 3, 4, or 6.

```json
{
  "type": "points",
  "items": [
    { "icon": "integration", "label": "ALIGN", "title": "Shared context", "body": "Concise explanation." },
    { "showLabel": false, "icon": "history", "title": "Recorded choices", "body": "Concise explanation." }
  ]
}
```

## Cards

`items`: exactly 2, 3, 4, or 6. Each item may omit `image` for the no-image component.

```json
{
  "type": "cards",
  "items": [
    { "icon": "skill", "title": "Reusable method", "body": "Concise explanation." },
    { "image": { "src": "./images/example.jpg", "alt": "Relevant evidence" }, "title": "Visible outcome", "body": "Concise explanation." }
  ]
}
```

For consistent rhythm, prefer all-image or all-no-image in a single row.

## Metrics

`items`: exactly 2, 3, 4, or 6. Each metric normally has `value`, `title`, `body`, and optional `label`.

```json
{
  "type": "metrics",
  "items": [
    { "label": "TIME TO REVIEW", "value": "30 min", "title": "Early visibility", "body": "Time to a reviewable first pass." },
    { "showLabel": false, "value": "1 owner", "title": "Clear accountability", "body": "Each action has one accountable owner." }
  ]
}
```

Mark placeholder metrics as illustrative. Replace with verified values before external use.

## Workflow

`steps`: exactly 3 or 4.

```json
{
  "type": "workflow",
  "workflowLabel": "EXAMPLE WORKFLOW",
  "showWorkflowLabel": true,
  "showArrows": true,
  "showDividers": true,
  "showStepLabels": true,
  "steps": [
    { "number": "01", "label": "COLLECT", "title": "Collect inputs", "body": "Gather relevant material." },
    { "number": "02", "label": "ORGANIZE", "title": "Organize signals", "body": "Make gaps visible." },
    { "number": "03", "label": "REVIEW", "title": "Review output", "body": "Confirm the decision." }
  ]
}
```

`number` is optional; the generator creates zero-padded numbers. `workflowLabel` is optional. `showArrows`, `showDividers`, and `showStepLabels` are independent. Arrows render as a dedicated row 32px above the complete Step row, with one visible direction line above every Step, including the final Step; they are never children of an individual Step component. Step numbers use the registered theme colors (`#008089` Light / `#1EEAEA` Dark), not inherited body text colors.

## Comparison

`items`: exactly 2.

```json
{
  "type": "comparison",
  "items": [
    { "label": "CURRENT", "title": "Fragmented state", "body": "Context is repeatedly lost.", "points": ["Several sources", "Changing owners", "Late criteria"] },
    { "label": "TARGET", "title": "Coherent state", "tone": "accent", "body": "Each stage leaves context.", "points": ["Visible truth", "Explicit owners", "Linked evidence"] }
  ]
}
```

## Image cards

`items`: exactly 2 or 3.

```json
{
  "type": "image-cards",
  "items": [
    { "image": { "src": "./images/observation.jpg", "alt": "Observed work context" }, "title": "Observed behavior", "body": "What the audience should notice." },
    { "image": { "src": "./images/outcome.jpg", "alt": "Verified outcome" }, "title": "Visible outcome", "body": "Why it matters." }
  ]
}
```

Missing images deliberately render as replaceable placeholders during drafting. Delivery QA must decide whether placeholders are acceptable.

## Team

```json
{
  "type": "team",
  "items": [
    { "label": "STANDARD", "title": "Shared practice", "body": "One concise responsibility." },
    { "label": "OWNERSHIP", "title": "Clear roles", "body": "One concise responsibility." },
    { "label": "RHYTHM", "title": "Regular review", "body": "One concise responsibility." }
  ],
  "image": { "src": "./images/team.jpg", "alt": "Team workshop", "position": "50% 38%" },
  "notes": { "talk": ["Image source and consent: replace with verified details."] }
}
```

The Team layout is strictly three content items followed by the 1700×340 masked image. It does not accept `callout` or `source`; keep provenance in `notes`. The slide takeaway belongs in the normal page `title`. Keep the page title to one line (30 English characters or 12 Chinese characters).

## Split image + text

```json
{
  "type": "split-image-text",
  "imageSide": "left",
  "image": { "src": "./images/pilot.jpg", "alt": "Pilot workflow" },
  "contentTitle": "Choose a visible, repeatable task",
  "body": "Short explanatory paragraph."
}
```

## Full bleed

```json
{
  "type": "full-bleed",
  "theme": "dark",
  "image": { "src": "./images/hero.jpg", "alt": "Relevant scene", "position": "60% 50%" },
  "title": "One strong statement",
  "subtitle": "Short supporting sentence."
}
```

## Image paths

Accepted:

- relative path resolved from the input JSON directory;
- absolute path;
- existing `assets/...` path;
- HTTPS URL for HTML;
- data URL.

Local paths are copied into output `assets/user/` with deterministic names. Use local paths when PPTX/PDF is required because those adapters need durable bytes.

## Validation failures and remedies

| Failure | Remedy |
|---|---|
| unsupported count | choose a supported layout or split the slide |
| title exceeds one-line budget | shorten, move detail to body, or reduce column count |
| inner title centered | remove the override; only cover is centered |
| icon not registered | select from the icon manifest |
| emoji detected | replace with packaged icon or plain text |
| callout too long | compress to a single supporting statement |
| duplicate slide ID | assign unique stable ID |
| missing local asset | correct the path or provide the file |

## Sensitive and unverifiable content

- Do not introduce company/customer names, pricing, proprietary claims, or confidential metrics unless supplied and approved by the user.
- Use generic examples such as “Example Studio,” “illustrative framework,” or “replace with verified internal measurement.”
- Any quantitative claim should have a source footer or be explicitly labeled illustrative.
- Image alt text must describe the image, not repeat the slide title.
