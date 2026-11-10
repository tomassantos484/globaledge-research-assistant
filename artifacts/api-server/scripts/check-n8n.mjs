const connectionUrl = process.env.N8N_CONNECTION_TEST_URL?.trim();
const authHeaderName =
  process.env.N8N_AUTH_HEADER_NAME?.trim() || "X-GlobalEdge-Key";
const authHeaderValue = process.env.N8N_AUTH_HEADER_VALUE;
const timeoutMs = Number(process.env.N8N_TIMEOUT_MS || 60_000);

const question = "Connection test from Replit";
const requestId = "connectivity-001";

function report(message, details = "") {
  process.stdout.write(`${message}${details ? `: ${details}` : ""}\n`);
}

function fail(message, details = "") {
  report(`Connection test failed - ${message}`, details);
  process.exitCode = 1;
}

if (!connectionUrl) {
  fail(
    "N8N_CONNECTION_TEST_URL is not configured",
    "The script does not fall back to N8N_WEBHOOK_URL.",
  );
} else if (!authHeaderValue?.trim()) {
  fail("N8N_AUTH_HEADER_VALUE is not configured");
} else if (/[\r\n]/.test(authHeaderValue)) {
  fail("N8N_AUTH_HEADER_VALUE contains an invalid line break");
} else if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(authHeaderName)) {
  fail("N8N_AUTH_HEADER_NAME is invalid");
} else if (
  !Number.isInteger(timeoutMs) ||
  timeoutMs < 1_000 ||
  timeoutMs > 60_000
) {
  fail("N8N_TIMEOUT_MS must be an integer from 1000 to 60000");
} else {
  let url;
  try {
    url = new URL(connectionUrl);
  } catch {
    fail("N8N_CONNECTION_TEST_URL is not a valid URL");
  }

  if (url) {
    const localHttp =
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      (url.protocol !== "https:" && !localHttp) ||
      url.username ||
      url.password
    ) {
      fail("The test URL must use HTTPS and must not include URL credentials");
    } else {
      await runTest(url);
    }
  }
}

async function runTest(url) {
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "content-type": "application/json",
        [authHeaderName]: authHeaderValue,
      },
      body: JSON.stringify({ question, requestId }),
    });
  } catch (error) {
    const causeCode =
      typeof error === "object" &&
      error !== null &&
      "cause" in error &&
      typeof error.cause === "object" &&
      error.cause !== null &&
      "code" in error.cause &&
      typeof error.cause.code === "string"
        ? error.cause.code
        : "";

    if (error instanceof Error && error.name === "TimeoutError") {
      fail("request timed out", `timeout ${timeoutMs} ms`);
    } else if (causeCode === "ENOTFOUND" || causeCode === "EAI_AGAIN") {
      fail("DNS lookup failed", causeCode);
    } else if (causeCode) {
      fail("network or TLS connection failed", causeCode);
    } else {
      fail("network request failed");
    }
    return;
  }

  if (response.status >= 300 && response.status < 400) {
    fail(
      "redirect rejected",
      `HTTP ${response.status}; credentials were not forwarded`,
    );
    return;
  }
  if (response.status === 401 || response.status === 403) {
    fail("authentication was rejected", `HTTP ${response.status}`);
    return;
  }
  if (response.status === 404 || response.status === 405) {
    fail(
      "webhook was not found or is not registered",
      `HTTP ${response.status}`,
    );
    return;
  }
  if (!response.ok) {
    fail("webhook returned an unsuccessful status", `HTTP ${response.status}`);
    return;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!/^application\/(?:[a-z0-9.+-]+\+)?json(?:\s*;|$)/i.test(contentType)) {
    fail(
      "webhook returned a non-JSON response",
      "An HTML or login page is not a successful acknowledgment.",
    );
    return;
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    fail("webhook returned malformed JSON");
    return;
  }

  const echoedQuestion =
    payload && typeof payload === "object"
      ? (payload.question ?? payload.receivedQuestion)
      : undefined;
  if (
    !payload ||
    typeof payload !== "object" ||
    payload.status !== "connection_ok" ||
    payload.mode !== "connection_test" ||
    payload.requestId !== requestId ||
    typeof payload.executionId !== "string" ||
    payload.executionId.length === 0 ||
    echoedQuestion !== question
  ) {
    fail(
      "response did not match the connection-test acknowledgment contract",
      "Expected status=connection_ok, mode=connection_test, matching requestId, a non-empty executionId, and the received question.",
    );
    return;
  }

  report(
    "Connection test passed",
    `HTTP ${response.status}; request acknowledged; execution ID present.`,
  );
}
