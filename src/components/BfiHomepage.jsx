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

const quickLinks = [
  {
    label: "Research map",
    href: "#research",
    detail: "7 frontier domains",
  },
  {
    label: "Latest systems",
    href: "#publications",
    detail: "Working papers",
  },
  {
    label: "Open work",
    href: "#open",
    detail: "Code and datasets",
  },
  {
    label: "Companies",
    href: "#ecosystem",
    detail: "BR3N, SOLGLIA, OLTRE",
  },
];

const ecosystem = [
  {
    name: "BR3N",
    role: "AI products",
    description: "Autonomous agents, governed intelligence systems, and modern AI product surfaces.",
  },
  {
    name: "SOLGLIA",
    role: "Business intelligence",
    description: "Executive dashboards, enterprise intelligence, and precision operating systems.",
  },
  {
    name: "OLTRE",
    role: "Luxury design",
    description: "Architecture, fashion-adjacent systems, marble, black, and quiet confidence.",
  },
];

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

function BfiCinematicScene() {
  const sceneId = useId().replaceAll(":", "");
  const glowId = `${sceneId}-glow`;
  const grainId = `${sceneId}-grain`;

  return (
    <svg className="bfi-cinema__scene" viewBox="0 0 900 1200" role="img" aria-label="A lone figure facing a luminous research aperture">
      <defs>
        <radialGradient id={glowId} cx="50%" cy="44%" r="45%">
          <stop offset="0%" stopColor="#f7f6f2" stopOpacity="0.92" />
          <stop offset="38%" stopColor="#b89a5d" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#050505" stopOpacity="0" />
        </radialGradient>
        <filter id={grainId}>
          <feTurbulence baseFrequency="0.86" numOctaves="3" seed="11" type="fractalNoise" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.16" />
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width="900" height="1200" fill="#050505" />
      <rect width="900" height="1200" fill={`url(#${glowId})`} />
      <g fill="none" stroke="#f7f6f2" strokeOpacity="0.18">
        <circle cx="450" cy="520" r="132" />
        <circle cx="450" cy="520" r="224" />
        <circle cx="450" cy="520" r="330" />
        <circle cx="450" cy="520" r="430" />
        <path d="M450 96 V1040" />
        <path d="M110 802 C270 740 630 740 790 802" />
      </g>
      <g stroke="#f7f6f2" strokeOpacity="0.14">
        <path d="M152 984 H748" />
        <path d="M210 916 H690" />
        <path d="M278 850 H622" />
        <path d="M330 790 H570" />
      </g>
      <path d="M450 646 V938" stroke="#f7f6f2" strokeOpacity="0.52" strokeWidth="8" strokeLinecap="round" />
      <circle cx="450" cy="626" r="18" fill="#f7f6f2" fillOpacity="0.86" />
      <path d="M410 708 C432 690 468 690 490 708 L512 852 H388 Z" fill="#050505" fillOpacity="0.9" />
      <rect width="900" height="1200" filter={`url(#${grainId})`} opacity="0.5" />
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
          <a href="#ecosystem">Companies</a>
        </nav>
        <a className="bfi-nav__cta" href="#open">
          Open work
        </a>
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
          <BfiCinematicScene />
          <div className="bfi-cinema__caption">
            <span>Discovering what humanity does not yet know.</span>
            <small>Luminous field / research aperture / human scale</small>
          </div>
        </div>
      </section>

      <nav className="bfi-quick-links" aria-label="Website shortcuts">
        {quickLinks.map((item) => (
          <a href={item.href} key={item.label}>
            <span>{item.label}</span>
            <small>{item.detail}</small>
          </a>
        ))}
      </nav>

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

      <section id="ecosystem" className="bfi-section bfi-ecosystem" aria-labelledby="ecosystem-title">
        <div className="bfi-section__head">
          <p className="bfi-eyebrow">Commercialization</p>
          <h2 id="ecosystem-title">Research becomes companies.</h2>
        </div>
        <div className="bfi-ecosystem__line" aria-label="BFI commercialization path">
          <span>BFI Research</span>
          <span>Commercialization</span>
          <span>Products</span>
        </div>
        <div className="bfi-ecosystem__grid">
          {ecosystem.map((company) => (
            <article key={company.name}>
              <span>{company.role}</span>
              <h3>{company.name}</h3>
              <p>{company.description}</p>
            </article>
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
