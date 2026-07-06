import { labs } from "../data/labs";

const labCode = (id) => id.toUpperCase();
const labIndex = (index) => String(index + 1).padStart(2, "0");

export function Labs() {
  return (
    <section id="labs" className="section section--labs" aria-labelledby="labs-title">
      <div className="container">
        <header className="section-header">
          <p className="section-label">Verticals</p>
          <h2 id="labs-title" className="section-title">
            Three operating verticals
          </h2>
          <p className="section-lead">
            Every BFI project, repo, dataset, and report belongs under BFI AI Finance,
            BFI T1D, or BR3N Creative.
          </p>
        </header>
        <ol className="lab-index">
          {labs.map((lab, index) => (
            <li key={lab.id}>
              <article
                className={[
                  "lab-index__card",
                  lab.accent ? "lab-index__card--accent" : "",
                  lab.creative ? "lab-index__card--creative" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="lab-index__meta">
                  <span className="lab-index__num">{labIndex(index)}</span>
                  <span className="lab-index__id">{labCode(lab.id)}</span>
                </div>
                <h3 className="lab-index__name">{lab.name}</h3>
                <p className="lab-index__focus">{lab.description}</p>
                {lab.focusAreas?.length > 0 && (
                  <ul className="lab-index__tags" aria-label={`${lab.name} focus areas`}>
                    {lab.focusAreas.map((focusArea) => (
                      <li key={focusArea}>{focusArea}</li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
