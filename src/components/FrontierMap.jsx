import { cn } from "@/lib/utils";

const NODES = [
  { id: "ai", label: "AI Lab", x: 50, y: 18, accent: true },
  { id: "standards", label: "Data Standards", x: 82, y: 38 },
  { id: "quantum", label: "Quantum Lab", x: 72, y: 72, accent: true },
  { id: "t1d", label: "T1D Lab", x: 28, y: 68 },
  { id: "macro", label: "Macro Lab", x: 18, y: 38 },
  { id: "br3n", label: "BR3N Creative", x: 50, y: 88, creative: true },
];

const EDGES = [
  ["ai", "standards"],
  ["ai", "macro"],
  ["standards", "quantum"],
  ["quantum", "t1d"],
  ["t1d", "macro"],
  ["macro", "br3n"],
  ["ai", "br3n"],
  ["standards", "t1d"],
];

export function FrontierMap({ className }) {
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("h-full w-full", className)}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="map-glow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="rgba(74,127,168,0.08)" />
          <stop offset="100%" stopColor="rgba(74,127,168,0)" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#map-glow)" />
      {EDGES.map(([a, b]) => {
        const na = byId[a];
        const nb = byId[b];
        return (
          <line
            key={`${a}-${b}`}
            x1={na.x}
            y1={na.y}
            x2={nb.x}
            y2={nb.y}
            stroke="rgba(235,230,220,0.12)"
            strokeWidth="0.35"
          />
        );
      })}
      {NODES.map((node) => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r="2.2"
            fill={
              node.accent
                ? "#4a7fa8"
                : node.creative
                  ? "#9a8f6e"
                  : "rgba(235,230,220,0.5)"
            }
            opacity={node.accent ? 0.9 : 0.7}
          />
          <text
            x={node.x}
            y={node.y + 5.5}
            textAnchor="middle"
            fill={node.creative ? "#9a8f6e" : "#8e939c"}
            fontSize="3.2"
            fontFamily="IBM Plex Sans, system-ui, sans-serif"
            letterSpacing="0.02em"
          >
            {node.label}
          </text>
        </g>
      ))}
      <circle
        cx="50"
        cy="48"
        r="14"
        fill="none"
        stroke="rgba(154,143,110,0.15)"
        strokeWidth="0.25"
        strokeDasharray="1.5 2"
      />
    </svg>
  );
}
