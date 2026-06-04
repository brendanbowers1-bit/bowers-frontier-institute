import { visualSystems } from "@/data/visualSystems";
import { SectionHeading } from "./SectionHeading";
import { VisualTile } from "./VisualTile";
import { Reveal } from "./Reveal";

export function VisualSystems() {
  return (
    <section
      id="visuals"
      className="border-y border-[var(--color-border)] bg-[var(--color-black)] py-20 sm:py-28"
      aria-labelledby="visuals-title"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          label="Visual systems"
          title="Visual architecture for complex ideas."
          lead="The institute translates complex technical systems into diagrams, dashboards, research maps, and decision visuals."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visualSystems.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.04}>
              <VisualTile item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
