import { featuredWork } from "@/data/featuredWork";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

const STATUS_STYLE = {
  draft: "text-[var(--color-steel)]",
  prototype: "text-[var(--color-accent)]",
  "research map": "text-[var(--color-gold)]",
  architecture: "text-[var(--color-ivory-muted)]",
};

export function FeaturedWork() {
  return (
    <section id="work" className="py-20 sm:py-28" aria-labelledby="work-title">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          label="Featured work"
          title="Selected research"
          lead="Current and in-progress initiatives. Overview links are disabled until dedicated pages exist."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredWork.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.05}>
              <article
                className={cn(
                  "flex h-full flex-col border border-[var(--color-border)] bg-[rgba(24,24,28,0.65)] p-6 transition-all duration-300",
                  "hover:-translate-y-0.5 hover:border-[var(--color-border-strong)]",
                  item.accent && "border-[rgba(74,127,168,0.18)]",
                  item.creative && "border-t-[var(--color-gold-muted)]",
                )}
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-sm border-[var(--color-border-strong)] font-mono-label text-[var(--color-gold)]"
                  >
                    {item.domain}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-sm bg-transparent font-mono-label",
                      STATUS_STYLE[item.status] ?? STATUS_STYLE.draft,
                    )}
                  >
                    {item.status}
                  </Badge>
                </div>
                <h3 className="font-display text-xl font-medium leading-snug text-[var(--color-ivory)]">
                  {item.title}
                </h3>
                <p className="mt-3 flex-1 text-sm font-light leading-relaxed text-[var(--color-steel-light)]">
                  {item.description}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="mt-5 w-fit px-0 font-mono-label text-[var(--color-steel)]"
                  title="Overview page not yet available"
                >
                  Overview — coming soon
                </Button>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
