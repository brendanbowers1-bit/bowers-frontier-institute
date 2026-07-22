import { useId } from "react";

export function Br3nRibbonMark({ compact = false }) {
  const edgeId = useId();
  const coreId = useId();
  const glowId = useId();
  const shadowId = useId();

  return (
    <div
      aria-label="BR3N metallic ribbon mark"
      className={compact ? "br3n-ribbon br3n-ribbon--compact" : "br3n-ribbon"}
    >
      <svg viewBox="0 0 260 320" role="img">
        <title>BR3N metallic ribbon loop mark</title>
        <defs>
          <linearGradient id={edgeId} x1="34" x2="226" y1="48" y2="270">
            <stop offset="0%" stopColor="#f4eee6" stopOpacity="0.92" />
            <stop offset="20%" stopColor="#edc2a8" stopOpacity="0.9" />
            <stop offset="48%" stopColor="#17120f" />
            <stop offset="72%" stopColor="#7c5f4d" />
            <stop offset="100%" stopColor="#fff4e8" stopOpacity="0.78" />
          </linearGradient>
          <linearGradient id={coreId} x1="38" x2="216" y1="66" y2="244">
            <stop offset="0%" stopColor="#2a211c" />
            <stop offset="32%" stopColor="#6f5648" />
            <stop offset="55%" stopColor="#100d0b" />
            <stop offset="78%" stopColor="#edc2a8" />
            <stop offset="100%" stopColor="#17120f" />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="48%" r="54%">
            <stop offset="0%" stopColor="#edc2a8" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#7c5f4d" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#17120f" stopOpacity="0" />
          </radialGradient>
          <filter id={shadowId} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="22" stdDeviation="18" floodColor="#120905" floodOpacity="0.68" />
          </filter>
        </defs>
        <ellipse className="ribbon-aura" cx="130" cy="164" rx="112" ry="128" fill={`url(#${glowId})`} />
        <path className="ribbon-frame" d="M83 64 L130 38 L177 64" />
        <path className="ribbon-frame ribbon-frame--side" d="M86 70 L86 249 M174 70 L174 249" />
        <path
          className="ribbon-back"
          style={{ stroke: `url(#${coreId})`, filter: `url(#${shadowId})` }}
          d="M67 73 C105 30 190 45 199 102 C206 149 152 176 103 168 C62 161 51 211 91 239 C128 265 191 245 197 196"
        />
        <path
          className="ribbon-front"
          style={{ stroke: `url(#${edgeId})`, filter: `url(#${shadowId})` }}
          d="M193 103 C169 73 121 70 91 96 C58 124 62 165 103 184 C143 202 193 198 206 236 C218 273 157 295 100 264"
        />
        <path
          className="ribbon-cut"
          d="M83 112 C119 132 156 147 190 181"
        />
        <path
          className="ribbon-highlight"
          d="M78 78 C110 50 174 53 190 96"
        />
        <path
          className="ribbon-highlight ribbon-highlight--low"
          d="M91 239 C126 263 176 249 193 211"
        />
        <path className="ribbon-horizon" d="M70 226 C96 211 116 207 130 207 C144 207 164 211 190 226" />
        <text className="ribbon-word" x="130" y="288">BFI</text>
      </svg>
    </div>
  );
}
