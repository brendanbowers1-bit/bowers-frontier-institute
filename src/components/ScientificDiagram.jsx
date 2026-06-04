export function HeroDiagram() {
  return (
    <svg
      className="hero-diagram"
      viewBox="0 0 480 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="grid-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(74,127,168,0.12)" />
          <stop offset="100%" stopColor="rgba(74,127,168,0)" />
        </linearGradient>
      </defs>
      {[60, 120, 180, 240, 300, 360].map((y) => (
        <line
          key={`h-${y}`}
          x1="40"
          y1={y * 0.9}
          x2="440"
          y2={y * 0.9}
          stroke="rgba(232,228,220,0.04)"
          strokeWidth="1"
        />
      ))}
      {[80, 160, 240, 320, 400].map((x) => (
        <line
          key={`v-${x}`}
          x1={x}
          y1="32"
          x2={x}
          y2="328"
          stroke="rgba(232,228,220,0.04)"
          strokeWidth="1"
        />
      ))}
      <rect x="40" y="32" width="400" height="296" fill="url(#grid-fade)" />
      <circle cx="120" cy="140" r="4" fill="#4a7fa8" opacity="0.9" />
      <circle cx="200" cy="100" r="4" fill="#9a8f6e" opacity="0.8" />
      <circle cx="280" cy="180" r="4" fill="#4a7fa8" opacity="0.7" />
      <circle cx="360" cy="120" r="4" fill="#e8e4dc" opacity="0.5" />
      <circle cx="320" cy="240" r="4" fill="#4a7fa8" opacity="0.6" />
      <circle cx="160" cy="260" r="4" fill="#9a8f6e" opacity="0.6" />
      <path
        d="M120 140 L200 100 L280 180 L360 120"
        stroke="rgba(74,127,168,0.35)"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
      <path
        d="M200 100 L160 260 L320 240 L280 180"
        stroke="rgba(154,143,110,0.25)"
        strokeWidth="1"
      />
      <path
        d="M360 120 L320 240"
        stroke="rgba(232,228,220,0.12)"
        strokeWidth="1"
      />
      <rect
        x="72"
        y="288"
        width="120"
        height="28"
        stroke="rgba(232,228,220,0.1)"
        strokeWidth="1"
        fill="rgba(22,22,24,0.6)"
      />
      <text x="84" y="306" fill="#8a8f98" fontSize="10" fontFamily="system-ui">
        signal → model
      </text>
      <rect
        x="288"
        y="288"
        width="120"
        height="28"
        stroke="rgba(74,127,168,0.2)"
        strokeWidth="1"
        fill="rgba(74,127,168,0.06)"
      />
      <text x="300" y="306" fill="#4a7fa8" fontSize="10" fontFamily="system-ui">
        validation
      </text>
    </svg>
  );
}

export function MiniDiagram({ variant = "network" }) {
  if (variant === "dashboard") {
    return (
      <svg viewBox="0 0 200 120" fill="none" aria-hidden="true">
        <rect x="8" y="8" width="184" height="104" stroke="rgba(232,228,220,0.08)" strokeWidth="1" />
        <rect x="16" y="72" width="24" height="32" fill="rgba(154,143,110,0.2)" />
        <rect x="44" y="56" width="24" height="48" fill="rgba(74,127,168,0.25)" />
        <rect x="72" y="40" width="24" height="64" fill="rgba(74,127,168,0.15)" />
        <rect x="100" y="64" width="24" height="40" fill="rgba(154,143,110,0.15)" />
        <path d="M128 88 L180 32" stroke="rgba(74,127,168,0.4)" strokeWidth="1" />
        <circle cx="180" cy="32" r="3" fill="#4a7fa8" />
      </svg>
    );
  }

  if (variant === "map") {
    return (
      <svg viewBox="0 0 200 120" fill="none" aria-hidden="true">
        <path
          d="M20 60 Q60 20 100 50 T180 60"
          stroke="rgba(74,127,168,0.35)"
          strokeWidth="1"
          fill="none"
        />
        <circle cx="40" cy="48" r="5" stroke="#9a8f6e" strokeWidth="1" fill="rgba(154,143,110,0.1)" />
        <circle cx="100" cy="52" r="5" stroke="#4a7fa8" strokeWidth="1" fill="rgba(74,127,168,0.1)" />
        <circle cx="160" cy="58" r="5" stroke="#e8e4dc" strokeWidth="1" fill="none" opacity="0.5" />
        <line x1="40" y1="48" x2="100" y2="52" stroke="rgba(232,228,220,0.1)" strokeWidth="1" />
        <line x1="100" y1="52" x2="160" y2="58" stroke="rgba(232,228,220,0.1)" strokeWidth="1" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 200 120" fill="none" aria-hidden="true">
      <circle cx="40" cy="60" r="6" fill="rgba(154,143,110,0.3)" stroke="#9a8f6e" />
      <circle cx="100" cy="30" r="6" fill="rgba(74,127,168,0.2)" stroke="#4a7fa8" />
      <circle cx="160" cy="70" r="6" fill="none" stroke="rgba(232,228,220,0.3)" />
      <path d="M40 60 L100 30 L160 70" stroke="rgba(74,127,168,0.3)" strokeWidth="1" />
      <path d="M100 30 L100 90" stroke="rgba(232,228,220,0.08)" strokeWidth="1" strokeDasharray="3 4" />
      <circle cx="100" cy="90" r="4" fill="#4a7fa8" opacity="0.5" />
    </svg>
  );
}
