import { useId } from "react";

export function Br3nCrest({ compact = false }) {
  const gradientId = useId();
  const glowId = useId();

  return (
    <div className={compact ? "br3n-crest br3n-crest--compact" : "br3n-crest"} aria-label="BR3N Macro Labs">
      <svg viewBox="0 0 220 260" role="img">
        <title>BR3N Macro Labs frontier aperture crest</title>
        <defs>
          <linearGradient id={gradientId} x1="38" x2="182" y1="20" y2="238" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff4e8" />
            <stop offset="38%" stopColor="#d8ad91" />
            <stop offset="74%" stopColor="#6f5648" />
            <stop offset="100%" stopColor="#f5eee5" />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#edc2a8" stopOpacity="0.32" />
            <stop offset="58%" stopColor="#7c5f4d" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#17120f" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse className="crest-aura" cx="110" cy="128" rx="88" ry="112" fill={`url(#${glowId})`} />
        <path
          className="crest-shield"
          d="M110 14 C137 30 164 39 190 47 L190 130 C190 179 158 219 110 244 C62 219 30 179 30 130 L30 47 C56 39 83 30 110 14 Z"
        />
        <path className="crest-aperture" d="M69 63 L110 39 L151 63" />
        <path className="crest-column crest-column--left" d="M72 68 L72 187" />
        <path className="crest-column crest-column--right" d="M148 68 L148 187" />
        <path className="crest-centerline" d="M110 76 L110 176" />
        <path className="crest-horizon" d="M53 178 C75 167 94 164 110 164 C126 164 145 167 167 178" />
        <path className="crest-orbit" d="M55 111 C76 96 96 89 116 91 C134 93 150 102 166 119" />
        <path className="crest-orbit crest-orbit--low" d="M57 136 C82 127 105 125 126 131 C143 136 157 146 171 161" />
        <circle className="crest-point" cx="110" cy="164" r="4.4" />
        <circle className="crest-point crest-point--small" cx="72" cy="187" r="3.2" />
        <circle className="crest-point crest-point--small" cx="148" cy="187" r="3.2" />
        <text className="crest-monogram" x="110" y="225">BR3N</text>
        <rect className="crest-baseline" x="66" y="233" width="88" height="1.5" rx="0.75" fill={`url(#${gradientId})`} />
      </svg>
      {!compact && (
        <div className="br3n-crest-lockup">
          <strong>BR3N</strong>
          <span>Macro Labs</span>
          <em>Research · Regime · Risk</em>
        </div>
      )}
    </div>
  );
}
