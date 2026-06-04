import { useReveal } from "../hooks/useReveal";
import "./ResearchStandards.css";

const STANDARDS = [
  {
    title: "Data provenance",
    detail: "Lineage tracking from source ingestion through transformation and publication.",
  },
  {
    title: "FAIR / CARE principles",
    detail: "Findable, accessible, interoperable, reusable data with collective benefit safeguards.",
  },
  {
    title: "Model validation",
    detail: "Held-out evaluation, stress scenarios, and domain-specific performance benchmarks.",
  },
  {
    title: "Reproducibility",
    detail: "Versioned datasets, documented pipelines, and reproducible experiment manifests.",
  },
  {
    title: "Bias review",
    detail: "Structured audits across demographic, geographic, and temporal representation.",
  },
  {
    title: "Audit trails",
    detail: "Immutable logs for model decisions, data access, and governance actions.",
  },
];

export function ResearchStandards() {
  const headerRef = useReveal();

  return (
    <section
      id="standards"
      className="section standards"
      aria-labelledby="standards-title"
    >
      <div className="container">
        <div ref={headerRef} className="reveal standards__header">
          <p className="section-label">Research standards</p>
          <h2 id="standards-title" className="section-title">
            Governance by design
          </h2>
          <p className="section-lead">
            Every BFI system is built on explicit standards — not as compliance
            theater, but as the foundation for trustworthy intelligence.
          </p>
        </div>

        <ol className="standards__list">
          {STANDARDS.map((item, i) => (
            <StandardItem key={item.title} item={item} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function StandardItem({ item, index }) {
  const ref = useReveal(0.1);

  return (
    <li ref={ref} className="standard-item reveal" style={{ transitionDelay: `${index * 50}ms` }}>
      <span className="standard-item__marker" aria-hidden="true" />
      <div>
        <h3 className="standard-item__title">{item.title}</h3>
        <p className="standard-item__detail">{item.detail}</p>
      </div>
    </li>
  );
}
