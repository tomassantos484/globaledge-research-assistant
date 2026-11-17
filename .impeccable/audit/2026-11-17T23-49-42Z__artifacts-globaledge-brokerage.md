---
target_identity: "file:/home/runner/workspace/artifacts/globaledge-brokerage"
timestamp: 2026-11-17T23-49-42Z
slug: artifacts-globaledge-brokerage
---
# GlobalEdge Brokerage — Audit Fix Verification

## Implementation Integrity Verdict

**Pass within the verified scope.** The existing broker research and evidence
workflow remains intact. The browser still calls the same app API, fixture
responses remain explicitly labeled, citations focus source records, warnings
remain visible, and disclosures distinguish historical evidence from live
market data. No API, authentication, workflow integration, or factual product
copy was changed.

## Audit Health Score

| Dimension | Score | Evidence and limits |
|---|---:|---|
| Accessibility | 3/4 | Verified rendered text contrast, readable functional text, keyboard citations, and motion alternatives; not a screen-reader certification |
| Performance | 3/4 | Four local WOFF2 assets replace external fonts; no load-time or performance benchmark claimed |
| Theming | 4/4 | Seven exact approved colors; reachable 404/error screens also use palette tokens; deliberately light-only |
| Responsive Design | 3/4 | Both routes at 320, 390, 768, 1280px, plus effective 200% zoom and doubled-text stress; no physical-device or native-browser-zoom certification |
| Implementation Integrity | 4/4 | Sample prompts, answer/source references, warnings, disclosures, copy, print, retry, and withheld-answer states verified |
| **Total** | **17/20** | **Good — five reported findings resolved in the checked scope, not a perfect-score promise** |

## Executive Summary

All five findings in the refreshed baseline audit were addressed. The focused
browser pass found a CSS cascade error in the first reduced-motion fix and a
classic-scrollbar overflow at 320px. Both were corrected and specifically
re-verified, along with a source-label wrapping issue.

**Open verified defects from these five findings: 0 P0, 0 P1, 0 P2, 0 P3.**
The limitations below are verification boundaries, not a claim that every
possible accessibility issue has been eliminated.

## Findings and Evidence

### 1. Text contrast — resolved

- `src/index.css`: shared kickers, text on light-gray surfaces, counters, and
  help use approved dark gray where needed. Placeholder opacity is now 1.
- Citation text changed from slate on blue-gray (**3.34:1**, insufficient for
  normal text) to near-black on blue-gray (**7.63:1**).
- Dark gray on light gray is **6.70:1**; medium gray remains suitable on white
  at **4.74:1**; white on slate is **8.51:1**.
- Browser verification scanned visible text against its opaque background in
  answered, loading, selected, hover, disabled, and print-media states:
  lowest observed ratio **4.74:1**, with no observed text below 4.5:1.
- Disabled text is not faded by an opacity rule. Large headings also exceed
  the required 3:1 threshold.

### 2. Small functional text and responsive controls — resolved

- Question help, counters, submit/sample actions, runtime status, source
  details, warnings, result actions, evaluation details, and disclosures
  target **14px or larger**. Compact labels remain **12px or larger**.
- Standalone controls target **44px minimum height**. Inline citation buttons
  remain inline with answer prose (23px observed); the inline-text exception
  applies to WCAG 2.2 SC 2.5.8, and these are intentionally excluded from the
  standalone 44px target.
- Header, composer footer, result heading/actions, banners, loading details,
  and footer wrap rather than compressing text. The one-column breakpoint
  now accommodates the enlarged labels at intermediate widths.
- Both routes and representative answered/empty states were checked at
  **320, 390, 768, 1280 CSS px**. No final horizontal page overflow or text
  clipping was observed.
- The browser's classic 15px scrollbar leaves 305px available at a 320px
  viewport. Removing the fixed body minimum corrected the initial overflow;
  final measured scrollWidth and clientWidth were both **305px**.
- Effective 200% zoom at a 1280px viewport was tested with a 640px CSS
  viewport and an additional test-only 2x computed-text-size stress. Both
  routes remained usable with scrollWidth = clientWidth = **625px**.
  This was not an actual browser-UI zoom operation.
- Source definition terms now scale with their font size; “Document” stays
  on one line at 320, 390, and 1280px in the verification fixture.

### 3. Reduced motion — resolved

- `src/App.tsx`: citation activation checks the **current** media preference
  each time, uses `instant` scrolling for reduced motion and `smooth`
  otherwise, and retains source focus with `preventScroll: true`.
- Keyboard activation focused the selected `article` (`tabIndex=-1`) and
  updated its selected outline under both preferences, including changing
  the preference without reloading.
- `src/index.css`: targeted alternatives replace the global 0.01ms override.
  Skeletons are static approved blue-gray with no gradient, spinning and
  entrance animation stop, and relevant transitions stop. Loading labels,
  elapsed time, disabled controls, and completion feedback remain available.
- The first browser pass exposed a later `.spin` rule overriding the media
  query. The more specific `.ge-shell .spin` alternative was confirmed at
  runtime: spinner and all four skeletons computed `animation-name: none`
  after switching preferences mid-request and on a fresh reduced-motion
  request; elapsed time continued advancing and the result still appeared.

### 4. Palette discipline — resolved

- Authored application CSS contains exactly the approved literal colors:
  slate `#444E55`, blue-gray `#97A4AF`, white `#FFFFFF`, light gray `#F1F1F1`,
  dark gray `#545454`, medium gray `#737373`, near-black `#0D0D0D`.
- Extra border/fill neutrals, faded skeleton fills, translucent composer
  shadow, and colored template accents in reachable 404/error screens were
  removed or mapped to those tokens. Shared UI HSL aliases retain exact
  palette equivalents; there is no new dark theme or palette.
- The optional no-preference loading gradient interpolates only between
  approved palette tokens; reduced motion uses a flat token fill.
- Unused template components and the separate mockup sandbox were not
  refactored to satisfy detector warnings.

### 5. External fonts — resolved

- `src/fonts.css` serves four local files: DM Sans variable (existing
  400–700 weights), IBM Plex Mono normal 400/500, Instrument Serif normal
  400. The unused external italic request was not retained.
- Font roles and fallback stacks remain; each face uses `font-display: swap`.
  Relative CSS asset URLs are processed by Vite against the artifact base
  path and emitted as fingerprinted local URLs in the production build.
- The official Google Fonts distribution provided the unmodified Latin WOFF2
  files. Official repository OFL 1.1 notices were checked before download;
  embedding/redistribution is permitted with notices. Full notices ship in
  `public/fonts/licenses/` and were verified in the production output.
  Provenance is recorded in `src/assets/fonts/README.md`.
- The four WOFF2 files total approximately **87.5kB**. Browser network
  inspection confirmed all four loaded locally and **zero Google Fonts
  or Google font-CDN requests**. Built CSS also contains no external font URL.
- No new dependency was installed. Uncovered scripts use system fallbacks.

## Functional Verification

- Amazon sample selection populated the exact prompt without an API request.
- Submit produced loading and a labeled fixture answer with source IDs,
  warnings, run metadata, and evidence cards.
- Copy produced the research brief and “Copied” feedback using a clipboard
  stub; Print invoked `window.print` once using a stub.
- Evaluation details toggled and retained unavailable-score semantics.
- Netflix produced insufficient evidence with no source records.
- Upstream-error fixture preserved the question, sample label, run reference,
  and retry; retry sent one request with the same question and a new ID.
- Blocked fixture withheld answer text and the copy action while retaining
  print. Research/Disclaimers navigation and return preserved workspace state.

## Detector Results

- Rendered scans: `/` and `/disclaimers` at 390x844, and a final scan at
  320x844 after the targeted fixes. No contrast finding remained.
- The final 320px scan reported one kicker/eyebrow heuristic and one paragraph
  straggler advisory. The 390px scan reported the same kicker heuristic,
  one unbalanced-heading advisory, and three paragraph-straggler advisories.
- Source scan of the changed research styles and reachable UI reported three
  pre-existing side-border heuristics on status banners, not new technical
  defects. No palette/contrast failure was identified by these scans.
- Those preserved identity details are not scored as functional failures.
  Factual copy and the incumbent visual identity were intentionally retained;
  detector success is not being presented as accessibility certification.

## Checks Run

- **Passed:** `pnpm run typecheck` (workspace libraries and all leaf apps).
- **Passed:** `PORT=20114 BASE_PATH=/ pnpm --filter @workspace/globaledge-brokerage run build`
  (rerun after the final CSS corrections).
- **Passed:** `git diff --check`.
- Managed web workflow restarted once; Vite served successfully and startup
  logs showed no runtime errors. Follow-up CSS fixes were loaded through HMR.
- Screenshots inspected the research route at 390px and Disclaimers at 320px.
- One focused interactive browser pass, followed only by confirmation of the
  three fixes it identified; no second general browser pass.

## Remaining Limitations and Recommended Actions

- This is not a full WCAG certification. A real screen-reader session,
  physical-device testing, alternate browser engines, native browser zoom,
  real clipboard permissions, and an actual print dialog/PDF were not tested.
- Browser checks used supplied demonstration fixtures, not a real external
  workflow or historical corpus; no live-research validation is claimed.
- The build succeeds but still emits the existing tooltip sourcemap-location
  warning. No dependency upgrade or unrelated template refactor was attempted.
- Detailed transient evidence is in
  `generated-artifacts/globaledge-audit/browser-verification.md` and the
  detector JSON files alongside it. Those generated files are intentionally
  excluded from Git and publishing; this audit preserves the findings.
- Recommended non-blocking follow-ons: retain automated layout/motion
  regression checks and perform a screen-reader evidence-review session.
  No further visual redesign is recommended by this fix verification.
