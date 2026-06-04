import { useReveal } from "../hooks/useReveal";
import "./Mission.css";

export function Mission() {
  const ref = useReveal();

  return (
    <section id="mission" className="section mission" aria-labelledby="mission-title">
      <div className="container">
        <div ref={ref} className="mission__inner reveal">
          <span className="accent-line" aria-hidden="true" />
          <p className="section-label">Mission</p>
          <blockquote id="mission-title" className="mission__quote">
            We build research-grade intelligence systems where data quality,
            model validation, and decision architecture matter.
          </blockquote>
          <p className="mission__support">
            An independent institute advancing AI-enabled systems across
            finance, health, science, data standards, and frontier technology —
            with the rigor institutions demand and the clarity researchers
            require.
          </p>
        </div>
      </div>
    </section>
  );
}
