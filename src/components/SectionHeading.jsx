import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export function SectionHeading({
  label,
  title,
  lead,
  className,
  align = "left",
}) {
  return (
    <Reveal
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {label && (
        <p className="font-mono-label mb-4 text-[var(--color-gold)]">{label}</p>
      )}
      {title && (
        <h2 className="font-display text-balance text-3xl font-medium tracking-tight text-[var(--color-ivory)] sm:text-4xl md:text-[2.75rem] md:leading-[1.12]">
          {title}
        </h2>
      )}
      {lead && (
        <p className="mt-5 text-base font-light leading-relaxed text-[var(--color-steel-light)] sm:text-lg">
          {lead}
        </p>
      )}
    </Reveal>
  );
}
