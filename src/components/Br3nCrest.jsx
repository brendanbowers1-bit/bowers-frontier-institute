export function Br3nCrest({ compact = false }) {
  return (
    <div className={compact ? "br3n-crest br3n-crest--compact" : "br3n-crest"} aria-label="BR3N Macro Labs">
      <svg viewBox="0 0 220 260" role="img">
        <title>BR3N Macro Labs crest</title>
        <path
          className="crest-shield"
          d="M110 10 C137 27 163 37 195 45 L195 132 C195 181 160 220 110 246 C60 220 25 181 25 132 L25 45 C57 37 83 27 110 10 Z"
        />
        <path className="crest-line" d="M110 24 L110 226" />
        <path className="crest-line" d="M42 92 L178 92" />
        <path className="crest-line" d="M42 146 L178 146" />
        <path className="crest-mountain" d="M34 184 L72 156 L105 178 L139 132 L188 184" />
        <path className="crest-chart" d="M43 142 L70 126 L95 115 L123 98" />
        <circle className="crest-dot" cx="70" cy="126" r="4" />
        <circle className="crest-dot" cx="95" cy="115" r="4" />
        <circle className="crest-dot" cx="123" cy="98" r="4" />
        <path className="crest-bell" d="M125 184 C137 130 162 130 175 184" />
        <path className="crest-bell-axis" d="M151 128 L151 201" />
        <path className="crest-globe" d="M125 42 C156 46 176 63 183 91" />
        <path className="crest-globe" d="M130 62 C152 66 168 76 180 91" />
        <path className="crest-globe" d="M151 42 C145 62 145 78 151 92" />
        <text className="crest-letter" x="63" y="78">B</text>
        <text className="crest-letter" x="139" y="130">R</text>
        <text className="crest-number" x="91" y="208">3</text>
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
