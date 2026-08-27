# Format QA reviewer task

Review one generated format without changing final artifacts. Write the assigned `qa/*-report.json` plus screenshots/renders in the assigned QA directory.

Requirements:

- Read `references/quality-gates.md` and the relevant export instructions.
- Run the format-specific automated checks.
- Inspect every page/slide, not only the montage.
- Report P0/P1/P2 findings with slide ID/page, evidence path, and recommended fix.
- Do not implement fixes; the lead owns integration.
- Do not mark `pass: true` if any P0 or P1 finding remains.

Output shape:

```json
{
  "format": "html",
  "pass": true,
  "commands": [],
  "artifactsInspected": [],
  "findings": [
    {
      "severity": "P1",
      "slideId": "example",
      "issue": "Description",
      "evidence": "qa/html/slide-03.png",
      "recommendation": "Concrete correction"
    }
  ]
}
```
