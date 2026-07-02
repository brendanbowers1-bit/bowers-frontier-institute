import { labs } from "../data/labs";

const labCode = (id) => id.toUpperCase();
const labIndex = (index) => String(index + 1).padStart(2, "0");

export function Labs() {
  return (
    <section id="labs" className="section section--labs" aria-labelledby="labs-title">
      <div className="container">
        <header className="section-header">
          <p className="section-label">Laboratories</p>
          <h2 id="labs-title" className="section-title">
            Research index
          </h2>
          <p className="section-lead">
            Six focused labs. Each maintains its own methods, datasets, and review standards.
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
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
