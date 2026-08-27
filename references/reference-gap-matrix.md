# Reference coverage matrix

Baseline: `op7418/guizang-ppt-skill`, audited at commit `c91369c449d34755d320a8b81d0734000d99d1ab`. The goal is not to copy its aesthetic; it establishes the minimum operational granularity for a reusable presentation skill.

| Baseline capability | Baseline implementation | This skill | Status |
|---|---|---|---|
| Main authoring instructions | Large SKILL workflow | `SKILL.md` with required narrative/layout/export/QA workflow | exceeded |
| Public usage documentation | bilingual repository README and examples | bilingual `README.md`/`README.en.md`, quick start, formats, editable fields, licensing, QA | met/exceeded |
| Multi-platform Agent use | HTML-first Agent workflow | Codex/Claude Code/Cursor-compatible local package with no Figma runtime dependency | met |
| Multi-Agent orchestration | no concrete role/ownership/handoff runtime in the baseline | seven registered roles, single-writer ownership, assignment prompts, run schema, deterministic assembly, parallel QA, release gate | added/exceeded |
| Layout documentation | 10 base + 22 extension layouts | 10 registered slide types plus a page-by-page catalog of counts, geometry, bilingual copy budgets, backgrounds, image slots, Callout/Source compatibility, and failure routing | exceeded |
| Theme system | preset themes | exact light/dark Aident tokens, gradients, backgrounds, textures | exceeded |
| Single-file HTML | HTML template/runtime | folder HTML and inlined single-file HTML | met |
| Presenter mode | current/next, structured notes, timing/rehearsal, auto-advance, annotation tools, audience sync/recovery | current/next, structured notes, timer, freeze, black/white, audience sync, and a dedicated validator | core met; advanced rehearsal/auto-advance/annotation/storage-recovery remain optional gaps |
| Keyboard navigation | navigation runtime | arrows, Page keys, Space, Home/End, overview, presenter | met |
| Low-power mode | runtime mode | included, plus reduced-motion/embed static behavior | met |
| Image slots | documented slots | team/feature/card/image-card/full-bleed with crop/alt/provenance rules | exceeded |
| Image prompting | provider-oriented prompt recipes and ratio rules | Aident-specific, provider-neutral purpose/subject/composition/exclusion contract for every registered slot | met |
| Screenshot framing | dedicated screenshot semantics | privacy, crop/contain, legibility, distortion, framing, and slot-ratio rules | met |
| Background assets | screenshot/background library | 8 explicit Light/Dark × Base/Elements Cover/Elements Inner/Atmosphere variants plus texture references and compiled PPTX backgrounds | exceeded |
| Layout validation | locked-layout static rules plus Playwright measurement | schema/semantic validator + system-contract validator + Playwright overlap/overflow/font/image/component checks | met/exceeded |
| Title-gap/overflow checks | specialized scripts | major-region collision, slide bounds, one-line titles, auto-fit minimums | exceeded |
| Asset validation | basic packaged assets | per-category manifests + SHA-256/size manifest generator | exceeded |
| Fonts | system/theme notes | bundled OFL fonts, restricted-font license handling, CSS/index/checker | exceeded |
| Bilingual output | not primary | complete English/Chinese font hierarchy and examples | exceeded |
| Editable PPTX | not primary | Artifact Tool native text/shapes, notes, preview, overflow QA | exceeded |
| PDF | browser output | dedicated export script and Poppler QA workflow | exceeded |
| Replaceable brand | theme/HTML editing | JSON-driven logo, right text, brand label, per-theme assets | exceeded |
| Callout variants | layout-specific elements | default/accent, all compatible layouts, no standalone version | exceeded |
| Component optionality | layout variations | label/icon/header/source/callout/arrow variants | exceeded |
| Content schema | implicit template editing | JSON schema + semantic validation + full examples | exceeded |
| Figma dependency | not required | Figma used only for maintenance/provenance; runtime self-contained | met |
| Community repository packaging | LICENSE, CONTRIBUTING, issue/PR templates, CI | public GitHub repository, bilingual usage docs, validation scripts, and an explicit rights notice are present; an open-source repository license and community automation still require a separate owner decision | partially met |
| Social cover generator | 21:9/1:1/3:4 derivative cover workflow | intentionally excluded; this Skill is scoped to 16:9 presentation production | out of scope |

## Additional guarantees in this skill

- Every visible text field is JSON-driven and editable; PPTX exports preserve native text boxes for those fields.
- Multi-Agent runs reject pending handoffs, overlapping declared write ownership, unknown slide IDs, and missing format QA reports.
- Cover-only centered title rule is enforced.
- All inner titles and component text are left-aligned by default.
- 150% line-height is represented as a ratio, never a fixed 150px value.
- Point/card/step/metric titles are one-line with both content budgets and browser width checks.
- Callout accent is the registered three-stop gradient at 16% fill opacity with blur and no stroke; system and browser validation reject 100% fill or whole-component opacity.
- Source footer, logo, and right-header text are independently optional.
- Replacement logos are height-limited and keep their intrinsic aspect ratio in HTML and PPTX; browser QA rejects more than 1.5% ratio drift.
- Team is a strict masked-image layout with no invented caption row; its support regions are the registered optional Callout and Source.
- Six-card, Team, and split-with-Callout layouts have explicit cross-format page-title budgets.
- Callouts support both labeled and body-only content without empty fixed lead frames.
- True design-system icons are packaged for both themes.
- Chinese type roles are componentized in the runtime, not applied as one generic fallback.
- PPTX backgrounds are precomposed to prevent opaque texture failures.
- Example copy avoids proprietary/commercial claims and uses realistic placeholder lengths.
- Workflow arrows live in a separate row, render only between adjacent steps, and expose independent arrow/label/divider options in HTML and PPTX.

## Deliberate differences from the baseline

- The baseline's raw layout count is not a target. This package registers only layouts derived from the approved Aident/Figma system, then exposes 2/3/4/6 and image/no-image variants through those components.
- The baseline's multiple visual themes are not copied. Aident Light/Dark backgrounds and registered background treatments are the allowed visual system.
- Social cover generation is a separate deliverable and should use a dedicated visual-content Skill rather than expanding this presentation Skill.
- Automatic update checks are deferred until an update channel and a repository-level distribution license are approved.
- Advanced presenter rehearsal, auto-advance, laser/drawing tools, and storage-based recovery are useful future enhancements, but they do not block generation, editing, HTML presentation, or optional PDF/PPTX export.

## Remaining format limitations

- PPTX cannot exactly reproduce browser backdrop blur, blend modes, and CSS gradient text in all PowerPoint versions. The adapter uses inspected approximations and precomposed backgrounds.
- The team radial mask is most faithful in HTML; PPTX currently uses a crop approximation.
- The source reference's SF Pro and MiSans metrics are approximated by open, bundled Noto Sans and Noto Sans SC; this avoids local-font dependencies but can cause small glyph-width differences, so browser and PPTX visual QA remain mandatory.
- Public visibility does not itself license Aident brand, logo, background, icon, or design-system assets. The repository `NOTICE.md` records this limitation; bundled font licenses apply only to the corresponding fonts.

These limitations are explicit, tested, and do not create a Figma runtime dependency.
