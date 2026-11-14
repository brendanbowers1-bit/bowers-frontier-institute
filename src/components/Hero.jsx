import { FrontierSignature } from "./FrontierSignature";

export function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="hero__backdrop" aria-hidden="true" />
      <div className="container hero__layout">
        <div className="hero__content">
          <p className="hero__brand-mark fade-in">BFI</p>
          <h1 id="hero-title" className="hero__title fade-in fade-in--delay-1">
            Bowers Frontier Institute
          </h1>
          <p className="hero__headline fade-in fade-in--delay-2">
            Frontier intelligence, built with discipline.
          </p>
          <p className="hero__support fade-in fade-in--delay-3">
            Research-grade systems for finance, AI, risk, health, science, and
            data.
          </p>
          <div className="hero__actions fade-in fade-in--delay-4">
            <a href="#institute" className="btn btn--primary">
              Explore the Institute
            </a>
            <a href="#dashboard" className="btn btn--secondary">
              Open dashboard
            </a>
          </div>
        </div>
        <div className="hero__visual fade-in fade-in--delay-2" aria-hidden="true">
          <FrontierSignature />
        </div>
      </div>
    </section>
  );
}
