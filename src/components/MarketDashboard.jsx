import {
  assetReadings,
  dashboardMetrics,
  intelligenceQueue,
  regimeSignals,
  sparklinePoints,
} from "../data/marketDashboard";

const sparklineGeometry = (points) => {
  const width = 520;
  const height = 160;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const step = width / (points.length - 1);
  const range = max - min || 1;
  const coordinates = points.map((point, index) => ({
    x: Math.round(index * step),
    y: Math.round(height - ((point - min) / range) * height),
  }));

  return {
    path: coordinates
      .map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
      .join(" "),
    terminal: coordinates.at(-1),
  };
};

export function MarketDashboard() {
  const { path, terminal } = sparklineGeometry(sparklinePoints);

  return (
    <section
      id="dashboard"
      className="section section--dashboard"
      aria-labelledby="dashboard-title"
    >
      <div className="container">
        <header className="dashboard-hero">
          <div>
            <p className="section-label">Live intelligence concept</p>
            <h2 id="dashboard-title" className="section-title dashboard-hero__title">
              One screen. Clear signal. No noise.
            </h2>
          </div>
          <p className="dashboard-hero__verdict">
            Today&apos;s read: constructive risk appetite with rate pressure still
            defining the edge of the map.
          </p>
        </header>

        <div className="dashboard-shell" aria-label="BFI market pulse dashboard preview">
          <div className="dashboard-topline">
            <div>
              <p className="dashboard-kicker">BFI Market Pulse</p>
              <h3>Executive cockpit</h3>
            </div>
            <div className="dashboard-status" aria-label="System status ready">
              <span aria-hidden="true" />
              Ready for review
            </div>
          </div>

          <div className="metric-strip">
            {dashboardMetrics.map((metric) => (
              <article
                key={metric.label}
                className={`metric-card metric-card--${metric.tone}`}
              >
                <p>{metric.label}</p>
                <strong>{metric.value}</strong>
                <span>{metric.detail}</span>
              </article>
            ))}
          </div>

          <div className="dashboard-grid">
            <article className="panel panel--hero-signal">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Composite signal</p>
                  <h4>Risk appetite trend</h4>
                </div>
                <span className="panel__tag">18 observations</span>
              </div>
              <svg
                className="signal-chart"
                viewBox="0 0 520 190"
                role="img"
                aria-label="Upward market pulse trend line"
              >
                <defs>
                  <linearGradient id="signalGlow" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#6e6654" />
                    <stop offset="55%" stopColor="#ebe6dc" />
                    <stop offset="100%" stopColor="#9a8f6e" />
                  </linearGradient>
                </defs>
                <path className="signal-chart__grid" d="M 0 160 H 520 M 0 105 H 520 M 0 50 H 520" />
                <path className="signal-chart__path" d={path} />
                <circle
                  className="signal-chart__terminal"
                  cx={terminal.x}
                  cy={terminal.y}
                  r="5"
                />
              </svg>
              <div className="signal-summary">
                <span>Constructive</span>
                <p>
                  Trend quality is firm enough to rank opportunities, but not strong
                  enough to ignore macro pressure.
                </p>
              </div>
            </article>

            <article className="panel panel--regime">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Regime map</p>
                  <h4>What matters now</h4>
                </div>
              </div>
              <ul className="regime-list">
                {regimeSignals.map((signal) => (
                  <li key={signal.label}>
                    <div className="regime-list__row">
                      <span>{signal.label}</span>
                      <strong>{signal.direction}</strong>
                    </div>
                    <div className="regime-meter" aria-label={`${signal.label} score ${signal.score}`}>
                      <span style={{ width: `${signal.score}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <article className="panel panel--queue">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Decision queue</p>
                  <h4>Next best actions</h4>
                </div>
              </div>
              <ol className="decision-list">
                {intelligenceQueue.map((item, index) => (
                  <li key={item.title}>
                    <span className="decision-list__index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p>{item.title}</p>
                      <span>
                        {item.meta} / {item.priority}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </article>

            <article className="panel panel--assets">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Cross-asset tape</p>
                  <h4>Fast read</h4>
                </div>
              </div>
              <div className="asset-grid">
                {assetReadings.map((asset) => (
                  <div key={asset.name} className="asset-tile">
                    <span>{asset.name}</span>
                    <strong>{asset.change}</strong>
                    <p>{asset.state}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
