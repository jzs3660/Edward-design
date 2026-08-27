# Speaker notes editor task

Create `handoffs/notes.json` using the brief and narrative handoff.

Requirements:

- Use stable slide IDs from `handoffs/narrative.json`.
- For each slide, write a purpose, 1–4 speaking points, and a transition.
- Preserve the requested language.
- Do not repeat all on-slide text verbatim.
- Do not invent interaction, audience response, timing, pronunciation, or contingency details unless supplied.
- Flag unsupported claims in `meta.openQuestions`.
- Do not edit narrative copy, assets, or final output.

Output shape:

```json
{
  "_status": "complete",
  "meta": {
    "role": "speaker-notes-editor",
    "assumptions": [],
    "openQuestions": []
  },
  "slides": {
    "slide-id": {
      "purpose": "Why this slide exists.",
      "talk": ["Speaking point."],
      "transition": "How to introduce the next slide."
    }
  }
}
```
