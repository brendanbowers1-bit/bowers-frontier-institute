import {
  ArrowUpRight,
  BriefcaseBusiness,
  Download,
  Layers3,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  resumeCapabilities,
  resumeExperience,
  resumeLinks,
  resumePrinciples,
  resumeProfile,
  resumeProjects,
} from "../data/resume";
import "./ResumePage.css";

function handlePrint() {
  window.print();
}

export function ResumePage() {
  return (
    <main className="resume-page" id="overview">
      <header className="resume-nav" aria-label="Resume navigation">
        <a className="resume-brand" href="#overview">
          <span aria-hidden="true">BB</span>
          Resume
        </a>
        <nav aria-label="Resume sections">
          <a href="#experience">Experience</a>
          <a href="#work">Work</a>
          <a href="#skills">Skills</a>
          <button onClick={handlePrint} type="button">
            <Download size={14} />
            Print
          </button>
        </nav>
      </header>

      <section className="resume-hero">
        <div className="resume-hero__content">
          <p className="resume-kicker">Personal resume site</p>
          <h1>{resumeProfile.name}</h1>
          <p className="resume-headline">{resumeProfile.headline}</p>
          <p className="resume-summary">{resumeProfile.summary}</p>
          <div className="resume-meta" aria-label="Resume metadata">
            <span>
              <MapPin size={15} />
              {resumeProfile.location}
            </span>
            <span>
              <Sparkles size={15} />
              {resumeProfile.availability}
            </span>
          </div>
        </div>

        <aside className="resume-snapshot" aria-label="Resume snapshot">
          <p>Focus</p>
          <strong>Founder-led systems that make complex decisions clearer.</strong>
          <div className="resume-snapshot__links">
            {resumeLinks.map((link) => (
              <a href={link.href} key={link.label}>
                <span>{link.label}</span>
                <small>{link.value}</small>
                <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
        </aside>
      </section>

      <section className="resume-section resume-section--compact" id="skills">
        <div className="resume-section__header">
          <p className="resume-kicker">Capability map</p>
          <h2>What I bring</h2>
        </div>
        <ul className="capability-cloud">
          {resumeCapabilities.map((capability) => (
            <li key={capability}>{capability}</li>
          ))}
        </ul>
      </section>

      <section className="resume-section" id="experience">
        <div className="resume-section__header">
          <p className="resume-kicker">Experience</p>
          <h2>Builder, founder, and research-systems operator.</h2>
        </div>
        <div className="experience-list">
          {resumeExperience.map((item) => (
            <article className="experience-card" key={`${item.role}-${item.organization}`}>
              <div className="experience-card__heading">
                <div>
                  <p>{item.period}</p>
                  <h3>{item.role}</h3>
                  <span>{item.organization}</span>
                </div>
                <BriefcaseBusiness size={22} />
              </div>
              <p className="experience-card__description">{item.description}</p>
              <ul>
                {item.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="resume-section" id="work">
        <div className="resume-section__header">
          <p className="resume-kicker">Selected work</p>
          <h2>Portfolio projects built around finance, data, and frontier research.</h2>
        </div>
        <div className="project-grid">
          {resumeProjects.map((project) => (
            <article className="project-card" key={project.name}>
              <div className="project-card__top">
                <span>{project.type}</span>
                <Layers3 size={18} />
              </div>
              <h3>{project.name}</h3>
              <p>{project.impact}</p>
              <ul>
                {project.tools.map((tool) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="resume-section resume-principles">
        <div className="resume-section__header">
          <p className="resume-kicker">Operating style</p>
          <h2>How I work</h2>
        </div>
        <div className="principle-grid">
          {resumePrinciples.map((principle) => (
            <article className="principle-card" key={principle.title}>
              <h3>{principle.title}</h3>
              <p>{principle.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="resume-cta" aria-label="Resume call to action">
        <div>
          <p className="resume-kicker">Next step</p>
          <h2>Use this page as the living resume.</h2>
          <p>
            The content is structured so contact links, employment history, metrics, and a downloadable
            PDF endpoint can be added cleanly when those details are ready.
          </p>
        </div>
        <button className="resume-print-button" onClick={handlePrint} type="button">
          <Download size={16} />
          Print resume
        </button>
      </section>
    </main>
  );
}
