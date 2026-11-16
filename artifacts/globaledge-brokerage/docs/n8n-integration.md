# n8n integration handoff

This document describes the changes needed before setting `APP_DATA_MODE=live`. It is not an n8n export or a claim that the university-hosted workflow has been edited.

## What is and is not verified

The supplied build brief says the workflow export has 20 nodes and is inactive. It describes these existing paths and nodes: ingestion through `On form submission`; separate `News Store` (`Global_News`) and `SEC Store` (`sec_filing`); price parsing through `Extract from File`, `Code in JavaScript`, and `Insert row` into `stock_prices`; and questions through `When chat message received`, `Detect Ticker`, `Retrieve Filings`, `Retrieve News`, `Get Prices`, `Merge`, `Build Context`, and `Basic LLM Chain` with `OpenAI Chat Model` set to `gpt-4o`.

The actual workflow JSON, presentation, and saved execution payload were not included with the files supplied for this build. The live deployment was not queried. Treat the topology above as information from the brief and confirm it against the current n8n export before editing or enabling live traffic.

The brief also identifies gaps in that export: no research Webhook/Respond to Webhook, no evaluator or evaluation-results table, no separate input/output guardrail gates, no structured source list from `Build Context`, and `Detect Ticker` drops extra request fields. The final generated-text property has not been verified from an execution.

## Research workflow changes

1. Keep ingestion separate. Do not send broker questions to `On form submission` or re-ingest files for each question.
2. Add a POST Webhook at path `globaledge-ask`, authenticate it with Header Auth, and use “Using Respond to Webhook Node.” Keep the research and connection-test paths distinct.
3. Add request validation and normalization immediately after the research Webhook. Accept only JSON with `question` (trimmed, nonempty, at most 2,000 characters) and `requestId` (8–80 characters). Return a controlled 400 before model work for invalid input.
4. Normalize `question` to the existing `chatInput` expected by `Detect Ticker`. Preserve `requestId` and a start timestamp. Update `Detect Ticker` to retain the metadata or reference the normalization node explicitly. Do not assume chat-trigger input uses the same body shape.
5. Keep the existing filing, news, and price branches. Ensure empty branches still reach assembly with explicit empty-result envelopes; do not use unrelated price rows as a fallback.
6. Extend `Build Context` to emit both the exact generator context and a structured `sources` array. Assign stable source IDs there (`F1`, `N1`, and so on) and use those same IDs in the prompt and response. Preserve actual source type, title, document/file identity, date and its meaning, URL, excerpt, page/record reference. Missing metadata stays absent/null.
7. Add `Build API Response` after `Basic LLM Chain`, then `Respond to Webhook`. Confirm the real LLM output property with a saved execution before mapping it. The Replit adapter intentionally requires a `status` and an `answer` field for a completed result; it does not guess between strings such as `text`, `output`, or a raw execution dump.
8. Make status explicit: `completed`, `insufficient_evidence`, `blocked`, or `error`. Do not infer it by searching answer text. Return one object per request and preserve `requestId`; do not return the price-ingestion `Insert row` output.

### Expected research response

The app assigns `mode` and `schemaVersion` itself. The workflow should return an object like this, using real values and metadata from that execution:

```json
{
  "status": "completed",
  "requestId": "the-request-id-from-the-input",
  "runId": "an-execution-reference",
  "answer": "A grounded answer that cites [F1] and [N1].",
  "sources": [
    {
      "id": "F1",
      "kind": "filing",
      "title": "Actual filing title, or null",
      "documentName": "Actual document name, or null",
      "publisher": null,
      "url": null,
      "date": null,
      "dateMeaning": null,
      "page": null,
      "recordId": null,
      "excerpt": "The actual retrieved excerpt, or null",
      "usage": "cited"
    }
  ],
  "warnings": [],
  "referencePeriod": null,
  "guardrails": {
    "input": "not_reported",
    "output": "not_reported",
    "safeMessage": null
  }
}
```

`sources` may be an empty array when nothing was retrieved. Each supplied source needs its stable `id` and `kind`; optional metadata may be null. Unsupported URL schemes are dropped by the server. A completed response needs a non-empty `answer`. A blocked response may include a `safeMessage`, but its generated answer is discarded before it reaches the browser. An `error` status must include `error: { "code": "...", "safeMessage": "...", "retryable": false }`.

The current export described in the brief has no evaluator. Until a separate evaluator and confirmed storage exist, the Replit API always reports evaluation as unavailable with null metrics and `evaluationStorageStatus: "not_implemented"`. Prompt rules do not count as passed guardrails. Do not add fabricated scores or approval flags.

## Separate connection-test workflow

The connection acknowledgment is not a research answer and must never be returned by the research endpoint.

1. Import `GlobalEdge_Frontend_Connection_Test.json` as a separate workflow if available; otherwise create a small Webhook → validation Code → Respond to Webhook flow.
2. Configure POST path `globaledge-connection-test`, Header Auth, and “Using Respond to Webhook Node.”
3. Use a credential whose header is `X-GlobalEdge-Key`, with the same value stored as the server-side `N8N_AUTH_HEADER_VALUE` in Replit Secrets.
4. Configure `N8N_CONNECTION_TEST_URL` with the test URL only. Start “Listen for test event” if using a test URL, then run:

   ```sh
   pnpm --filter @workspace/api-server run check:n8n
   ```

5. The script sends `{"question":"Connection test from Replit","requestId":"connectivity-001"}` and expects `status: "connection_ok"`, `mode: "connection_test"`, the matching request ID, a non-empty `executionId`, and the echoed question. It prints a sanitized result and never prints the URL or auth value.
6. Confirm an empty question returns HTTP 400 and missing/incorrect authentication is rejected before processing.
7. Activate/publish the connection-test workflow with the installed n8n version's controls, replace the setting with its Production URL, and rerun the script without a listening session.

The script never falls back to `N8N_WEBHOOK_URL`. It distinguishes missing settings, DNS/network/TLS errors, authentication failure, missing/unregistered webhook, redirects, non-JSON/login responses, and malformed acknowledgments.

## Security and release boundary

- Browser requests go to the same-origin `/api/ask`; only the API server calls the configured n8n URL.
- `N8N_WEBHOOK_URL` and `N8N_CONNECTION_TEST_URL` are independent settings. The connection test never invokes research or generation.
- Configure credentials only through Replit Secrets/server configuration. Never expose the auth value in frontend variables, source control, logs, screenshots, or API responses.
- The server accepts only configured HTTPS destinations (localhost HTTP is allowed for local development), does not follow redirects, and does not accept a client-selected URL, model, prompt, or credential.
- `POST /api/ask` has an in-memory limit of 60 requests per minute for the API process. It is shared by visitors and resets on restart; multiple instances do not share it. It is not production-grade protection.
- Before a public live demo, add the appropriate Replit/server access restriction and production-grade rate limiting. This proof of concept has no user authentication.
- Do not enable live mode until the current export has been checked, the research response mapping is confirmed from a real execution, and failure/empty-branch behavior is tested. No live webhook, generation, citation, evaluation, or guardrail test has been run from this build.
