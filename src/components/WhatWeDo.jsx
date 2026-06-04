const ITEMS = [
  {
    title: "AI Systems",
    text: "Research-grade workflows, model evaluation, and intelligence tools.",
  },
  {
    title: "Data Standards",
    text: "Provenance, validation, reproducibility, and audit-ready datasets.",
  },
  {
    title: "Research Infrastructure",
    text: "Structured systems for frontier work in finance, health, science, and creative technology.",
  },
];

export function WhatWeDo() {
  return (
    <section id="institute" className="section" aria-labelledby="institute-title">
      <div className="container">
        <header className="section-header">
          <p className="section-label">Institute</p>
          <h2 id="institute-title" className="section-title">
            What we build
          </h2>
          <p className="section-lead">
            Systems where data quality, validation, and decision architecture are
            designed in — not added later.
          </p>
        </header>
        <ul className="capability-grid">
          {ITEMS.map((item, i) => (
            <li key={item.title}>
              <article className="capability-card">
                <span className="capability-card__index" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="capability-card__title">{item.title}</h3>
                <p className="capability-card__text">{item.text}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
