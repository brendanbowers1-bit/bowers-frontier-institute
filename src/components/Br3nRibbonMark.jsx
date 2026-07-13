export function Br3nRibbonMark({ compact = false }) {
  return (
    <div
      aria-label="BR3N metallic ribbon mark"
      className={compact ? "br3n-ribbon br3n-ribbon--compact" : "br3n-ribbon"}
    >
      <svg viewBox="0 0 260 320" role="img">
        <title>BR3N metallic ribbon loop mark</title>
        <defs>
          <linearGradient id="ribbonEdge" x1="34" x2="226" y1="48" y2="270">
            <stop offset="0%" stopColor="#f4eee6" stopOpacity="0.92" />
            <stop offset="18%" stopColor="#5b5450" stopOpacity="0.86" />
            <stop offset="45%" stopColor="#0b0b0c" />
            <stop offset="72%" stopColor="#211d1b" />
            <stop offset="100%" stopColor="#d6c4b4" stopOpacity="0.72" />
          </linearGradient>
          <linearGradient id="ribbonCore" x1="38" x2="216" y1="66" y2="244">
            <stop offset="0%" stopColor="#0a0a0b" />
            <stop offset="32%" stopColor="#2c2826" />
            <stop offset="55%" stopColor="#070708" />
            <stop offset="78%" stopColor="#74675d" />
            <stop offset="100%" stopColor="#151313" />
          </linearGradient>
          <radialGradient id="ribbonGlow" cx="50%" cy="48%" r="54%">
            <stop offset="0%" stopColor="#f3d5bd" stopOpacity="0.26" />
            <stop offset="55%" stopColor="#8b6d5b" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <filter id="ribbonShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="22" stdDeviation="18" floodColor="#000" floodOpacity="0.72" />
          </filter>
        </defs>
        <ellipse className="ribbon-aura" cx="130" cy="164" rx="112" ry="128" />
        <path
          className="ribbon-back"
          d="M67 73 C105 30 190 45 199 102 C206 149 152 176 103 168 C62 161 51 211 91 239 C128 265 191 245 197 196"
        />
        <path
          className="ribbon-front"
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
      </svg>
    </div>
  );
}
