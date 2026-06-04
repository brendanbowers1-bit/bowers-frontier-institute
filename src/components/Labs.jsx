const LABS = [
  { index: "01", id: "AI", name: "BFI AI Lab", focus: "Intelligence systems & evaluation" },
  { index: "02", id: "T1D", name: "BFI T1D Lab", focus: "Diabetes research infrastructure" },
  { index: "03", id: "QNT", name: "BFI Quantum Lab", focus: "Scientific computing experiments" },
  { index: "04", id: "BR3N", name: "BR3N Creative", focus: "Visual systems & research design" },
];

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
            Four focused labs. Each maintains its own methods, datasets, and review standards.
          </p>
        </header>
        <ol className="lab-index">
          {LABS.map((lab) => (
            <li key={lab.id}>
              <article className="lab-index__card">
                <div className="lab-index__meta">
                  <span className="lab-index__num">{lab.index}</span>
                  <span className="lab-index__id">{lab.id}</span>
                </div>
                <h3 className="lab-index__name">{lab.name}</h3>
                <p className="lab-index__focus">{lab.focus}</p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
