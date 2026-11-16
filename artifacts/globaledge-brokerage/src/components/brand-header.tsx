import { Waves } from "lucide-react";
import { Link } from "wouter";

type BrandHeaderProps = {
  activePage: "research" | "disclaimers";
};

export function BrandHeader({ activePage }: BrandHeaderProps) {
  return (
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
        <nav className="page-navigation" aria-label="Main navigation">
          <Link
            href="/"
            className={`page-nav-link ${activePage === "research" ? "is-active" : ""}`}
            aria-current={activePage === "research" ? "page" : undefined}
          >
            Research
          </Link>
          <Link
            href="/disclaimers"
            className={`page-nav-link ${activePage === "disclaimers" ? "is-active" : ""}`}
            aria-current={activePage === "disclaimers" ? "page" : undefined}
          >
            Disclaimers
          </Link>
        </nav>
      </div>
    </header>
  );
}
