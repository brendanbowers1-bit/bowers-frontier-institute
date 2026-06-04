import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

const PRINCIPLES = [
  {
    title: "Data before models",
    detail: "Provenance, schema discipline, and lineage precede any model deployment.",
  },
  {
    title: "Validation before claims",
    detail: "Benchmarks, baselines, and adversarial review gate every assertion.",
  },
  {
    title: "Systems before hype",
    detail: "Decision architecture and reproducibility over novelty narratives.",
  },
];

export function InstituteThesis() {
  return (
    <section
      id="institute"
      className="border-y border-[var(--color-border)] bg-[var(--color-black)] py-20 sm:py-28"
      aria-labelledby="institute-title"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          label="Institute"
          title="An institute for complex systems."
          lead="Bowers Frontier Institute develops research-grade intelligence systems across AI, finance, health, science, and creative technology. The work emphasizes data provenance, reproducibility, validation, and disciplined decision architecture."
        />

        <ul className="mt-14 grid gap-4 sm:grid-cols-3">
          {PRINCIPLES.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.06}>
              <li
                className={cn(
                  "group h-full border border-[var(--color-border)] bg-[rgba(24,24,28,0.6)] p-6 transition-all duration-300",
                  "hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
                )}
              >
                <span className="mb-4 block h-px w-8 bg-gradient-to-r from-[var(--color-gold-muted)] to-[var(--color-accent)]" />
                <h3 className="font-display text-xl font-medium text-[var(--color-ivory)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-[var(--color-steel-light)]">
                  {item.detail}
                </p>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
