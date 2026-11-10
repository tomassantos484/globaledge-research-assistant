# GlobalEdge Brokerage Research Assistant

A capstone proof of concept for asking financial research questions against supplied historical news, SEC filings, and price records, with source citations and explicit limitations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the shared API server
- `pnpm --filter @workspace/globaledge-brokerage run dev` — run the research workspace
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/api-server run check:n8n` — test only the separate n8n connection-test webhook
- Fixture mode needs no secrets. Live mode uses server-side `APP_DATA_MODE`, `N8N_WEBHOOK_URL`, `N8N_CONNECTION_TEST_URL`, `N8N_AUTH_HEADER_NAME`, `N8N_AUTH_HEADER_VALUE`, and `N8N_TIMEOUT_MS`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: React, Vite, Tailwind CSS
- API: Express 5
- Validation/contracts: OpenAPI, Orval, Zod
- API build: esbuild
- No database or separate LLM service is used by this proof of concept.

## Where things live

- `artifacts/globaledge-brokerage/src/` — research workspace UI and exact presentation palette
- `artifacts/globaledge-brokerage/docs/n8n-integration.md` — workflow handoff and live-mode requirements
- `artifacts/api-server/src/routes/research.ts` — `/api/status` and `/api/ask`
- `artifacts/api-server/src/lib/research.ts` — fixture transport, server-only n8n adapter, and normalized result validation
- `artifacts/api-server/scripts/check-n8n.mjs` — connection-test diagnostic
- `lib/api-spec/openapi.yaml` — source of truth for API contracts

## Architecture decisions

- The browser calls only the same-origin API. Only the server calls n8n, using server-side configuration and credentials.
- `APP_DATA_MODE` defaults to `fixture`; setting `live` is explicit. Live failures never fall back to sample data.
- The connection-test webhook is separate from the research webhook and cannot be parsed as a research answer.
- The current workflow description has no evaluator or separate approval gate, so evaluation remains unavailable and guardrail checks remain unreported unless returned explicitly.

## Product

The workspace accepts a research question, provides five non-submitting sample prompts, and presents a normalized answer with stable citations, source metadata, warnings, run reference, and an unavailable-quality state. Included fixtures demonstrate sourced, insufficient-evidence, blocked, and error states without representing real project evidence.

## User preferences

Use the exact seven GlobalEdge palette colors and keep the interface framed as historical research, not a live market feed or a trading recommendation tool.

## Gotchas

- The original workflow JSON, presentation, and saved n8n execution example were not supplied. The handoff is based on the attached build brief; verify the actual workflow before enabling live mode.
- Live mapping requires an explicit `status` and `answer` response from n8n. The adapter intentionally does not guess whether `text`, `output`, or another field contains the final answer.
- The in-memory 60-request/minute limiter is shared per process, resets on restart, and is not production-grade access control.
- Do not expose live mode publicly until access restrictions and suitable rate limiting are configured.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
