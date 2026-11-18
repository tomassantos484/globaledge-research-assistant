import { useEffect } from "react";
import { Link } from "wouter";
import { Info, ShieldCheck } from "lucide-react";
import { useGetResearchRuntimeStatus } from "@workspace/api-client-react";
import { BrandHeader } from "@/components/brand-header";

export default function DisclaimersPage() {
  const runtime = useGetResearchRuntimeStatus();
  const status = runtime.data;
  const fixtureMode = status?.dataMode === "fixture";
  const researchStatus = runtime.isError
    ? "Status unavailable"
    : runtime.isLoading
      ? "Checking configuration"
      : fixtureMode
        ? "Sample responses active"
        : status?.researchWebhookConfigured
          ? "Connection set up, not checked"
          : "Connection not set up";

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Disclaimers | GlobalEdge Brokerage Research Assistant";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="ge-shell">
      <BrandHeader activePage="disclaimers" />
      <main className="workspace disclaimers-page">
        <section className="disclaimer-intro">
          <p className="ge-kicker">Project information</p>
          <h1 className="ge-heading">Disclaimers &amp; research scope</h1>
          <p>
            What the assistant can answer and where its limits apply.
          </p>
        </section>

        <aside
          className="scope-notice"
          data-testid="notice-research-scope"
          aria-label="Research scope"
        >
          <ShieldCheck size={18} aria-hidden="true" />
          <p>
            Research uses the supplied historical datasets. It is not a live
            market feed.
          </p>
          <span className="scope-label">SCOPE</span>
        </aside>

        <section
          className="disclaimer-grid"
          aria-label="Project disclaimers"
          data-testid="page-disclaimers"
        >
          <article className="disclaimer-card ge-card">
            <span className="ge-kicker">What the assistant does</span>
            <h2>Research from supplied evidence</h2>
            <p>
              Ask questions about historical SEC filings, news, or price records
              supplied to the research workflow. When the workflow returns
              citations, you can follow them to the source details.
            </p>
          </article>

          <article className="disclaimer-card ge-card">
            <span className="ge-kicker">Research connection</span>
            <h2>{researchStatus}</h2>
            {runtime.isLoading ? (
              <p>Checking the research connection settings.</p>
            ) : runtime.isError ? (
              <p>
                The app couldn't read its connection settings, so it can't
                confirm whether the research service is available.
              </p>
            ) : fixtureMode ? (
              <p>
                You're viewing sample responses that show how the interface
                works, not actual company research or market data. The first
                build didn't include a historical research dataset.
              </p>
            ) : status?.researchWebhookConfigured ? (
              <p>
                The research connection is set up, but the app needs a valid
                response to confirm that the service works. A working
                connection still uses historical records, not a live market feed.
              </p>
            ) : (
              <p>
                The app can't send questions to the research service until its
                connection is set up.
              </p>
            )}
            <p>
              {runtime.isError
                ? "Connection-test status is unknown."
                : runtime.isLoading
                  ? "Checking the separate connection-test settings."
                  : status?.connectionTestConfigured
                    ? "A separate connection test is set up, but it doesn't confirm that research requests will work."
                    : "A separate connection test hasn't been set up."}{" "}
              If a research request fails, the app won't replace it with a sample response.
            </p>
          </article>

          <article className="disclaimer-card ge-card">
            <span className="ge-kicker">Data and evidence</span>
            <h2>Review the source records</h2>
            <p>
              Dates, publishers, excerpts, and reference periods depend on the
              supplied records. The app marks missing details as unavailable
              rather than filling them in; historical evidence can't establish
              current prices or future outcomes.
            </p>
          </article>

          <article className="disclaimer-card ge-card">
            <span className="ge-kicker">Evaluation and guardrails</span>
            <h2>Quality scores unavailable</h2>
            <p>
              The described workflow doesn't calculate or store quality
              scores. The app shows a guardrail as passed or blocked only when
              the workflow reports that result.
            </p>
          </article>

          <article className="disclaimer-card ge-card">
            <span className="ge-kicker">Financial disclaimer</span>
            <h2>Not investment advice</h2>
            <p>
              This proof of concept does not provide personalized financial
              advice, an offer to buy or sell, or a recommendation to trade.
              Review the original evidence and consult a qualified professional
              for financial decisions.
            </p>
          </article>

          <article className="disclaimer-card ge-card">
            <span className="ge-kicker">Prototype and access</span>
            <h2>Access restrictions are needed</h2>
            <p>
              This prototype has no sign-in, and its temporary request limit
              isn't enough to protect a public service. Restrict access to any
              connected instance until suitable access controls and rate
              limiting are in place.
            </p>
          </article>
        </section>

        <p className="disclaimer-footnote">
          <Info size={15} aria-hidden="true" />
          <span>
            Look for “Sample data - interface demonstration only.” on sample
            responses.
          </span>
        </p>

        <footer className="workspace-footer">
          <span>GLOBAL EDGE · PROJECT SCOPE</span>
          <Link href="/" className="footer-disclaimer-link">
            Back to research
          </Link>
        </footer>
      </main>
    </div>
  );
}
