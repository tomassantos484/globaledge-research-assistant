---
name: Narrow-screen verification
description: Classic scrollbar gutters affect GlobalEdge's narrowest responsive acceptance checks.
---

Verify narrow layouts against the browser's available content width, including
classic scrollbars, rather than assuming a 320px viewport has 320px of content.

**Why:** A 320px Chromium viewport supplied only 305px after its vertical
scrollbar. A fixed 320px body minimum produced horizontal scrolling even though
the layout fit mobile browsers with overlay scrollbars.

**How to apply:** Include `document.documentElement.scrollWidth` versus
`clientWidth` in responsive checks on both routes and result states. Do not
reintroduce a body minimum matching the outer viewport acceptance width.

Playwright hides scrollbars by default, even when test CSS requests a stable
gutter. Remove its `--hide-scrollbars` launch default and assert the actual
viewport-minus-client-width difference before claiming classic-scrollbar coverage.

**Why:** Without that browser setting, a forced-scrollbar check can silently
exercise the full viewport width instead of the narrower available content area.
