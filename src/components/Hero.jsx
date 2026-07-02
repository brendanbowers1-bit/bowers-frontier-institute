import { FrontierSignature } from "./FrontierSignature";

export function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="hero__backdrop" aria-hidden="true" />
      <div className="container hero__layout">
        <div className="hero__content fade-in">
          <div className="hero__rule" aria-hidden="true" />
          <p className="hero__label">BFI · Research & intelligence</p>
          <h1 id="hero-title" className="hero__title">
            Bowers Frontier Institute
          </h1>
          <p className="hero__tagline">Frontier intelligence, built with discipline.</p>
          <p className="hero__body">
            Independent research and intelligence systems for finance, AI, risk,
            health, science, and data.
          </p>
          <div className="hero__actions">
            <a href="#institute" className="btn btn--primary">
              Explore the Institute
            </a>
            <a href="#contact" className="btn btn--secondary">
              Contact
            </a>
          </div>
        </div>
        <div className="hero__visual fade-in fade-in--delay">
          <FrontierSignature />
        </div>
      </div>
    </section>
  );
}
