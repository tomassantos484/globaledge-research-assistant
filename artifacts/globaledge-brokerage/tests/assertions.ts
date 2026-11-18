import { expect, type Page } from "@playwright/test";

export async function expectNoOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    viewport: innerWidth,
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(sizes.scroll, JSON.stringify(sizes)).toBeLessThanOrEqual(sizes.client);
  expect(sizes.body, JSON.stringify(sizes)).toBeLessThanOrEqual(sizes.client);
}

export async function classicScrollbar(page: Page) {
  // Stable real Chromium layout gutter, not padding or a smaller viewport pretending to be one.
  await page.addStyleTag({ content: `
    html { overflow-y: scroll !important; scrollbar-gutter: stable !important; }
    ::-webkit-scrollbar { width: 15px !important; }
  ` });
  const gutter = await page.evaluate(() => innerWidth - document.documentElement.clientWidth);
  expect(gutter, "Classic scrollbar coverage must reserve a real 15px layout gutter").toBe(15);
}

const functional = [
  ".page-nav-link", ".intro-copy", ".runtime-compact", ".composer-label",
  "#research-question", ".composer-hint", ".character-count", ".ge-button",
  ".shortcut-note", ".ge-shortcut", ".quiet-action", ".elapsed", ".loading-question",
  ".result-status-copy p", ".answer-body", ".warnings-box li",
  ".footer-meta", ".run-reference code", ".guardrail-list", ".quality-toggle strong",
  ".quality-content", ".source-card h3", ".source-meta", ".source-details dd",
  ".source-card blockquote", ".missing-meta", ".source-url", ".sources-heading-row > p",
  ".disclaimer-intro > p:not(.ge-kicker)", ".scope-notice p", ".disclaimer-card p", ".disclaimer-footnote",
  ".footer-disclaimer-link",
].join(",");

export async function expectReadableText(page: Page) {
  // Hover/enabled-state transitions briefly interpolate colors; inspect the settled state.
  await expect(async () => {
  const failures = await page.evaluate((functionalSelector) => {
    const failures: string[] = [];
    const rgb = (value: string) => {
      const parts = value.match(/[\d.]+/g)?.map(Number);
      if (!parts || !value.startsWith("rgb")) throw new Error(`Unsupported color: ${value}`);
      return [parts[0], parts[1], parts[2], parts[3] ?? 1];
    };
    const luminance = (color: number[]) => {
      const linear = color.slice(0, 3).map((n) => {
        const c = n / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const background = (element: Element): number[] => {
      const layers: number[][] = [];
      let current: Element | null = element;
      while (current) {
        const color = rgb(getComputedStyle(current).backgroundColor);
        layers.push(color);
        if (color[3] === 1) break;
        current = current.parentElement;
      }
      return layers.reverse().reduce((back, front) =>
        front.slice(0, 3).map((c, i) => c * front[3] + back[i] * (1 - front[3])),
      [255, 255, 255]);
    };
    for (const element of document.querySelectorAll<HTMLElement>(".ge-shell *")) {
      if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      const hasText = [...element.childNodes].some((node) =>
        node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
      const isInput = element instanceof HTMLTextAreaElement;
      if (!hasText && !isInput) continue;
      const style = getComputedStyle(element);
      const label = `${element.tagName.toLowerCase()}.${element.className}: ${element.textContent?.trim().slice(0, 70)}`;
      const fontSize = parseFloat(style.fontSize);
      const minimum = element.closest(functionalSelector) ? 14 : 12;
      if (fontSize < minimum) failures.push(`${label} — ${fontSize}px < ${minimum}px`);
      // Fail closed on faded ancestors: opacity changes effective contrast.
      for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
        if (Number(getComputedStyle(ancestor).opacity) !== 1) {
          failures.push(`${label} — faded text ancestor`);
          break;
        }
      }
      const checkContrast = (color: string, opacity = "1") => {
        const foreground = rgb(color);
        const back = background(element);
        const alpha = foreground[3] * Number(opacity);
        const effective = foreground.slice(0, 3).map((c, i) => c * alpha + back[i] * (1 - alpha));
        const a = luminance(effective);
        const b = luminance(back);
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        const large = fontSize >= 24 || (fontSize >= 18.66 && Number(style.fontWeight) >= 700);
        if (ratio < (large ? 3 : 4.5)) failures.push(`${label} — contrast ${ratio.toFixed(2)}:1`);
      };
      checkContrast(style.color);
      if (isInput && !element.value) {
        const placeholder = getComputedStyle(element, "::placeholder");
        checkContrast(placeholder.color, placeholder.opacity);
      }
      if (element.scrollWidth > element.clientWidth + 1 && element.clientWidth > 0) {
        failures.push(`${label} — clipped/overflowing text`);
      }
    }
    return failures;
  }, functional);
  expect(failures, "Rendered text size, contrast, opacity, and clipping").toEqual([]);
  }).toPass({ timeout: 2500 });
}

export async function expectStaticLoading(page: Page) {
  await expect(page.locator(".spin")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".ge-skeleton")).toHaveCount(4);
  for (const skeleton of await page.locator(".ge-skeleton").all()) {
    await expect(skeleton).toHaveCSS("animation-name", "none");
    await expect(skeleton).toHaveCSS("background-image", "none");
    await expect(skeleton).toHaveCSS("background-color", "rgb(151, 164, 175)");
  }
  await expect(page.getByTestId("button-submit-question")).toHaveCSS("transition-duration", "0s");
}
