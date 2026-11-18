# Readability, responsive layout, local fonts, and motion regressions

From the repository root:

```sh
pnpm --filter @workspace/globaledge-brokerage run test:regression
```

This command builds the current production frontend, starts a temporary preview
server on port **4179**, runs Chromium assertions, and stops that server. No API
server, webhook, credentials, database, or manual audit is required. Leave 4179
free; an existing server is intentionally not reused.

## Setup

Run `pnpm install` in a fresh checkout. Replit's Nix Chromium is detected
automatically. On other machines, install the matching Playwright Chromium once:

```sh
pnpm --filter @workspace/globaledge-brokerage exec playwright install chromium
```

Alternatively set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to a compatible Chromium
executable. Playwright browser system dependencies must be available on your
machine. To type-check the test harness and its fixtures:

```sh
pnpm --filter @workspace/globaledge-brokerage run test:regression:types
```

## Coverage and pass criteria

- Research and Disclaimers at **320, 390, 768, and 1280 CSS px**, with default
  scrollbars and a forced **15px classic scrollbar gutter**. The harness removes
  Playwright's `--hide-scrollbars` default, and fails if the classic test does not
  actually reduce `documentElement.clientWidth` by 15px. At 320px this means
  **305px usable content width**. Document/body scroll widths must fit.
- Empty research, placeholder, disabled submit, selected shortcut, populated
  answer, expanded evaluation details, selected source, hovered action, and
  Disclaimers text. Long synthetic document/run/record identifiers stress wrapping.
- Visible direct text has at least **12px** type; functional prose, inputs,
  actions, help, counters, source values, warnings, and evaluation details have
  at least **14px** type. Compact kickers, mode captions, IDs, and definition terms
  retain the approved 12px floor. Text is checked for clipping and opaque ancestors.
- Computed text/background contrast is at least **4.5:1** (or **3:1** for large
  text), including the empty placeholder and print-media text on both routes.
  Assertions wait briefly for normal hover/enabled-state color transitions to
  settle, not for animations to be disabled globally.
- All **four local WOFF2 faces** are requested and loaded from production
  fingerprinted asset paths; all use `font-display: swap`. External requests fail
  the font test, including external stylesheet requests that might load a font.
- Fresh reduced-motion loading and toggling preferences during a held request:
  spinner animation is `none`, all four skeletons are static blue-gray without a
  gradient, submit transitions stop, disabled controls and elapsed time remain
  functional, and releasing the request still shows completion.
- Keyboard citations focus/select the actual source article and call
  `scrollIntoView` with `instant` under reduced motion and `smooth` otherwise.
  Preferences change without a reload; source focus must use `preventScroll`.
- A **negative self-check** weakens the real built reduced-motion spinner selector
  from `.ge-shell .spin` to `.spin` in browser memory. It verifies the later
  `.spin` rule wins and the static-loading assertion rejects it. Source files
  are never modified by this self-check.

## Isolation and fixture labels

`fixtures.ts` intercepts **every `/api/**` request** before navigation. It answers
only `/api/status` and `/api/ask`; any unexpected API request fails rather than
reaching a real backend. Request IDs echo the actual submitted request.
Synthetic records, questions, warnings, and evaluator data explicitly say
**TEST FIXTURE ONLY**, and the response uses the existing `mode: "fixture"` so
the product's **SAMPLE RESPONSE / Separate from live research** label is checked.
No fixture hook or test mode is added to the application or research contract.

## Failure evidence

Failures return a nonzero exit status and list the element/measurement involved.
Screenshots and traces are saved under the root's ignored
`generated-artifacts/globaledge-regression/` directory. Open a trace with:

```sh
pnpm --filter @workspace/globaledge-brokerage exec playwright show-trace /absolute/path/to/trace.zip
```

This is a targeted Chromium regression suite, not screen-reader certification,
native-browser-zoom verification, cross-browser/physical-device certification,
or validation of real research content. Contrast checks cover the application's
opaque text surfaces, not arbitrary images, generated pseudo-content, or gradients
behind text. No screenshot goldens need updating to approve a regression.
