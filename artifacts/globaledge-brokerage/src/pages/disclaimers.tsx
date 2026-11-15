import { useEffect } from "react";
import { Link } from "wouter";
import { Info, ShieldCheck } from "lucide-react";
import { useGetResearchRuntimeStatus } from "@workspace/api-client-react";
import { BrandHeader } from "@/components/brand-header";

const pageTitle = "Disclaimers & Scope | GlobalEdge Brokerage Research";
const pageDescription =
  "Learn about GlobalEdge research scope, sample fixtures, live connection status, evidence limits, financial disclaimers, and prototype security.";

export default function DisclaimersPage() {
  const runtime = useGetResearchRuntimeStatus();
  const status = runtime.data;
  const fixtureMode = status?.dataMode === "fixture";
  const researchStatus = runtime.isError
    ? "Status unavailable"
    : runtime.isLoading
      ? "Checking configuration"
      : fixtureMode
        ? "Sample fixtures active"
        : status?.researchWebhookConfigured
          ? "Configured, not verified"
          : "Not configured";

  useEffect(() => {
    const previousTitle = document.title;
    const metadata = [
      { selector: 'meta[name="description"]', content: pageDescription },
      { selector: 'meta[property="og:title"]', content: pageTitle },
      { selector: 'meta[property="og:description"]', content: pageDescription },
      { selector: 'meta[name="twitter:title"]', content: pageTitle },
      { selector: 'meta[name="twitter:description"]', content: pageDescription },
    ];
    const previousMetadata = metadata.map(({ selector }) => {
      const element = document.querySelector<HTMLMetaElement>(selector);
      return { element, content: element?.content ?? null };
    });

    document.title = pageTitle;
    metadata.forEach(({ selector, content }) => {
      const element = document.querySelector<HTMLMetaElement>(selector);
      if (element) element.content = content;
    });

    return () => {
      document.title = previousTitle;
      previousMetadata.forEach(({ element, content }) => {
        if (element && content !== null) element.content = content;
      });
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
            What this proof of concept uses, what it reports, and what it does
            not do.
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
              It is designed to answer focused questions using historical SEC
              filings, news, and price records supplied to its research
              workflow. Source IDs connect a response to the records returned
              with it.
            </p>
          </article>

          <article className="disclaimer-card ge-card">
            <span className="ge-kicker">Current runtime</span>
            <h2>{researchStatus}</h2>
            {runtime.isLoading ? (
              <p>Checking research runtime configuration.</p>
            ) : runtime.isError ? (
              <p>
                The application could not read its runtime configuration, so
                live availability is unknown.
              </p>
            ) : fixtureMode ? (
              <p>
                This workspace is currently in fixture mode. Its sample
                responses are interface demonstrations, not actual company
                research or market data. No actual historical research dataset
                was supplied with this first build.
              </p>
            ) : status?.researchWebhookConfigured ? (
              <p>
                The research webhook is configured, but this status does not
                verify that it is reachable. Reachability is confirmed only
                after a valid live research response is received.
              </p>
            ) : (
              <p>
                Live research is not configured. A question is not sent to a
                research workflow until its server-side connection is set up.
              </p>
            )}
            <p>
              {runtime.isError
                ? "Connection-test status is unknown."
                : runtime.isLoading
                  ? "Connection-test configuration is being checked."
                  : status?.connectionTestConfigured
                    ? "A separate connection-test endpoint is configured, but that does not prove the research endpoint is reachable."
                    : "A separate connection-test endpoint is not configured."}{" "}
              Live failures never fall back to fixture responses.
            </p>
          </article>

          <article className="disclaimer-card ge-card">
            <span className="ge-kicker">Data and evidence</span>
            <h2>Review the source records</h2>
            <p>
              Dates, publishers, excerpts, and reference periods depend on the
              supplied records. Missing details are identified as unavailable
              rather than inferred. Historical evidence cannot establish current
              prices or future outcomes.
            </p>
          </article>

          <article className="disclaimer-card ge-card">
            <span className="ge-kicker">Evaluation and guardrails</span>
            <h2>No scores are invented</h2>
            <p>
              The described workflow does not implement an evaluator or
              evaluation-results storage. Scores remain unavailable. Guardrail
              checks are shown as passed or blocked only when the workflow
              explicitly reports them.
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
            <span className="ge-kicker">Prototype, release and security</span>
            <h2>Not ready for public production use</h2>
            <p>
              This prototype has no user sign-in, and its in-memory request
              limit is not production-grade protection. Do not release it as a
              public live research service until suitable access controls and
              rate limiting are configured. Treat all output as unverified
              research.
            </p>
          </article>
        </section>

        <p className="disclaimer-footnote">
          <Info size={15} aria-hidden="true" />
          <span>
            Sample data is labeled “Sample data - interface demonstration only.”
            wherever a fixture response appears.
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
