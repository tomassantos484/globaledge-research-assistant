import { test, expect, submitFixture, expectAnswer, SOURCE_ID } from "./fixtures";
import { classicScrollbar, expectNoOverflow, expectReadableText, expectStaticLoading } from "./assertions";

for (const width of [320, 390, 768, 1280]) {
  for (const classic of [false, true]) {
    test(`${width}px / ${classic ? "classic 15px scrollbar" : "default scrollbar"} / both routes`, async ({ page, research }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      if (classic) await classicScrollbar(page);
      await page.evaluate(() => document.fonts.ready);
      await expectNoOverflow(page);
      await expectReadableText(page); // empty, disabled button, placeholder
      await page.getByTestId("button-shortcut-amazon").click();
      await expectReadableText(page); // selected shortcut
      await submitFixture(page);
      await expectAnswer(page);
      await page.getByTestId("button-quality-accordion").click();
      await expect(page.getByTestId("panel-quality")).toBeVisible();
      await expectNoOverflow(page);
      await expectReadableText(page);
      await page.getByTestId(`citation-${SOURCE_ID}`).focus();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId(`card-source-${SOURCE_ID}`)).toBeFocused();
      await expectReadableText(page); // selected source and inline citation
      await page.getByTestId("button-copy-answer").hover();
      await expectReadableText(page);
      await page.getByRole("navigation").getByRole("link", { name: "Disclaimers" }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Disclaimers & research scope");
      await expectNoOverflow(page);
      await expectReadableText(page);
      expect(research.requests).toHaveLength(1);
    });
  }
}

test("all four font faces load locally, with swap and no external font requests", async ({ page }) => {
  const fontRequests: string[] = [];
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "font") fontRequests.push(request.url());
    if (new URL(request.url()).origin !== "http://127.0.0.1:4179") externalRequests.push(request.url());
  });
  await page.goto("/");
  const faces = await page.evaluate(async () => {
    // Mono 500 isn't necessarily used in the empty state: request every declared face.
    await Promise.all([
      document.fonts.load('400 16px "DM Sans"'),
      document.fonts.load('400 16px "IBM Plex Mono"'),
      document.fonts.load('500 16px "IBM Plex Mono"'),
      document.fonts.load('400 16px "Instrument Serif"'),
    ]);
    await document.fonts.ready;
    return [...document.fonts].map((face) => ({
      family: face.family.replaceAll('"', ""), weight: face.weight, status: face.status, display: face.display,
    }));
  });
  expect(faces).toHaveLength(4);
  expect(faces.map((face) => `${face.family}:${face.weight}`).sort()).toEqual([
    "DM Sans:400 700", "IBM Plex Mono:400", "IBM Plex Mono:500", "Instrument Serif:400",
  ]);
  for (const face of faces) {
    expect(face.status).toBe("loaded");
    expect(face.display).toBe("swap");
  }
  expect(fontRequests).toHaveLength(4);
  for (const url of fontRequests) {
    expect(new URL(url).origin).toBe("http://127.0.0.1:4179");
    expect(new URL(url).pathname).toMatch(/^\/assets\/.+\.woff2$/);
  }
  expect(externalRequests, "Production page must not depend on any external font provider").toEqual([]);
});

for (const initial of ["reduce", "no-preference"] as const) {
  test(`loading respects ${initial} initially and preference changes without reload`, async ({ page, research }) => {
    research.pause = true;
    await page.emulateMedia({ reducedMotion: initial });
    await page.goto("/");
    await submitFixture(page);
    await expect(page.getByTestId("state-loading")).toBeVisible();
    await expect(page.getByTestId("input-research-question")).toBeDisabled();
    await expect(page.getByTestId("button-submit-question")).toBeDisabled();
    if (initial === "no-preference") {
      await expect(page.locator(".spin")).toHaveCSS("animation-name", "ge-spin");
      await page.emulateMedia({ reducedMotion: "reduce" });
    }
    // Computed assertion catches the actual cascade bug: a later .spin overriding @media.
    await expectStaticLoading(page);
    await expectReadableText(page);
    await expect(page.locator(".elapsed")).not.toHaveText("0s elapsed");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(page.locator(".spin")).toHaveCSS("animation-name", "ge-spin");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expectStaticLoading(page);
    research.release();
    await expectAnswer(page);
    await expect(page.getByTestId("button-submit-question")).toBeEnabled();
  });
}

test("keyboard citations honor the current motion preference and retain selected source focus", async ({ page }) => {
  await page.goto("/");
  await submitFixture(page);
  await expectAnswer(page);
  await page.evaluate(() => {
    const original = Element.prototype.scrollIntoView;
    const originalFocus = HTMLElement.prototype.focus;
    const calls: ScrollIntoViewOptions[] = [];
    const focusCalls: (FocusOptions | undefined)[] = [];
    Object.assign(window, { citationScrollCalls: calls, citationFocusCalls: focusCalls });
    Element.prototype.scrollIntoView = function (options) {
      if (this.id.startsWith("source-") && typeof options === "object") calls.push(options);
      original.call(this, options);
    };
    HTMLElement.prototype.focus = function (options) {
      if (this.id.startsWith("source-")) focusCalls.push(options);
      originalFocus.call(this, options);
    };
  });
  for (const preference of ["no-preference", "reduce", "no-preference"] as const) {
    await page.emulateMedia({ reducedMotion: preference });
    await page.getByTestId(`citation-${SOURCE_ID}`).focus();
    await page.keyboard.press("Enter");
    const source = page.getByTestId(`card-source-${SOURCE_ID}`);
    await expect(source).toBeFocused();
    await expect(source).toHaveClass(/source-card-selected/);
    await expect(source).toHaveAttribute("tabindex", "-1");
  }
  const calls = await page.evaluate(() =>
    (window as unknown as { citationScrollCalls: ScrollIntoViewOptions[] }).citationScrollCalls);
  expect(calls).toEqual([
    { behavior: "smooth", block: "center" },
    { behavior: "instant", block: "center" },
    { behavior: "smooth", block: "center" },
  ]);
  expect(await page.evaluate(() =>
    (window as unknown as { citationFocusCalls: FocusOptions[] }).citationFocusCalls,
  )).toEqual(Array(3).fill({ preventScroll: true }));
});

test("guard self-check: weakening the reduced-motion selector reproduces the later-spinner override", async ({ page, research }) => {
  research.pause = true;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await submitFixture(page);
  await expectStaticLoading(page);
  // Change only the selector specificity in the built stylesheet. The later
  // ordinary .spin rule must win exactly as it did in the original audit failure.
  const changed = await page.evaluate(() => {
    let changed = 0;
    const visit = (rules: CSSRuleList) => {
      for (const rule of rules) {
        if (rule instanceof CSSStyleRule && rule.selectorText.includes(".ge-shell .spin")) {
          rule.selectorText = rule.selectorText.replace(".ge-shell .spin", ".spin");
          changed++;
        }
        if ("cssRules" in rule) visit((rule as CSSGroupingRule).cssRules);
      }
    };
    for (const sheet of document.styleSheets) visit(sheet.cssRules);
    return changed;
  });
  expect(changed, "Self-check must mutate the real reduced-motion selector").toBe(1);
  await expect(page.locator(".spin")).toHaveCSS("animation-name", "ge-spin");
  await expect(expectStaticLoading(page)).rejects.toThrow(/ge-spin/);
  research.release();
  await expectAnswer(page);
});

test("print text stays readable on both routes", async ({ page }) => {
  await page.goto("/");
  await submitFixture(page);
  await expectAnswer(page);
  await page.emulateMedia({ media: "print" });
  await expectReadableText(page);
  await page.goto("/disclaimers");
  await expectReadableText(page);
});
