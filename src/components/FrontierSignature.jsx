/** Subtle research grid + frontier nodes — visual signature only */
export function FrontierSignature() {
  return (
    <div className="frontier-signature" aria-hidden="true">
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="research-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M32 0H0V32"
              stroke="rgba(232,228,220,0.04)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#research-grid)" />
        <circle cx="200" cy="200" r="120" stroke="rgba(154,143,110,0.12)" strokeWidth="0.5" />
        <circle cx="200" cy="200" r="80" stroke="rgba(232,228,220,0.05)" strokeWidth="0.5" strokeDasharray="4 6" />
        <g className="frontier-signature__lines">
          <line x1="200" y1="80" x2="200" y2="140" stroke="rgba(232,228,220,0.15)" strokeWidth="0.5" />
          <line x1="200" y1="260" x2="200" y2="320" stroke="rgba(232,228,220,0.15)" strokeWidth="0.5" />
          <line x1="80" y1="200" x2="140" y2="200" stroke="rgba(232,228,220,0.15)" strokeWidth="0.5" />
          <line x1="260" y1="200" x2="320" y2="200" stroke="rgba(232,228,220,0.15)" strokeWidth="0.5" />
          <line x1="115" y1="115" x2="155" y2="155" stroke="rgba(154,143,110,0.2)" strokeWidth="0.5" />
          <line x1="285" y1="115" x2="245" y2="155" stroke="rgba(154,143,110,0.2)" strokeWidth="0.5" />
          <line x1="115" y1="285" x2="155" y2="245" stroke="rgba(154,143,110,0.2)" strokeWidth="0.5" />
          <line x1="285" y1="285" x2="245" y2="245" stroke="rgba(154,143,110,0.2)" strokeWidth="0.5" />
        </g>
        <circle cx="200" cy="80" r="3" fill="#9a8f6e" opacity="0.7" />
        <circle cx="200" cy="320" r="3" fill="rgba(232,228,220,0.35)" />
        <circle cx="80" cy="200" r="3" fill="rgba(232,228,220,0.35)" />
        <circle cx="320" cy="200" r="3" fill="rgba(232,228,220,0.35)" />
        <circle cx="200" cy="200" r="4" fill="#9a8f6e" opacity="0.9" />
        <path
          className="frontier-signature__pulse"
          d="M155 155 L200 140 L245 155 L260 200 L245 245 L200 260 L155 245 L140 200 Z"
          stroke="rgba(154,143,110,0.25)"
          strokeWidth="0.5"
          fill="none"
        />
      </svg>
    </div>
  );
}
