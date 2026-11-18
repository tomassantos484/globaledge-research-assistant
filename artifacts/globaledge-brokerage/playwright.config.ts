import { existsSync, readdirSync } from "node:fs";
import { defineConfig } from "@playwright/test";

// Replit supplies Chromium through Nix; elsewhere use Playwright's installed browser.
const nixBrowser = existsSync("/nix/store")
  ? readdirSync("/nix/store")
      .filter((name) => name.includes("-playwright-chromium-"))
      .map((name) => `/nix/store/${name}/chrome-linux/chrome`)
      .find(existsSync)
  : undefined;

export default defineConfig({
  testDir: "./tests",
  outputDir: "../../generated-artifacts/globaledge-regression",
  fullyParallel: true,
  workers: 2,
  retries: 0,
  timeout: 30_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4179",
    browserName: "chromium",
    viewport: { width: 1280, height: 800 },
    reducedMotion: "no-preference",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || nixBrowser,
      ignoreDefaultArgs: ["--hide-scrollbars"],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  // Deliberately do not reuse a running server: validate the current production CSS/fonts.
  webServer: {
    command: "PORT=4179 BASE_PATH=/ pnpm run build && PORT=4179 BASE_PATH=/ pnpm run serve --port 4179",
    url: "http://127.0.0.1:4179",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
