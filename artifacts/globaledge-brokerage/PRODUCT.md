# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Brokers are the primary audience. They ask financial research questions about past events or price movements and need to inspect the records behind an answer before relying on it. The app is a capstone proof of concept for that workflow, not a production brokerage service.

## Product Purpose

GlobalEdge Brokerage Research Assistant answers questions using supplied historical financial news, SEC filings, and price records. A successful session lets the broker understand the answer, inspect supporting sources, and recognize when the available evidence is insufficient.

## Positioning

Answers are bounded by the supplied records and link back to returned sources. The app is not a live market feed, a prediction service, or an investment recommendation tool.

## Operating Context

- On the research page, users enter their own question or start with a sample prompt that does not submit automatically. Results expose available source details and warnings alongside the answer.
- The separate Disclaimers page explains what the prototype does, its research scope, and its limitations. The research page stays focused on asking questions and reviewing results.

## Capabilities and Constraints

- Fixture mode demonstrates sourced, insufficient-evidence, blocked, and error states. Sample output is labeled “Sample data - interface demonstration only.” It is not real research evidence.
- Live mode means the server is configured to use an external research workflow, not that the datasets are live. The browser calls the app’s own API; workflow configuration and credentials stay on the server. Live failures do not fall back to fixtures.
- Report evaluation or guardrail results only when explicitly provided. Do not imply successful evaluation or screening from a missing result.
- Keep the scope to research questions and evidence review. Trading, payments, customer portfolios, and ingestion administration are outside this prototype.

## Brand Commitments

Use the name GlobalEdge Brokerage Research Assistant and preserve the supplied presentation identity. Describe the scope plainly: “Research uses the supplied historical datasets. It is not a live market feed.”

## Evidence on Hand

The app includes labeled demonstration fixtures and sample questions. The [workflow handoff](docs/n8n-integration.md) documents the integration contract; the original workflow export, supplied datasets, and a saved real workflow response are not part of the handoff. Do not claim validation against those materials without verifying them.

## Product Principles

- Make evidence easy to inspect alongside the claim it supports.
- State missing evidence, unavailable checks, and failures plainly rather than guessing.
- Keep demonstration output clearly distinct from actual research results.
- Keep the primary workflow focused, with detailed disclosures one step away.
