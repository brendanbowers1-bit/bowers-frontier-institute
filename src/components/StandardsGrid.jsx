import { standards } from "@/data/standards";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "./SectionHeading";
import { StandardsChart } from "./StandardsChart";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

const TIER_LABEL = {
  foundation: "Foundation",
  governance: "Governance",
  operations: "Operations",
};

export function StandardsGrid() {
  return (
    <section
      id="standards"
      className="border-y border-[var(--color-border)] bg-[var(--color-black)] py-20 sm:py-28"
      aria-labelledby="standards-title"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_280px] lg:items-start">
          <SectionHeading
            label="Research standards"
            title="Built for adversarial review."
            lead="Explicit standards govern every BFI system — from data lineage to human approval for high-risk claims."
          />
          <Reveal className="hidden lg:block">
            <div className="border border-[var(--color-border)] bg-[rgba(24,24,28,0.5)] p-5">
              <StandardsChart />
            </div>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-px border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2">
          {standards.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.03}>
              <article
                className={cn(
                  "flex gap-4 bg-[var(--color-graphite)] p-6 transition-colors hover:bg-[var(--color-graphite-raised)]",
                )}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[var(--color-accent)] opacity-70"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-medium text-[var(--color-ivory)]">
                      {item.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className="rounded-sm border-[var(--color-border-strong)] font-mono-label text-[var(--color-steel)]"
                    >
                      {TIER_LABEL[item.tier]}
                    </Badge>
                  </div>
                  <p className="text-sm font-light leading-relaxed text-[var(--color-steel-light)]">
                    {item.detail}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 lg:hidden">
          <div className="border border-[var(--color-border)] bg-[rgba(24,24,28,0.5)] p-5">
            <StandardsChart />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
