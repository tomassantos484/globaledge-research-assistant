# GlobalEdge Brokerage Research Assistant

A research workspace for questions about the supplied historical news, SEC filings, and price records. The browser talks only to the project's `/api` server; it never calls n8n directly.

## Run and verify

- The web preview is served by the `artifacts/globaledge-brokerage: web` workflow.
- The shared API is served by `artifacts/api-server: API Server`.
- `pnpm --filter @workspace/globaledge-brokerage run typecheck`
- `pnpm --filter @workspace/api-server run typecheck`
- `pnpm --filter @workspace/api-server run check:n8n` checks only `N8N_CONNECTION_TEST_URL`.
- `pnpm run build` checks the workspace and builds its packages.

## Data modes

The API defaults to `APP_DATA_MODE=fixture`. Fixture results are deterministic, visibly marked **“Sample data - interface demonstration only.”**, and are not project evidence. They include sourced-answer, insufficient-evidence, blocked, unavailable-evaluation, and simulated failure examples.

Live mode is opt-in with `APP_DATA_MODE=live`. It requires the server-side `N8N_WEBHOOK_URL` and `N8N_AUTH_HEADER_VALUE`. Live errors are shown as errors; they never switch to fixtures. The runtime status endpoint reports configuration separately from reachability. A configured URL is not considered verified, and a live response is the only evidence the research endpoint has responded.

Set the following in Replit Secrets/server configuration, not in browser variables:

- `APP_DATA_MODE=fixture` (switch to `live` only after the research response contract is implemented and confirmed)
- `QUESTION_MAX_LENGTH=2000`
- `N8N_WEBHOOK_URL` — research webhook
- `N8N_CONNECTION_TEST_URL` — separate connection acknowledgment webhook
- `N8N_AUTH_HEADER_NAME=X-GlobalEdge-Key`
- `N8N_AUTH_HEADER_VALUE` — secret value
- `N8N_TIMEOUT_MS=60000`

`artifacts/api-server/.env.example` contains placeholders only. Do not commit real values.

## Current integration limits

The attached build brief describes the existing workflow, but the original workflow JSON, presentation, and saved execution example were not included with the files supplied for this build. The app therefore does not claim to have inspected or tested the live workflow. See [the n8n handoff](docs/n8n-integration.md) before enabling live mode.

This is a proof of concept, not a live market feed or brokerage account system. No evaluation branch, evaluation-results table, separate model-output approval gate, authentication, or production-grade rate limiter is present. The API's in-memory request limiter is a shared per-process cap and resets on restart; it is not sufficient access control for a public live demo.
