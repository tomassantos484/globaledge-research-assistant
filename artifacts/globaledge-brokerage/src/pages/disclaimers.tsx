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
          ? "Configured, not verified"
          : "Not configured";

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
            Data sources, response checks, and limits of this prototype.
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
              The assistant is designed to answer questions using historical SEC
              filings, news, and price records supplied to its research
              workflow. Citations link answers to the source records returned
              with them.
            </p>
          </article>

          <article className="disclaimer-card ge-card">
            <span className="ge-kicker">Research connection</span>
            <h2>{researchStatus}</h2>
            {runtime.isLoading ? (
              <p>Checking the research connection settings.</p>
            ) : runtime.isError ? (
              <p>
                The app could not read its connection settings. It cannot
                confirm whether the research service is available.
              </p>
            ) : fixtureMode ? (
              <p>
                This app is showing sample responses to demonstrate the
                interface. They are not actual company
                research or market data. No actual historical research dataset
                was supplied with this first build.
              </p>
            ) : status?.researchWebhookConfigured ? (
              <p>
                The research connection is set up, but that does not confirm
                that the service can be reached. A valid research response is
                needed to confirm that it works. This connection does not
                provide a live market feed.
              </p>
            ) : (
              <p>
                The research connection has not been set up. Questions cannot
                be sent to the research service until it is connected.
              </p>
            )}
            <p>
              {runtime.isError
                ? "Connection-test status is unknown."
                : runtime.isLoading
                  ? "Checking the separate connection-test settings."
                  : status?.connectionTestConfigured
                    ? "A separate connection test is set up, but it does not confirm that research requests will work."
                    : "A separate connection test has not been set up."}{" "}
              If a research request fails, the app does not replace it with a sample response.
            </p>
          </article>

          <article className="disclaimer-card ge-card">
            <span className="ge-kicker">Data and evidence</span>
            <h2>Review the source records</h2>
            <p>
              Dates, publishers, excerpts, and reference periods depend on the
              supplied records. Missing details are marked as unavailable,
              not filled in. Historical evidence cannot establish current
              prices or future outcomes.
            </p>
          </article>

          <article className="disclaimer-card ge-card">
            <span className="ge-kicker">Evaluation and guardrails</span>
            <h2>Quality scores are unavailable</h2>
            <p>
              The described workflow does not calculate or store quality
              scores. Guardrails check requests and responses; their results
              appear as passed or blocked only when the workflow reports them.
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
              This prototype has no user sign-in. Its in-memory request limit is
              not production-grade protection. Keep a live instance
              access-restricted until suitable access controls and rate limiting
              are configured.
            </p>
          </article>
        </section>

        <p className="disclaimer-footnote">
          <Info size={15} aria-hidden="true" />
          <span>
            Sample data is labeled “Sample data - interface demonstration only.”
            wherever a sample response appears.
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
