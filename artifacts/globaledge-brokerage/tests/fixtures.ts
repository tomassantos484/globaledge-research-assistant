import { test as base, expect, type Page } from "@playwright/test";
import type { ResearchQuestion, ResearchResult, ResearchRuntimeStatus } from "@workspace/api-client-react";

export const QUESTION = "TEST FIXTURE ONLY: summarize the synthetic historical evidence.";
export const SOURCE_ID = "TEST-FIXTURE-FILING-001";

const runtime: ResearchRuntimeStatus = {
  dataMode: "fixture",
  researchWebhookConfigured: false,
  connectionTestConfigured: false,
  researchReachability: "not_configured",
  questionMaxLength: 2000,
};

// Synthetic interface stress data, never actual company research or evaluator results.
function answer(request: ResearchQuestion): ResearchResult {
  return {
    schemaVersion: "1",
    mode: "fixture",
    requestId: request.requestId!,
    runId: `TEST-FIXTURE-${"long-run-reference-".repeat(5)}`,
    question: request.question,
    status: "completed",
    answer: `TEST FIXTURE ONLY — synthetic historical evidence for layout verification. [${SOURCE_ID}]`,
    sources: [{
      id: SOURCE_ID,
      kind: "filing",
      title: "TEST FIXTURE ONLY — synthetic historical filing",
      documentName: `TEST-FIXTURE-${"long-document-name-".repeat(6)}.pdf`,
      publisher: "Synthetic test publisher",
      url: "https://example.invalid/test-fixture-only",
      date: "2020-01-01",
      dateMeaning: "Synthetic reference date",
      page: 12,
      recordId: `TEST-FIXTURE-${"record-".repeat(12)}`,
      excerpt: "TEST FIXTURE ONLY. No factual company claims are made by this record.",
      usage: "cited",
    }],
    warnings: ["TEST FIXTURE ONLY — interface demonstration, not actual company research."],
    referencePeriod: "Synthetic historical reference period, January 2020",
    evaluation: {
      status: "complete",
      groundedness: {
        value: 1, scaleMin: 0, scaleMax: 1,
        method: "TEST FIXTURE ONLY",
        explanation: "Synthetic metric used only to exercise evaluation text layout.",
      },
      answerRelevance: null,
      contextPrecision: null,
      overall: null,
      verdict: "TEST FIXTURE ONLY",
      judgeModel: null,
      rubricVersion: null,
    },
    guardrails: { input: "passed", output: "passed", safeMessage: null },
    backendElapsedMs: 123,
    evaluationStorageStatus: "not_implemented",
    error: null,
  };
}

type ResearchFixture = {
  pause: boolean;
  release: () => void;
  requests: ResearchQuestion[];
};

export const test = base.extend<{ research: ResearchFixture }>({
  research: [async ({ page }, use) => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const research: ResearchFixture = { pause: false, release, requests: [] };
    // Nothing under /api can fall through to a real service.
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/api/status") {
        await route.fulfill({ json: runtime });
      } else if (path === "/api/ask" && route.request().method() === "POST") {
        const request = route.request().postDataJSON() as ResearchQuestion;
        research.requests.push(request);
        if (research.pause) await gate;
        await route.fulfill({ json: answer(request) });
      } else {
        throw new Error(`Unexpected API request in isolated regression suite: ${path}`);
      }
    });
    await use(research);
    release();
  }, { auto: true }],
});

export { expect };

export async function submitFixture(page: Page) {
  await expect(page.getByTestId("status-runtime")).toHaveText("Sample mode");
  await page.getByTestId("input-research-question").fill(QUESTION);
  await page.getByTestId("button-submit-question").click();
}

export async function expectAnswer(page: Page) {
  await expect(page.getByTestId("state-answered")).toBeVisible();
  await expect(page.getByTestId("state-answered")).toContainText("SAMPLE RESPONSE");
  await expect(page.getByTestId("text-answer")).toContainText("TEST FIXTURE ONLY");
}
