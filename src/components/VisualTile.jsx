import { cn } from "@/lib/utils";

function FlowDiagram() {
  return (
    <svg viewBox="0 0 200 100" className="h-full w-full max-w-[12rem]" aria-hidden="true">
      <rect x="10" y="35" width="40" height="30" fill="none" stroke="rgba(235,230,220,0.15)" />
      <rect x="80" y="20" width="40" height="30" fill="rgba(74,127,168,0.1)" stroke="rgba(74,127,168,0.3)" />
      <rect x="80" y="55" width="40" height="30" fill="none" stroke="rgba(154,143,110,0.25)" />
      <rect x="150" y="35" width="40" height="30" fill="none" stroke="rgba(235,230,220,0.12)" />
      <path d="M50 50 H80 M120 35 H150 M120 70 H150" stroke="rgba(235,230,220,0.12)" />
    </svg>
  );
}

function StackDiagram() {
  return (
    <svg viewBox="0 0 200 100" className="h-full w-full max-w-[12rem]" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={40 + i * 8}
          y={20 + i * 14}
          width="120"
          height="18"
          fill={i === 2 ? "rgba(74,127,168,0.15)" : "rgba(24,24,28,0.8)"}
          stroke={i === 2 ? "rgba(74,127,168,0.35)" : "rgba(235,230,220,0.08)"}
        />
      ))}
    </svg>
  );
}

function MapDiagram() {
  return (
    <svg viewBox="0 0 200 100" className="h-full w-full max-w-[12rem]" aria-hidden="true">
      <path d="M20 55 Q70 25 120 48 T180 52" fill="none" stroke="rgba(74,127,168,0.35)" />
      <circle cx="40" cy="42" r="5" fill="none" stroke="#9a8f6e" />
      <circle cx="100" cy="50" r="5" fill="rgba(74,127,168,0.15)" stroke="#4a7fa8" />
      <circle cx="160" cy="54" r="5" fill="none" stroke="rgba(235,230,220,0.3)" />
    </svg>
  );
}

function PipelineDiagram() {
  return (
    <svg viewBox="0 0 200 100" className="h-full w-full max-w-[12rem]" aria-hidden="true">
      {[30, 70, 110, 150].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="50" r="8" fill={i === 2 ? "rgba(74,127,168,0.2)" : "none"} stroke="rgba(235,230,220,0.2)" />
          {i < 3 && <line x1={x + 8} y1="50" x2={x + 32} y2="50" stroke="rgba(235,230,220,0.1)" />}
        </g>
      ))}
    </svg>
  );
}

const DIAGRAMS = {
  flow: FlowDiagram,
  stack: StackDiagram,
  map: MapDiagram,
  pipeline: PipelineDiagram,
};

export function VisualTile({ item }) {
  const Diagram = DIAGRAMS[item.variant] ?? FlowDiagram;

  return (
    <article
      className={cn(
        "overflow-hidden border border-[var(--color-border)] bg-[rgba(24,24,28,0.6)] transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-[var(--color-border-strong)]",
        item.accent && "hover:shadow-[0_0_24px_rgba(74,127,168,0.06)]",
      )}
    >
      <div
        className={cn(
          "flex min-h-[9rem] items-center justify-center border-b border-[var(--color-border)] bg-[var(--color-void)] p-5",
          item.accent && "bg-gradient-to-b from-[rgba(74,127,168,0.06)] to-[var(--color-void)]",
        )}
      >
        <Diagram />
      </div>
      <div className="p-5">
        <p
          className={cn(
            "font-mono-label text-[var(--color-steel)]",
            item.accent && "text-[var(--color-accent)]",
          )}
        >
          {item.type}
        </p>
        <h3 className="font-display mt-1 text-lg font-medium text-[var(--color-ivory)]">
          {item.title}
        </h3>
        <p className="mt-2 text-xs text-[var(--color-steel)]">Placeholder visual</p>
      </div>
    </article>
  );
}
