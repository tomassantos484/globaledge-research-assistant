import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  FileText,
  Info,
  LoaderCircle,
  Newspaper,
  Printer,
  RotateCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Waves,
} from "lucide-react";
import "./_group.css";

type ResearchSource = {
  id: string;
  kind: "filing" | "news" | "price";
  title: string | null;
  documentName: string | null;
  publisher: string | null;
  url: string | null;
  date: string | null;
  dateMeaning: string | null;
  page: number | null;
  recordId: string | null;
  excerpt: string | null;
  usage: "cited" | "retrieved" | "unknown";
};
type Metric = {
  value: number | null;
  scaleMin: number | null;
  scaleMax: number | null;
  method: string | null;
  explanation: string | null;
};
type ResearchResult = {
  schemaVersion: "1";
  mode: "fixture" | "live";
  requestId: string;
  runId: string | null;
  question: string;
  status: "completed" | "insufficient_evidence" | "blocked" | "error";
  answer: string | null;
  sources: ResearchSource[];
  warnings: string[];
  referencePeriod: string | null;
  evaluation: {
    status: "complete" | "pending" | "unavailable" | "failed";
    groundedness: Metric | null;
    answerRelevance: Metric | null;
    contextPrecision: Metric | null;
    overall: Metric | null;
    verdict: string | null;
    judgeModel: string | null;
    rubricVersion: string | null;
  };
  guardrails: {
    input: "passed" | "blocked" | "not_reported";
    output: "passed" | "blocked" | "not_reported";
    safeMessage: string | null;
  };
  backendElapsedMs: number | null;
  evaluationStorageStatus: "saved" | "failed" | "not_implemented" | "unknown";
  error: { code: string; safeMessage: string; retryable: boolean } | null;
};

function useGetResearchRuntimeStatus() {
  return {
    isLoading: false,
    isError: false,
    data: {
      dataMode: "fixture" as const,
      researchWebhookConfigured: false,
      connectionTestConfigured: false,
      questionMaxLength: 2000,
      researchReachability: "not_configured" as
        "not_configured" | "configured_not_verified",
    },
  };
}
function useHealthCheck() {
  return { isLoading: false, isError: false };
}
function useAskGlobalEdge() {
  return {
    mutate: (
      input: { data: { question: string; requestId: string } },
      callbacks: {
        onSuccess: (result: ResearchResult) => void;
        onError: (error: unknown) => void;
      },
    ) => {
      window.setTimeout(
        () =>
          callbacks.onSuccess({
            schemaVersion: "1",
            mode: "fixture",
            requestId: input.data.requestId,
            runId: "preview-" + input.data.requestId,
            question: input.data.question,
            status: "completed",
            answer:
              "Sample data - interface demonstration only. This preview contains no verified research evidence.",
            sources: [],
            warnings: ["Sample data - interface demonstration only."],
            referencePeriod: null,
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
              input: "not_reported",
              output: "not_reported",
              safeMessage: null,
            },
            backendElapsedMs: null,
            evaluationStorageStatus: "not_implemented",
            error: null,
          }),
        350,
      );
    },
  };
}

const SHORTCUTS = [
  {
    label: "Amazon",
    prompt:
      "Based on this week's news sentiment around Amazon, would you classify the current signal as bullish or bearish, and does the price data support that?",
  },
  {
    label: "Apple",
    prompt:
      "Should I invest in Apple right now? I heard Tim Cook is stepping down - is that a red flag? How's the stock been doing, and is there anything I should be worried about with the company's financials or risks?",
  },
  {
    label: "Bitcoin",
    prompt:
      "Is now a good time to buy Bitcoin? News is saying it just crossed $78k - am I too late? What's the price trend looked like over the last few months, and what's driving the current rally?",
  },
  {
    label: "S&P 500",
    prompt:
      "J.P. Morgan is calling for the S&P 500 to hit 7,600 on AI earnings. Is that realistic? Should I buy in now or wait?",
  },
  {
    label: "Netflix",
    prompt:
      "How has Netflix stock performed this year compared to news sentiment?",
  },
];

const DEMO_SCENARIOS = [
  {
    label: "Sourced answer · no evaluation",
    prompt: "Demo scenario: show a sourced answer with missing evaluation",
  },
  {
    label: "Insufficient evidence",
    prompt: "Demo scenario: show insufficient evidence",
  },
  {
    label: "Blocked answer",
    prompt: "Demo scenario: show a blocked answer",
  },
  {
    label: "Upstream failure",
    prompt: "Demo scenario: show an upstream error",
  },
  {
    label: "Malformed response",
    prompt: "Demo scenario: show a malformed response",
  },
];

const FIXTURE_LABEL = "Sample data - interface demonstration only.";

type ViewState =
  | { kind: "empty" }
  | { kind: "loading"; startedAt: number; elapsed: number }
  | { kind: "answered"; result: ResearchResult }
  | { kind: "insufficient"; result: ResearchResult }
  | { kind: "blocked"; result: ResearchResult }
  | {
      kind: "failure";
      failure: "configuration" | "invalid" | "timeout" | "upstream";
      message: string;
      requestId: string | null;
      sample?: boolean;
    };

function isResearchResult(value: unknown): value is ResearchResult {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ResearchResult>;
  const nullableString = (field: unknown) =>
    field === null || typeof field === "string";
  const nullableNumber = (field: unknown) =>
    field === null || typeof field === "number";
  const validMetric = (metric: unknown) => {
    if (metric === null) return true;
    if (!metric || typeof metric !== "object") return false;
    const candidate = metric as ResearchResult["evaluation"]["overall"];
    if (candidate === null) return true;
    const validRange =
      candidate.value === null ||
      (typeof candidate.value === "number" &&
        typeof candidate.scaleMin === "number" &&
        typeof candidate.scaleMax === "number" &&
        candidate.scaleMin <= candidate.scaleMax &&
        candidate.value >= candidate.scaleMin &&
        candidate.value <= candidate.scaleMax);
    return (
      validRange &&
      nullableNumber(candidate.value) &&
      nullableNumber(candidate.scaleMin) &&
      nullableNumber(candidate.scaleMax) &&
      nullableString(candidate.method) &&
      nullableString(candidate.explanation)
    );
  };
  const sourceKind = ["filing", "news", "price"];
  const validSource = (source: unknown) => {
    if (!source || typeof source !== "object") return false;
    const candidate = source as ResearchSource;
    return (
      typeof candidate.id === "string" &&
      sourceKind.includes(candidate.kind) &&
      ["cited", "retrieved", "unknown"].includes(candidate.usage) &&
      nullableString(candidate.title) &&
      nullableString(candidate.documentName) &&
      nullableString(candidate.publisher) &&
      nullableString(candidate.url) &&
      nullableString(candidate.date) &&
      nullableString(candidate.dateMeaning) &&
      nullableNumber(candidate.page) &&
      nullableString(candidate.recordId) &&
      nullableString(candidate.excerpt)
    );
  };
  const evaluation = item.evaluation;
  const guardrails = item.guardrails;
  return (
    item.schemaVersion === "1" &&
    (item.mode === "fixture" || item.mode === "live") &&
    typeof item.requestId === "string" &&
    typeof item.question === "string" &&
    ["completed", "insufficient_evidence", "blocked", "error"].includes(
      String(item.status),
    ) &&
    nullableString(item.answer) &&
    nullableString(item.runId) &&
    nullableString(item.referencePeriod) &&
    nullableNumber(item.backendElapsedMs) &&
    Array.isArray(item.sources) &&
    item.sources.every(validSource) &&
    Array.isArray(item.warnings) &&
    item.warnings.every((warning) => typeof warning === "string") &&
    ["saved", "failed", "not_implemented", "unknown"].includes(
      String(item.evaluationStorageStatus),
    ) &&
    (item.error === null ||
      (!!item.error &&
        typeof item.error === "object" &&
        typeof item.error.code === "string" &&
        typeof item.error.safeMessage === "string" &&
        typeof item.error.retryable === "boolean")) &&
    !!evaluation &&
    ["complete", "pending", "unavailable", "failed"].includes(
      evaluation.status,
    ) &&
    validMetric(evaluation.groundedness) &&
    validMetric(evaluation.answerRelevance) &&
    validMetric(evaluation.contextPrecision) &&
    validMetric(evaluation.overall) &&
    nullableString(evaluation.verdict) &&
    nullableString(evaluation.judgeModel) &&
    nullableString(evaluation.rubricVersion) &&
    !!guardrails &&
    ["passed", "blocked", "not_reported"].includes(guardrails.input) &&
    ["passed", "blocked", "not_reported"].includes(guardrails.output) &&
    nullableString(guardrails.safeMessage)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getApiFailure(error: unknown) {
  const record = isRecord(error) ? error : {};
  const payload = isRecord(record.data) ? record.data : {};
  const code = typeof payload.code === "string" ? payload.code : "";
  const status = typeof record.status === "number" ? record.status : null;
  const payloadMessage =
    typeof payload.message === "string" ? payload.message : "";
  const rawMessage = typeof record.message === "string" ? record.message : "";
  const sample =
    code.startsWith("FIXTURE_") || payloadMessage.startsWith(FIXTURE_LABEL);

  let failure: "configuration" | "invalid" | "timeout" | "upstream" =
    "upstream";
  if (code === "MISSING_CONFIGURATION") failure = "configuration";
  else if (status === 504 || code === "UPSTREAM_TIMEOUT") failure = "timeout";
  else if (
    record.name === "ResponseParseError" ||
    code.includes("INVALID_RESPONSE") ||
    code.includes("INVALID_JSON") ||
    code.includes("NON_JSON") ||
    code.includes("REDIRECT_BLOCKED")
  )
    failure = "invalid";

  return {
    failure,
    sample,
    message:
      payloadMessage ||
      rawMessage ||
      "The research service could not be reached. Your question is preserved.",
  };
}

function safeExternalUrl(value: string | null) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

function sourceKindLabel(kind: ResearchSource["kind"]) {
  if (kind === "filing") return "SEC filing";
  if (kind === "news") return "News";
  return "Price record";
}

function CitationText({
  text,
  sources,
  onSelect,
}: {
  text: string;
  sources: ResearchSource[];
  onSelect: (id: string) => void;
}) {
  const sourceIds = useMemo(
    () => new Set(sources.map((source) => source.id)),
    [sources],
  );
  const parts = text.split(/(\[[^\]]{1,80}\])/g);
  return (
    <>
      {parts.map((part, index) => {
        const candidate = part.startsWith("[") ? part.slice(1, -1) : "";
        if (candidate && sourceIds.has(candidate)) {
          return (
            <button
              className="citation-link"
              data-testid={`citation-${candidate}`}
              key={`${candidate}-${index}`}
              onClick={() => onSelect(candidate)}
              type="button"
              aria-label={`View source ${candidate}`}
            >
              [{candidate}]
            </button>
          );
        }
        if (candidate) {
          return (
            <span
              className="citation-unavailable"
              key={`missing-${candidate}-${index}`}
            >
              <code>{part}</code>
              <span>Source details unavailable</span>
            </span>
          );
        }
        return <span key={`answer-fragment-${index}`}>{part}</span>;
      })}
    </>
  );
}

function RuntimePanel({
  verifiedLiveResponse,
}: {
  verifiedLiveResponse: boolean;
}) {
  const runtime = useGetResearchRuntimeStatus();
  const health = useHealthCheck();
  if (runtime.isLoading) {
    return (
      <div
        className="runtime-panel"
        data-testid="status-runtime-loading"
        aria-live="polite"
      >
        <span className="status-dot status-dot-pending" />
        <span>Checking research runtime…</span>
      </div>
    );
  }
  const status = runtime.data;
  const configured = status?.researchWebhookConfigured ?? false;
  const fixture = status?.dataMode === "fixture";
  const hasConfiguration = configured || fixture;
  const healthText = health.isLoading
    ? "Checking API"
    : health.isError
      ? "API status unavailable"
      : "API reachable";
  return (
    <div className="runtime-wrap">
      <div
        className="runtime-panel"
        data-testid="status-runtime"
        aria-live="polite"
      >
        <span
          className={`status-dot ${hasConfiguration && !runtime.isError ? "status-dot-ready" : "status-dot-pending"}`}
        />
        <span className="runtime-label">
          {runtime.isError
            ? "Research status unavailable"
            : fixture
              ? "Demo fixtures active"
              : configured
                ? "Research configured"
                : "Research not configured"}
        </span>
        <span className="runtime-divider" />
        <span>{healthText}</span>
        <span className="runtime-divider" />
        <span>
          {verifiedLiveResponse
            ? "Live research response received"
            : status?.researchReachability === "configured_not_verified"
              ? "Connection not verified"
              : status?.connectionTestConfigured
                ? "Reachability not verified"
                : "Connection test unavailable"}
        </span>
      </div>
      {runtime.isError && (
        <p className="runtime-note" data-testid="text-runtime-error">
          Runtime status could not be loaded. Live research availability is
          unknown.
        </p>
      )}
      {!runtime.isError && status && !hasConfiguration && (
        <p className="runtime-note" data-testid="text-missing-configuration">
          Research is unavailable because this runtime has no configured
          research transport.
        </p>
      )}
      {fixture && (
        <p
          className="runtime-note fixture-note"
          data-testid="text-fixture-mode"
        >
          Demo-state fixtures are active. Fixture responses are labeled
          separately from live responses; failed live calls never fall back to
          fixtures.
        </p>
      )}
    </div>
  );
}

function SourceCard({
  source,
  index,
  isSelected,
}: {
  source: ResearchSource;
  index: number;
  isSelected: boolean;
}) {
  const url = safeExternalUrl(source.url);
  const title =
    source.title ||
    source.documentName ||
    source.publisher ||
    "Untitled source";
  const absent: string[] = [];
  if (!source.title) absent.push("title");
  if (!source.publisher) absent.push("publisher");
  if (!source.date) absent.push("date");
  if (!source.url) absent.push("URL");
  return (
    <article
      className={`source-card ${isSelected ? "source-card-selected" : ""}`}
      id={`source-${source.id}`}
      data-testid={`card-source-${source.id}`}
      tabIndex={-1}
    >
      <div className="source-topline">
        <span className="source-kind">{sourceKindLabel(source.kind)}</span>
        <span className="source-index">
          EVIDENCE {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <h3>{title}</h3>
      <p className="source-id">
        Source ID <code>{source.id}</code>{" "}
        <span className="source-usage">{source.usage}</span>
      </p>
      {source.publisher && <p className="source-meta">{source.publisher}</p>}
      <dl className="source-details">
        <div>
          <dt>Date</dt>
          <dd>
            {source.date || "Not provided"}
            {source.dateMeaning ? ` · ${source.dateMeaning}` : ""}
          </dd>
        </div>
        {source.page !== null && (
          <div>
            <dt>Page</dt>
            <dd>{source.page}</dd>
          </div>
        )}
        {source.recordId && (
          <div>
            <dt>Record</dt>
            <dd>{source.recordId}</dd>
          </div>
        )}
        {source.documentName && (
          <div>
            <dt>Document</dt>
            <dd>{source.documentName}</dd>
          </div>
        )}
      </dl>
      {source.excerpt && <blockquote>{source.excerpt}</blockquote>}
      {absent.length > 0 && (
        <p className="missing-meta">
          <Info size={13} aria-hidden="true" /> Metadata not provided:{" "}
          {absent.join(", ")}.
        </p>
      )}
      {source.url &&
        (url ? (
          <a
            className="source-url"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open source <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        ) : (
          <p className="missing-meta">
            Source URL is present but is not a safe HTTP(S) link.
          </p>
        ))}
    </article>
  );
}

function ResearchWorkspace() {
  const [question, setQuestion] = useState("");
  const [selectedShortcut, setSelectedShortcut] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>({ kind: "empty" });
  const [qualityOpen, setQualityOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const runtime = useGetResearchRuntimeStatus();
  const ask = useAskGlobalEdge();
  const timerRef = useRef<number | null>(null);
  const activeRequestRef = useRef<string | null>(null);
  const status = runtime.data;
  const isFixtureMode = status?.dataMode === "fixture";
  const missingConfiguration =
    !!status && !status.researchWebhookConfigured && !isFixtureMode;
  const maxQuestionLength = status?.questionMaxLength ?? 2000;
  const loading = view.kind === "loading";
  const tooLong = question.length > maxQuestionLength;
  const trimmedEmpty = question.trim().length === 0;

  useEffect(() => {
    if (!loading) return;
    timerRef.current = window.setInterval(() => {
      setView((current) =>
        current.kind === "loading"
          ? {
              ...current,
              elapsed: Math.max(
                0,
                Math.floor((Date.now() - current.startedAt) / 1000),
              ),
            }
          : current,
      );
    }, 250);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [loading]);

  const submitQuestion = () => {
    if (loading || trimmedEmpty || tooLong) return;
    if (missingConfiguration) {
      setView({
        kind: "failure",
        failure: "configuration",
        message:
          "This runtime has no configured research transport. Your question has not been sent.",
        requestId: null,
      });
      return;
    }
    setSelectedSourceId(null);
    const requestId = `ge-${crypto.randomUUID()}`;
    const startedAt = Date.now();
    activeRequestRef.current = requestId;
    setView({ kind: "loading", startedAt, elapsed: 0 });
    ask.mutate(
      { data: { question: question.trim(), requestId } },
      {
        onSuccess: (result) => {
          if (activeRequestRef.current !== requestId) return;
          activeRequestRef.current = null;
          if (!isResearchResult(result) || result.requestId !== requestId) {
            setView({
              kind: "failure",
              failure: "invalid",
              message:
                "The research service returned a response that did not match this request. Your question is preserved.",
              requestId,
            });
            return;
          }
          if (
            result.status === "blocked" ||
            result.guardrails.output === "blocked"
          ) {
            setView({ kind: "blocked", result });
          } else if (result.status === "insufficient_evidence") {
            setView({ kind: "insufficient", result });
          } else if (result.status === "completed" && result.answer !== null) {
            setView({ kind: "answered", result });
          } else {
            const message =
              result.error?.safeMessage ||
              "The research service could not complete this request. Your question is preserved.";
            setView({
              kind: "failure",
              failure: "upstream",
              message,
              requestId: result.requestId || requestId,
              sample: result.mode === "fixture",
            });
          }
        },
        onError: (error) => {
          if (activeRequestRef.current !== requestId) return;
          activeRequestRef.current = null;
          const details = getApiFailure(error);
          setView({ kind: "failure", ...details, requestId });
        },
      },
    );
  };

  const result =
    view.kind === "answered" ||
    view.kind === "insufficient" ||
    view.kind === "blocked"
      ? view.result
      : null;
  const isBlocked = view.kind === "blocked";
  const answerVisible = view.kind === "answered" && !isBlocked;
  const answerText = answerVisible ? (result?.answer ?? "") : "";
  const selectedShortcutPrompt = SHORTCUTS.find(
    (item) => item.label === selectedShortcut,
  )?.prompt;

  const chooseShortcut = (label: string, prompt: string) => {
    setQuestion(prompt);
    setSelectedShortcut(label);
    setView({ kind: "empty" });
  };
  const onQuestionChange = (value: string) => {
    setQuestion(value);
    setSelectedShortcut(
      selectedShortcutPrompt === value ? selectedShortcut : null,
    );
    if (view.kind !== "loading") setView({ kind: "empty" });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submitQuestion();
    }
  };
  const focusSource = (id: string) => {
    setSelectedSourceId(id);
    const source = document.getElementById(`source-${id}`);
    source?.scrollIntoView({ behavior: "smooth", block: "center" });
    source?.focus({ preventScroll: true });
  };
  const copyResearchBrief = async () => {
    if (!result || !answerVisible) return;
    const sourceLines = result.sources.map((source) => {
      const metadata = [
        source.title || source.documentName || "Title unavailable",
        source.publisher
          ? `Publisher: ${source.publisher}`
          : "Publisher unavailable",
        source.date
          ? `${source.date}${source.dateMeaning ? ` (${source.dateMeaning})` : ""}`
          : "Date unavailable",
        source.page !== null ? `Page: ${source.page}` : "",
        source.recordId ? `Record: ${source.recordId}` : "",
        source.usage ? `Usage: ${source.usage}` : "",
        source.url && safeExternalUrl(source.url)
          ? safeExternalUrl(source.url)
          : "URL unavailable",
      ].filter(Boolean);
      return `[${source.id}] ${sourceKindLabel(source.kind)} — ${metadata.join(" · ")}\n${source.excerpt || "Excerpt unavailable"}`;
    });
    const brief = [
      "GlobalEdge Brokerage — Research Assistant",
      result.mode === "fixture" ? FIXTURE_LABEL : "Live response",
      "",
      "Question",
      result.question,
      "",
      "Answer",
      answerText,
      "",
      "Evidence",
      ...(sourceLines.length ? sourceLines : ["No source records returned."]),
      "",
      "Limitations",
      "Historical datasets only. No current prices, future outcomes, or investment recommendations are provided.",
      `Reference period: ${result.referencePeriod || "Not provided"}`,
      `Evaluation: ${result.evaluation.status}; storage: ${result.evaluationStorageStatus.replaceAll("_", " ")}`,
      `Input guardrail: ${result.guardrails.input}; output guardrail: ${result.guardrails.output}`,
      `Run reference: ${result.runId || result.requestId}`,
      ...(result.warnings.length ? ["", "Warnings", ...result.warnings] : []),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      setCopyFailed(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  };
  const failureTitle =
    view.kind === "failure"
      ? view.sample
        ? view.failure === "invalid"
          ? "Sample malformed-response fixture"
          : "Sample upstream-failure fixture"
        : {
            configuration: "Research is not configured",
            invalid: "Response could not be validated",
            timeout: "Request timed out",
            upstream: "Research request failed",
          }[view.failure]
      : "";

  return (
    <div className="ge-shell">
      <header className="ge-topbar">
        <div className="topbar-inner">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true">
              <Waves size={21} strokeWidth={1.8} />
            </div>
            <div>
              <div className="ge-wordmark">GlobalEdge Brokerage</div>
              <div className="brand-subtitle">Research Assistant</div>
            </div>
            <span className="proof-label">Proof of Concept</span>
          </div>
          <div className="topbar-right">
            <span className="topbar-context">Research workspace</span>
            <span className="topbar-rule" />
            <span className="topbar-doc">
              <FileText size={15} /> Historical evidence
            </span>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="intro-row">
          <div>
            <p className="ge-kicker intro-kicker">
              Broker research · Evidence first
            </p>
            <h1 className="ge-heading">
              A clearer view
              <br className="mobile-break" /> of the evidence.
            </h1>
            <p className="intro-copy">
              Ask a focused question. Review the sources behind every response.
            </p>
          </div>
          <RuntimePanel verifiedLiveResponse={result?.mode === "live"} />
        </section>

        <aside className="scope-notice" data-testid="notice-research-scope">
          <ShieldCheck size={18} aria-hidden="true" />
          <p>
            Research uses the supplied historical datasets. It is not a live
            market feed.
          </p>
          <span className="scope-label">SCOPE</span>
        </aside>

        <section
          className="question-section"
          aria-labelledby="question-heading"
        >
          <div className="section-heading-row">
            <div>
              <p className="ge-kicker">01 / Ask</p>
              <h2 id="question-heading" className="ge-heading">
                What would you like to research?
              </h2>
            </div>
            <span className="section-aside">Use supplied evidence only</span>
          </div>
          <div className="composer ge-card">
            <label htmlFor="research-question" className="composer-label">
              Research question
            </label>
            <textarea
              id="research-question"
              data-testid="input-research-question"
              aria-describedby="question-help question-counter"
              aria-invalid={tooLong || undefined}
              maxLength={maxQuestionLength + 1}
              disabled={loading}
              placeholder="Ask about a company, filing, news signal, or historical price record…"
              value={question}
              onChange={(event) => onQuestionChange(event.target.value)}
              onKeyDown={onKeyDown}
              rows={4}
            />
            <div className="composer-footer">
              <p id="question-help" className="composer-hint">
                A specific question makes the evidence easier to assess.{" "}
                <span>Ctrl / ⌘ + Enter to submit</span>
              </p>
              <div className="composer-actions">
                <span
                  id="question-counter"
                  className={`character-count ${tooLong ? "character-count-error" : ""}`}
                  data-testid="text-question-counter"
                >
                  {question.length.toLocaleString()} /{" "}
                  {maxQuestionLength.toLocaleString()}
                </span>
                <button
                  type="button"
                  data-testid="button-submit-question"
                  className="ge-button submit-button"
                  onClick={() => void submitQuestion()}
                  disabled={
                    loading || trimmedEmpty || tooLong || runtime.isLoading
                  }
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="spin" size={15} /> Researching
                    </>
                  ) : (
                    <>
                      Ask GlobalEdge <ArrowUpRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </div>
            {tooLong && (
              <p className="validation-message" role="alert">
                Keep your question within {maxQuestionLength.toLocaleString()}{" "}
                characters.
              </p>
            )}
          </div>
          <div className="shortcut-heading">
            <span className="ge-kicker">Start with a sample</span>
            <span className="shortcut-note">
              Selecting fills the question only — it does not submit.
            </span>
          </div>
          <div
            className="shortcut-list"
            role="group"
            aria-label="Sample question shortcuts"
          >
            {SHORTCUTS.map((shortcut) => (
              <button
                type="button"
                key={shortcut.label}
                data-testid={`button-shortcut-${shortcut.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className={`ge-shortcut ${selectedShortcut === shortcut.label ? "is-selected" : ""}`}
                aria-pressed={selectedShortcut === shortcut.label}
                disabled={loading}
                onClick={() => chooseShortcut(shortcut.label, shortcut.prompt)}
              >
                {shortcut.label}
                <ArrowUpRight size={13} aria-hidden="true" />
              </button>
            ))}
          </div>
          {isFixtureMode && (
            <div
              className="fixture-scenarios no-print"
              data-testid="fixture-scenarios"
            >
              <div className="shortcut-heading">
                <span className="ge-kicker">Fixture examples</span>
                <span className="shortcut-note">
                  Sample only. Select a scenario, then submit it separately.
                </span>
              </div>
              <div
                className="shortcut-list"
                role="group"
                aria-label="Sample response scenarios"
              >
                {DEMO_SCENARIOS.map((scenario) => (
                  <button
                    type="button"
                    key={scenario.label}
                    data-testid={`button-demo-${scenario.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className="ge-shortcut fixture-shortcut"
                    onClick={() => {
                      setQuestion(scenario.prompt);
                      setSelectedShortcut(null);
                      setView({ kind: "empty" });
                    }}
                    disabled={loading}
                  >
                    {scenario.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section
          className="results-section"
          aria-live="polite"
          aria-atomic="false"
        >
          <div className="section-heading-row result-heading-row">
            <div>
              <p className="ge-kicker">02 / Review</p>
              <h2 className="ge-heading">Research output</h2>
            </div>
            {result && (
              <div className="result-actions no-print">
                {answerVisible && (
                  <button
                    className="quiet-action"
                    data-testid="button-copy-answer"
                    onClick={() => void copyResearchBrief()}
                    type="button"
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                    {copied
                      ? "Copied"
                      : copyFailed
                        ? "Copy unavailable"
                        : "Copy research brief"}
                  </button>
                )}
                <button
                  className="quiet-action"
                  data-testid="button-print"
                  onClick={() => window.print()}
                  type="button"
                >
                  <Printer size={15} />
                  Print
                </button>
              </div>
            )}
          </div>

          {view.kind === "empty" && (
            <div className="empty-state ge-card" data-testid="state-empty">
              <div className="empty-mark">
                <Sparkles size={20} />
              </div>
              <div>
                <h3>Your research will appear here.</h3>
                <p>
                  Submit a question to see the answer, cited evidence, and any
                  important limitations together.
                </p>
              </div>
              <span className="empty-index">READY</span>
            </div>
          )}

          {!result && view.kind !== "loading" && (
            <div className="quality-preview ge-card">
              <button
                type="button"
                className="quality-toggle"
                aria-expanded={qualityOpen}
                onClick={() => setQualityOpen((open) => !open)}
                data-testid="button-quality-accordion"
              >
                <span>
                  <span className="ge-kicker">Quality review</span>
                  <strong>
                    Evaluation not implemented in the connected workflow
                  </strong>
                </span>
                <ChevronDown
                  size={16}
                  className={qualityOpen ? "chevron-open" : ""}
                />
              </button>
              {qualityOpen && (
                <p className="quality-preview-copy" data-testid="panel-quality">
                  No evaluator or evaluation-results table is implemented in the
                  described workflow. Scores remain unavailable; none are
                  inferred.
                </p>
              )}
            </div>
          )}

          {view.kind === "loading" && (
            <div
              className="loading-state ge-card"
              data-testid="state-loading"
              aria-live="polite"
            >
              <div className="loading-head">
                <div>
                  <span className="ge-kicker">Research in progress</span>
                  <h3>Reviewing the supplied evidence</h3>
                </div>
                <span className="elapsed">
                  <Clock3 size={15} />
                  {view.elapsed}s elapsed
                </span>
              </div>
              <div className="skeleton-line ge-skeleton" />
              <div className="skeleton-line skeleton-short ge-skeleton" />
              <div className="loading-columns">
                <div className="skeleton-panel ge-skeleton" />
                <div className="skeleton-panel ge-skeleton" />
              </div>
              <p className="loading-question">
                <span>Your question</span>
                {question}
              </p>
            </div>
          )}

          {view.kind === "failure" && (
            <div
              className={`failure-state ge-card ${view.failure === "configuration" ? "failure-muted" : ""}`}
              role="alert"
              data-testid={`state-${view.failure}`}
            >
              <div className="failure-icon">
                <AlertCircle size={19} />
              </div>
              <div className="failure-content">
                <span className="ge-kicker">
                  {view.sample
                    ? FIXTURE_LABEL
                    : view.failure === "configuration"
                      ? "Availability"
                      : "No answer returned"}
                </span>
                <h3>{failureTitle}</h3>
                <p>{view.message}</p>
                <p className="preserved-question">
                  <strong>Question preserved:</strong> {question}
                </p>
                <div className="failure-meta">
                  <span>Run reference</span>
                  <code>{view.requestId || "Not sent"}</code>
                </div>
                {view.failure !== "configuration" && (
                  <button
                    type="button"
                    className="quiet-action retry-action"
                    onClick={() => void submitQuestion()}
                    disabled={missingConfiguration || trimmedEmpty || tooLong}
                  >
                    <RotateCw size={14} />
                    Retry this question
                  </button>
                )}
              </div>
            </div>
          )}

          {result && (
            <>
              <div
                className={`result-banner ge-card ${view.kind === "answered" ? "result-banner-complete" : view.kind === "blocked" ? "result-banner-blocked" : "result-banner-caution"}`}
                data-testid={`state-${view.kind}`}
              >
                <div className="result-status-mark">
                  {view.kind === "answered" ? (
                    <Check size={17} />
                  ) : view.kind === "blocked" ? (
                    <ShieldCheck size={17} />
                  ) : (
                    <Info size={17} />
                  )}
                </div>
                <div className="result-status-copy">
                  <span className="ge-kicker">
                    {view.kind === "answered"
                      ? "Research complete"
                      : view.kind === "blocked"
                        ? "Response withheld"
                        : "Evidence coverage"}
                  </span>
                  <h3>
                    {view.kind === "answered"
                      ? "Evidence-linked response"
                      : view.kind === "blocked"
                        ? "This request was blocked by a guardrail."
                        : "Insufficient evidence for a supported answer."}
                  </h3>
                  <p>
                    {view.kind === "blocked"
                      ? result.guardrails.safeMessage ||
                        "No answer text is displayed for a blocked response."
                      : view.kind === "insufficient"
                        ? result.guardrails.safeMessage ||
                          "The supplied records do not support a complete answer."
                        : "Review the source records and limitations before sharing this response."}
                  </p>
                </div>
                <div className="result-mode">
                  <span
                    className={`mode-pill ${result.mode === "fixture" ? "mode-fixture" : ""}`}
                  >
                    {result.mode === "fixture"
                      ? "DEMO FIXTURE"
                      : "LIVE RESPONSE"}
                  </span>
                  {result.mode === "fixture" && (
                    <span className="mode-caption">
                      Separate from live research
                    </span>
                  )}
                </div>
              </div>

              <div className="answer-layout">
                <article className="answer-card ge-card">
                  <div className="card-header">
                    <div>
                      <p className="ge-kicker">Response</p>
                      <h3>
                        {view.kind === "blocked"
                          ? "No answer shown"
                          : view.kind === "insufficient"
                            ? "Evidence gap"
                            : "Summary"}
                      </h3>
                    </div>
                    <span className="card-header-icon">
                      <FileText size={17} />
                    </span>
                  </div>
                  {answerVisible ? (
                    <div className="answer-body" data-testid="text-answer">
                      <CitationText
                        text={answerText}
                        sources={result.sources}
                        onSelect={focusSource}
                      />
                    </div>
                  ) : (
                    <p
                      className="answer-placeholder"
                      data-testid={
                        view.kind === "blocked"
                          ? "text-blocked-answer-hidden"
                          : "text-insufficient-answer"
                      }
                    >
                      {view.kind === "blocked"
                        ? "Blocked answer content is intentionally not displayed."
                        : result.answer ||
                          "No answer was returned. The available evidence and limitations are listed below."}
                    </p>
                  )}
                  {result.warnings.length > 0 && (
                    <div className="warnings-box">
                      <span className="ge-kicker">Important context</span>
                      <ul>
                        {result.warnings.map((warning, index) => (
                          <li key={`${index}-${warning}`}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="answer-footer">
                    <div className="footer-meta">
                      <span>Reference period</span>
                      <strong>
                        {result.referencePeriod || "Not provided"}
                      </strong>
                    </div>
                    <div className="footer-meta">
                      <span>Backend elapsed</span>
                      <strong>
                        {result.backendElapsedMs === null
                          ? "Not reported"
                          : `${result.backendElapsedMs} ms`}
                      </strong>
                    </div>
                  </div>
                </article>

                <aside className="run-card ge-card">
                  <div className="card-header">
                    <div>
                      <p className="ge-kicker">Run details</p>
                      <h3>Trace & limits</h3>
                    </div>
                    <span className="card-header-icon">
                      <SlidersHorizontal size={17} />
                    </span>
                  </div>
                  <div className="run-reference">
                    <span>Run reference</span>
                    <code>{result.runId || result.requestId}</code>
                  </div>
                  <div className="guardrail-list">
                    <div>
                      <span>Input guardrail</span>
                      <strong>
                        {result.guardrails.input.replace("_", " ")}
                      </strong>
                    </div>
                    <div>
                      <span>Output guardrail</span>
                      <strong>
                        {result.guardrails.output.replace("_", " ")}
                      </strong>
                    </div>
                    <div>
                      <span>Evaluation storage</span>
                      <strong>
                        {result.evaluationStorageStatus.replaceAll("_", " ")}
                      </strong>
                    </div>
                    {result.evaluation.verdict && (
                      <div>
                        <span>Evaluation verdict</span>
                        <strong>{result.evaluation.verdict}</strong>
                      </div>
                    )}
                  </div>
                  <div className="limitations">
                    <span className="ge-kicker">Limitations</span>
                    <p>
                      Historical datasets only. No current prices, future
                      outcomes, or investment recommendations are provided.
                    </p>
                    {result.referencePeriod && (
                      <p>Evidence period: {result.referencePeriod}.</p>
                    )}
                  </div>
                  <div className="quality-control">
                    <button
                      type="button"
                      className="quality-toggle"
                      aria-expanded={qualityOpen}
                      onClick={() => setQualityOpen((open) => !open)}
                      data-testid="button-quality-accordion"
                    >
                      <span>
                        <span className="ge-kicker">Quality review</span>
                        <strong>
                          {result.evaluation.status === "complete"
                            ? "Evaluation available"
                            : "Unavailable for this run"}
                        </strong>
                      </span>
                      <ChevronDown
                        size={16}
                        className={qualityOpen ? "chevron-open" : ""}
                      />
                    </button>
                    {qualityOpen && (
                      <div
                        className="quality-content"
                        data-testid="panel-quality"
                      >
                        {result.evaluation.status !== "complete" ? (
                          <p>
                            Quality metrics are not available for this run. No
                            score is inferred.
                          </p>
                        ) : (
                          <>
                            {(
                              [
                                [
                                  "Groundedness",
                                  result.evaluation.groundedness,
                                ],
                                [
                                  "Answer relevance",
                                  result.evaluation.answerRelevance,
                                ],
                                [
                                  "Context precision",
                                  result.evaluation.contextPrecision,
                                ],
                              ] as [
                                string,
                                NonNullable<
                                  typeof result.evaluation.overall
                                > | null,
                              ][]
                            ).map(([label, value]) => (
                              <div className="metric-row" key={label}>
                                <span>{label}</span>
                                <strong>
                                  {value?.value ?? "Not reported"}
                                  {value?.value !== null &&
                                  value?.value !== undefined &&
                                  value.scaleMin !== null &&
                                  value.scaleMax !== null
                                    ? ` / ${value.scaleMin}–${value.scaleMax}`
                                    : ""}
                                </strong>
                                {value?.method && (
                                  <small>Method: {value.method}</small>
                                )}
                                {value?.explanation && (
                                  <small>{value.explanation}</small>
                                )}
                              </div>
                            ))}
                            {result.evaluation.judgeModel && (
                              <p>
                                Judge: {result.evaluation.judgeModel}
                                {result.evaluation.rubricVersion
                                  ? ` · Rubric ${result.evaluation.rubricVersion}`
                                  : ""}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </aside>
              </div>

              <section
                className="sources-section"
                aria-labelledby="sources-heading"
              >
                <div className="sources-heading-row">
                  <div>
                    <p className="ge-kicker">03 / Evidence</p>
                    <h2 className="ge-heading" id="sources-heading">
                      Sources <span>{result.sources.length}</span>
                    </h2>
                  </div>
                  <p>Stable source IDs link this evidence to the response.</p>
                </div>
                {result.sources.length ? (
                  <div className="sources-grid">
                    {result.sources.map((source, index) => (
                      <SourceCard
                        key={`${source.id}-${index}`}
                        source={source}
                        index={index}
                        isSelected={selectedSourceId === source.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="sources-empty ge-card"
                    data-testid="state-no-sources"
                  >
                    <Newspaper size={18} />
                    <div>
                      <strong>No source records returned</strong>
                      <p>Source evidence was not included in this response.</p>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </section>

        <footer className="workspace-footer">
          <span>GLOBAL EDGE · RESEARCH WORKSPACE</span>
          <span>Historical evidence. Clearly bounded.</span>
        </footer>
      </main>
    </div>
  );
}

export function Current() {
  return <ResearchWorkspace />;
}
