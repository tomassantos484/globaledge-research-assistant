import {
  AskGlobalEdgeResponse,
  type ResearchQuestion,
  type ResearchResult,
  type ResearchSource,
} from "@workspace/api-zod";

export const SAMPLE_DATA_LABEL = "Sample data - interface demonstration only.";

const QUESTION_MAX_LENGTH = 2_000;
const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_TIMEOUT_MS = 60_000;
const AUTH_HEADER_NAME_PATTERN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const JSON_CONTENT_TYPE_PATTERN =
  /^application\/(?:[a-z0-9.+-]+\+)?json(?:\s*;|$)/i;

export class ResearchServiceError extends Error {
  constructor(
    readonly code: string,
    readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = "ResearchServiceError";
  }
}

export function getDataMode(): "fixture" | "live" {
  const mode = process.env.APP_DATA_MODE?.trim() || "fixture";
  if (mode !== "fixture" && mode !== "live") {
    throw new Error("APP_DATA_MODE must be either fixture or live.");
  }
  return mode;
}

export function getQuestionMaxLength(): number {
  const raw = process.env.QUESTION_MAX_LENGTH?.trim() || "2000";
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > QUESTION_MAX_LENGTH) {
    throw new Error("QUESTION_MAX_LENGTH must be an integer from 1 to 2000.");
  }
  return value;
}

export function getResearchRuntimeStatus() {
  const hasAuth = Boolean(process.env.N8N_AUTH_HEADER_VALUE?.trim());
  const researchWebhookConfigured = Boolean(
    process.env.N8N_WEBHOOK_URL?.trim() && hasAuth,
  );
  const connectionTestConfigured = Boolean(
    process.env.N8N_CONNECTION_TEST_URL?.trim() && hasAuth,
  );

  return {
    dataMode: getDataMode(),
    researchWebhookConfigured,
    connectionTestConfigured,
    questionMaxLength: getQuestionMaxLength(),
    researchReachability: researchWebhookConfigured
      ? ("configured_not_verified" as const)
      : ("not_configured" as const),
  };
}

export async function askResearch(
  request: ResearchQuestion,
): Promise<ResearchResult> {
  const mode = getDataMode();
  if (mode === "fixture") {
    return buildFixtureResult(request);
  }

  return askLiveResearch(request);
}

async function askLiveResearch(
  request: ResearchQuestion,
): Promise<ResearchResult> {
  const config = getResearchConfig();
  const startedAt = Date.now();
  let response: Response;

  try {
    response = await fetch(config.url, {
      method: "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(config.timeoutMs),
      headers: {
        "content-type": "application/json",
        [config.authHeaderName]: config.authHeaderValue,
      },
      body: JSON.stringify({
        question: request.question,
        requestId: request.requestId,
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ResearchServiceError(
        "UPSTREAM_TIMEOUT",
        504,
        "The research workflow did not respond before the configured timeout.",
      );
    }
    throw new ResearchServiceError(
      "UPSTREAM_NETWORK_ERROR",
      502,
      "The configured research workflow could not be reached.",
    );
  }

  if (response.status >= 300 && response.status < 400) {
    throw new ResearchServiceError(
      "UPSTREAM_REDIRECT_BLOCKED",
      502,
      "The research workflow redirected the request; redirects are not followed.",
    );
  }
  if (response.status === 401 || response.status === 403) {
    throw new ResearchServiceError(
      "UPSTREAM_AUTH_FAILED",
      502,
      "The configured research workflow rejected its authentication.",
    );
  }
  if (response.status === 404 || response.status === 405) {
    throw new ResearchServiceError(
      "N8N_WEBHOOK_NOT_REGISTERED",
      502,
      "The research webhook was not found or is not active.",
    );
  }
  if (!response.ok) {
    throw new ResearchServiceError(
      "UPSTREAM_HTTP_ERROR",
      502,
      `The research workflow returned HTTP ${response.status}.`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!JSON_CONTENT_TYPE_PATTERN.test(contentType)) {
    throw new ResearchServiceError(
      "UPSTREAM_NON_JSON_RESPONSE",
      502,
      "The research workflow returned a non-JSON response.",
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ResearchServiceError(
      "UPSTREAM_INVALID_JSON",
      502,
      "The research workflow returned invalid JSON.",
    );
  }

  return normalizeN8nResearchResponse(payload, request, Date.now() - startedAt);
}

function getResearchConfig() {
  const urlValue = process.env.N8N_WEBHOOK_URL?.trim();
  const authHeaderName =
    process.env.N8N_AUTH_HEADER_NAME?.trim() || "X-GlobalEdge-Key";
  const authHeaderValue = process.env.N8N_AUTH_HEADER_VALUE;

  if (!urlValue || !authHeaderValue?.trim()) {
    throw new ResearchServiceError(
      "MISSING_CONFIGURATION",
      503,
      "Live research is not configured. Add the research webhook URL and server-side authentication value.",
    );
  }
  if (!AUTH_HEADER_NAME_PATTERN.test(authHeaderName)) {
    throw new ResearchServiceError(
      "INVALID_CONFIGURATION",
      503,
      "The configured authentication header name is invalid.",
    );
  }
  if (/[\r\n]/.test(authHeaderValue)) {
    throw new ResearchServiceError(
      "INVALID_CONFIGURATION",
      503,
      "The configured authentication header value is invalid.",
    );
  }

  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    throw new ResearchServiceError(
      "INVALID_CONFIGURATION",
      503,
      "The configured research webhook URL is invalid.",
    );
  }
  const isLocalHttp =
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !isLocalHttp) ||
    url.username ||
    url.password
  ) {
    throw new ResearchServiceError(
      "INVALID_CONFIGURATION",
      503,
      "The research webhook must use HTTPS and must not include URL credentials.",
    );
  }

  const timeoutMs = Number(process.env.N8N_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1_000 ||
    timeoutMs > MAX_TIMEOUT_MS
  ) {
    throw new ResearchServiceError(
      "INVALID_CONFIGURATION",
      503,
      "N8N_TIMEOUT_MS must be an integer from 1000 to 60000.",
    );
  }

  return {
    url: url.toString(),
    authHeaderName,
    authHeaderValue,
    timeoutMs,
  };
}

export function normalizeN8nResearchResponse(
  payload: unknown,
  request: ResearchQuestion,
  backendElapsedMs: number | null,
): ResearchResult {
  if (!isRecord(payload)) {
    throw invalidUpstreamResponse(
      "The workflow response must be a JSON object.",
    );
  }
  if (
    payload.mode === "connection_test" ||
    payload.status === "connection_ok"
  ) {
    throw invalidUpstreamResponse(
      "A connection-test acknowledgment cannot be used as a research result.",
    );
  }
  if (
    payload.requestId !== undefined &&
    payload.requestId !== request.requestId
  ) {
    throw invalidUpstreamResponse(
      "The workflow response request ID did not match the submitted question.",
    );
  }

  const reportedStatus = payload.status;
  if (
    reportedStatus !== "completed" &&
    reportedStatus !== "insufficient_evidence" &&
    reportedStatus !== "blocked" &&
    reportedStatus !== "error"
  ) {
    throw invalidUpstreamResponse(
      "The workflow must return an explicit supported research status.",
    );
  }

  const rawAnswer = payload.answer;
  if (
    reportedStatus === "completed" &&
    (typeof rawAnswer !== "string" || !rawAnswer.trim())
  ) {
    throw invalidUpstreamResponse(
      "A completed workflow response must include a non-empty answer field.",
    );
  }
  if (
    rawAnswer !== undefined &&
    rawAnswer !== null &&
    typeof rawAnswer !== "string"
  ) {
    throw invalidUpstreamResponse(
      "The workflow answer field must be a string or null.",
    );
  }

  const warnings = readStringArray(payload.warnings, "warnings");
  const sources = readSources(payload.sources);
  if (!Array.isArray(payload.sources)) {
    warnings.push("The workflow did not return structured source details.");
  }
  if (
    Array.isArray(payload.sources) &&
    payload.sources.some(
      (source) =>
        isRecord(source) &&
        typeof source.url === "string" &&
        !isSafeHttpUrl(source.url),
    )
  ) {
    warnings.push(
      "A source link was omitted because it did not use an HTTP or HTTPS URL.",
    );
  }
  warnings.push(
    "Evaluation is unavailable; the connected workflow has no implemented evaluator.",
  );

  const rawGuardrails = isRecord(payload.guardrails) ? payload.guardrails : {};
  const inputGuardrail = readGuardrail(rawGuardrails.input);
  const outputGuardrail = readGuardrail(rawGuardrails.output);
  const isBlocked =
    reportedStatus === "blocked" ||
    inputGuardrail === "blocked" ||
    outputGuardrail === "blocked";
  const status = isBlocked ? "blocked" : reportedStatus;
  const safeMessage =
    typeof rawGuardrails.safeMessage === "string"
      ? rawGuardrails.safeMessage
      : isBlocked
        ? "The workflow blocked this request. No generated answer is shown."
        : null;
  const normalizedError =
    status === "error" ? readResearchError(payload.error) : null;

  const normalized: ResearchResult = {
    schemaVersion: "1",
    mode: "live",
    requestId: request.requestId,
    runId: readNullableString(payload.runId, "runId"),
    question: request.question,
    status,
    // Never carry blocked model text across the server boundary.
    answer:
      status === "blocked" || status === "error"
        ? null
        : ((rawAnswer as string | null | undefined) ?? null),
    sources,
    warnings,
    referencePeriod: readNullableString(
      payload.referencePeriod,
      "referencePeriod",
    ),
    evaluation: {
      status: "unavailable",
      groundedness: null,
      answerRelevance: null,
      contextPrecision: null,
      overall: null,
      verdict: null,
      judgeModel: null,
      rubricVersion: null,
    },
    guardrails: {
      input: inputGuardrail,
      output: outputGuardrail,
      safeMessage,
    },
    backendElapsedMs,
    evaluationStorageStatus: "not_implemented",
    error: normalizedError,
  };

  try {
    return AskGlobalEdgeResponse.parse(normalized) as ResearchResult;
  } catch {
    throw invalidUpstreamResponse(
      "The workflow response could not be normalized to the research contract.",
    );
  }
}

function readResearchError(value: unknown): ResearchResult["error"] {
  if (!isRecord(value)) {
    throw invalidUpstreamResponse(
      "An error workflow response must include a structured error.",
    );
  }
  if (
    typeof value.code !== "string" ||
    typeof value.safeMessage !== "string" ||
    typeof value.retryable !== "boolean"
  ) {
    throw invalidUpstreamResponse("The workflow error fields are invalid.");
  }
  return {
    code: value.code,
    safeMessage: value.safeMessage,
    retryable: value.retryable,
  };
}

function readSources(value: unknown): ResearchSource[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw invalidUpstreamResponse(
      "The workflow sources field must be an array.",
    );
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw invalidUpstreamResponse(`Workflow source ${index + 1} is invalid.`);
    }
    const id = item.id;
    const kind = item.kind;
    if (typeof id !== "string" || !id.trim()) {
      throw invalidUpstreamResponse(
        `Workflow source ${index + 1} has no stable source ID.`,
      );
    }
    if (kind !== "filing" && kind !== "news" && kind !== "price") {
      throw invalidUpstreamResponse(
        `Workflow source ${index + 1} has an unsupported source type.`,
      );
    }

    const rawUrl = readNullableString(item.url, "source.url");
    const safeUrl = rawUrl && isSafeHttpUrl(rawUrl) ? rawUrl : null;
    const page = item.page;
    if (page !== undefined && page !== null && !Number.isInteger(page)) {
      throw invalidUpstreamResponse(
        `Workflow source ${index + 1} has an invalid page value.`,
      );
    }

    return {
      id,
      kind,
      title: readNullableString(item.title, "source.title"),
      documentName: readNullableString(
        item.documentName,
        "source.documentName",
      ),
      publisher: readNullableString(item.publisher, "source.publisher"),
      url: safeUrl,
      date: readNullableString(item.date, "source.date"),
      dateMeaning: readNullableString(item.dateMeaning, "source.dateMeaning"),
      page: (page as number | null | undefined) ?? null,
      recordId: readNullableString(item.recordId, "source.recordId"),
      excerpt: readNullableString(item.excerpt, "source.excerpt"),
      usage:
        item.usage === "cited" ||
        item.usage === "retrieved" ||
        item.usage === "unknown"
          ? item.usage
          : "unknown",
    };
  });
}

function readStringArray(value: unknown, fieldName: string): string[] {
  if (value === undefined || value === null) return [];
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    throw invalidUpstreamResponse(
      `The workflow ${fieldName} field is invalid.`,
    );
  }
  return [...value];
}

function readNullableString(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw invalidUpstreamResponse(
      `The workflow ${fieldName} field is invalid.`,
    );
  }
  return value;
}

function readGuardrail(value: unknown): "passed" | "blocked" | "not_reported" {
  if (value === undefined || value === null || value === "not_reported") {
    return "not_reported";
  }
  if (value === "passed" || value === "blocked") return value;
  throw invalidUpstreamResponse("The workflow guardrail status is invalid.");
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidUpstreamResponse(message: string): ResearchServiceError {
  return new ResearchServiceError("UPSTREAM_INVALID_RESPONSE", 502, message);
}

function buildFixtureResult(request: ResearchQuestion): ResearchResult {
  const question = request.question;
  const normalizedQuestion = question.trim().toLowerCase();
  if (normalizedQuestion.includes("demo scenario: show an upstream error")) {
    throw new ResearchServiceError(
      "FIXTURE_UPSTREAM_ERROR",
      502,
      "Sample data - interface demonstration only. This fixture simulates an upstream workflow failure.",
    );
  }
  if (normalizedQuestion.includes("demo scenario: show a malformed response")) {
    throw invalidUpstreamResponse(
      "Sample data - interface demonstration only. This fixture simulates a malformed workflow response.",
    );
  }
  if (normalizedQuestion.includes("demo scenario: show a blocked answer")) {
    return makeFixture(request, "blocked");
  }
  if (
    normalizedQuestion.includes("demo scenario: show insufficient evidence") ||
    normalizedQuestion.includes("netflix")
  ) {
    return makeFixture(request, "insufficient_evidence");
  }
  return makeFixture(request, "completed");
}

function makeFixture(
  request: ResearchQuestion,
  status: "completed" | "insufficient_evidence" | "blocked",
): ResearchResult {
  const warnings = [
    SAMPLE_DATA_LABEL,
    "No actual filing, news article, or historical price dataset was supplied to this build.",
  ];
  const common = {
    schemaVersion: "1" as const,
    mode: "fixture" as const,
    requestId: request.requestId,
    runId: `fixture-${request.requestId}`,
    question: request.question,
    warnings,
    referencePeriod: null,
    evaluation: {
      status: "unavailable" as const,
      groundedness: null,
      answerRelevance: null,
      contextPrecision: null,
      overall: null,
      verdict: null,
      judgeModel: null,
      rubricVersion: null,
    },
    guardrails: {
      input: "not_reported" as const,
      output: "not_reported" as const,
      safeMessage: null,
    },
    backendElapsedMs: null,
    evaluationStorageStatus: "not_implemented" as const,
    error: null,
  };

  if (status === "blocked") {
    return {
      ...common,
      status,
      answer: null,
      sources: [],
      warnings: [
        ...warnings,
        "This is a blocked-state interface fixture, not a live guardrail decision.",
      ],
      guardrails: {
        input: "blocked",
        output: "not_reported",
        safeMessage:
          "Sample blocked-state demonstration. No generated answer is shown.",
      },
    };
  }

  if (status === "insufficient_evidence") {
    return {
      ...common,
      status,
      answer: null,
      sources: [],
      warnings: [
        ...warnings,
        "This fixture contains no verified company-specific sources. The live corpus may differ.",
      ],
    };
  }

  const sources: ResearchSource[] = [
    {
      id: "F1",
      kind: "filing",
      title: "Sample filing source",
      documentName: "Synthetic filing excerpt",
      publisher: null,
      url: null,
      date: null,
      dateMeaning: null,
      page: null,
      recordId: null,
      excerpt:
        "Synthetic placeholder excerpt. Replace with a verified filing chunk before live use.",
      usage: "cited",
    },
    {
      id: "N1",
      kind: "news",
      title: "Sample news source",
      documentName: null,
      publisher: null,
      url: null,
      date: null,
      dateMeaning: "Publication date unavailable",
      page: null,
      recordId: null,
      excerpt:
        "Synthetic placeholder news excerpt; no article or publisher was supplied.",
      usage: "cited",
    },
    {
      id: "P1",
      kind: "price",
      title: "Sample historical price row",
      documentName: null,
      publisher: null,
      url: null,
      date: null,
      dateMeaning: "Observation date unavailable",
      page: null,
      recordId: "sample-row-1",
      excerpt: "Synthetic placeholder; no date or numeric price was supplied.",
      usage: "cited",
    },
  ];

  return {
    ...common,
    status: "completed",
    answer:
      "Interface-only example: this synthetic response demonstrates inline source references [F1], [N1], and [P1]. It is not an assessment of the security, its current signal, financial condition, or an investment recommendation.",
    sources,
    warnings: [
      ...warnings,
      "Evaluation is unavailable; no judge or evaluation storage is implemented.",
    ],
  };
}
