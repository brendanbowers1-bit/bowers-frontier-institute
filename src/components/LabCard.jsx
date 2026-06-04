import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export function LabCard({ lab, index = 0 }) {
  return (
    <Reveal delay={index * 0.05}>
      <article
        className={cn(
          "group flex h-full min-h-[14rem] flex-col border border-[var(--color-border)] bg-[rgba(24,24,28,0.65)] p-6 backdrop-blur-sm transition-all duration-300",
          "hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[0_0_0_1px_rgba(74,127,168,0.08),0_16px_48px_rgba(0,0,0,0.4)]",
          lab.accent && "border-t-[rgba(74,127,168,0.35)]",
          lab.creative && "border-t-[var(--color-gold-muted)]",
        )}
      >
        <span
          className={cn(
            "font-mono-label text-[var(--color-steel)]",
            lab.accent && "text-[var(--color-accent)]",
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="font-display mt-3 text-2xl font-medium text-[var(--color-ivory)]">
          {lab.name}
        </h3>
        <p className="mt-auto pt-4 text-sm font-light leading-relaxed text-[var(--color-steel-light)]">
          {lab.description}
        </p>
      </article>
    </Reveal>
  );
}
