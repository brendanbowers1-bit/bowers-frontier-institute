import { useId } from "react";
import "./BfiHomepage.css";

const researchAreas = [
  {
    name: "Finance",
    sentence: "Researching capital, markets, risk, and decision systems.",
    tone: "finance",
  },
  {
    name: "Artificial Intelligence",
    sentence: "Building governed intelligence systems for frontier questions.",
    tone: "ai",
  },
  {
    name: "Medicine",
    sentence: "Mapping clinical knowledge into reproducible research infrastructure.",
    tone: "medicine",
  },
  {
    name: "Economics",
    sentence: "Studying institutions, incentives, scarcity, and civilization-scale tradeoffs.",
    tone: "economics",
  },
  {
    name: "Energy",
    sentence: "Understanding the systems that power human progress.",
    tone: "energy",
  },
  {
    name: "Climate",
    sentence: "Investigating planetary risk through data, models, and adaptation.",
    tone: "climate",
  },
  {
    name: "Robotics",
    sentence: "Exploring embodied intelligence, automation, and physical systems.",
    tone: "robotics",
  },
];

const publications = [
  "Frontier Macro Intelligence Platform",
  "BFI Data Standards Constitution",
  "Type 1 Diabetes Research Data Source Map",
];

const openResearch = ["GitHub", "Papers", "Datasets", "Interactive dashboards"];

function BfiMark() {
  const titleId = useId();

  return (
    <svg className="bfi-mark" viewBox="0 0 64 64" role="img" aria-labelledby={titleId}>
      <title id={titleId}>BFI aperture mark</title>
      <circle cx="32" cy="32" r="30" />
      <path d="M21 18 L32 12 L43 18" />
      <path d="M22 20 L22 45" />
      <path d="M42 20 L42 45" />
      <path d="M32 23 L32 42" />
      <path d="M17 45 C23 41 28 40 32 40 C36 40 41 41 47 45" />
    </svg>
  );
}

export function BfiHomepage() {
  return (
    <main className="bfi-site">
      <header className="bfi-nav" aria-label="BFI primary">
        <a className="bfi-nav__brand" href="#top" aria-label="Bowers Frontier Institute home">
          <BfiMark />
          <span>BFI</span>
        </a>
        <nav>
          <a href="#research">Research</a>
          <a href="#publications">Publications</a>
          <a href="#open">Open Research</a>
        </nav>
      </header>

      <section id="top" className="bfi-hero" aria-labelledby="bfi-hero-title">
        <div className="bfi-hero__copy">
          <p className="bfi-eyebrow">BFI</p>
          <h1 id="bfi-hero-title">The Bowers Frontier Institute</h1>
          <p>Exploring questions that reshape civilization.</p>
          <div className="bfi-hero__actions">
            <a href="#research">Research</a>
            <a href="#publications">Publications</a>
          </div>
        </div>
        <div className="bfi-cinema" aria-label="Cinematic frontier research visual">
          <div className="bfi-cinema__plate" />
          <span>Discovering what humanity does not yet know.</span>
        </div>
      </section>

      <section id="research" className="bfi-section" aria-labelledby="research-title">
        <div className="bfi-section__head">
          <p className="bfi-eyebrow">Research areas</p>
          <h2 id="research-title">Questions before categories.</h2>
        </div>
        <div className="bfi-research-grid">
          {researchAreas.map((area) => (
            <article className="bfi-research-card" key={area.name}>
              <div className={`bfi-image bfi-image--${area.tone}`} aria-hidden="true" />
              <div>
                <h3>{area.name}</h3>
                <p>{area.sentence}</p>
                <a href="#open">Learn More</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="publications" className="bfi-section bfi-publications" aria-labelledby="publications-title">
        <div className="bfi-section__head">
          <p className="bfi-eyebrow">Publications</p>
          <h2 id="publications-title">Journal style, research first.</h2>
        </div>
        <ol>
          {publications.map((publication, index) => (
            <li key={publication}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{publication}</h3>
              <p>Working paper / research system</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="open" className="bfi-section bfi-open" aria-labelledby="open-title">
        <div>
          <p className="bfi-eyebrow">Open research</p>
          <h2 id="open-title">Papers, datasets, code, and dashboards.</h2>
        </div>
        <div className="bfi-open__links">
          {openResearch.map((item) => (
            <a href="#top" key={item}>
              {item}
            </a>
          ))}
        </div>
      </section>

      <footer className="bfi-footer">
        <div>
          <BfiMark />
          <span>Bowers Frontier Institute</span>
        </div>
        <nav aria-label="Social links">
          <a href="#top">GitHub</a>
          <a href="#top">LinkedIn</a>
          <a href="#top">X</a>
        </nav>
        <p>Copyright 2026 Bowers Frontier Institute.</p>
      </footer>
    </main>
  );
}
