import { useId } from "react";
import { marketPulseSnapshot } from "../data/marketDashboard";

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
  const instanceId = useId().replaceAll(":", "");
  const gradientId = `${instanceId}-signal-glow`;
  const titleId = `${instanceId}-market-signal-title`;
  const descId = `${instanceId}-market-signal-desc`;
  const {
    assetReadings,
    compositeSignal,
    disclaimer,
    intelligenceQueue,
    label,
    lead,
    metrics,
    regimeSignals,
    status,
    title,
    verdict,
  } = marketPulseSnapshot;
  const { path, terminal } = sparklineGeometry(compositeSignal.points);
  const observationCount = compositeSignal.points.length;
  const chartStart = compositeSignal.points[0];
  const chartEnd = compositeSignal.points.at(-1);

  return (
    <section
      id="dashboard"
      className="section section--dashboard"
      aria-labelledby="dashboard-title"
    >
      <div className="container">
        <header className="dashboard-hero">
          <div>
            <p className="section-label">{label}</p>
            <h2 id="dashboard-title" className="section-title dashboard-hero__title">
              One screen. Clear signal. No noise.
            </h2>
            <p className="section-lead dashboard-hero__lead">{lead}</p>
          </div>
          <p className="dashboard-hero__verdict">{verdict}</p>
        </header>

        <div className="dashboard-shell" aria-label="BFI market pulse dashboard preview">
          <div className="dashboard-topline">
            <div>
              <p className="dashboard-kicker">BFI Market Pulse</p>
              <h3>{title}</h3>
            </div>
            <div className="dashboard-status" aria-label={`System status: ${status}`}>
              <span aria-hidden="true" />
              {status}
            </div>
          </div>
          <p className="dashboard-disclaimer">{disclaimer}</p>

          <div className="metric-strip">
            {metrics.map((metric) => (
              <article
                key={metric.id}
                className={`metric-card metric-card--${metric.tone}`}
              >
                <p>{metric.label}</p>
                <strong>{metric.value}</strong>
                <em>{metric.tone}</em>
                <span>{metric.detail}</span>
              </article>
            ))}
          </div>

          <div className="dashboard-grid">
            <article className="panel panel--hero-signal">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Composite signal</p>
                  <h4>{compositeSignal.title}</h4>
                </div>
                <span className="panel__tag">{observationCount} observations</span>
              </div>
              <svg
                className="signal-chart"
                viewBox="0 0 520 190"
                role="img"
                aria-labelledby={`${titleId} ${descId}`}
              >
                <title id={titleId}>Sample market pulse trend</title>
                <desc id={descId}>
                  Illustrative signal with {observationCount} observations, moving
                  from {chartStart} to {chartEnd}.
                </desc>
                <defs>
                  <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#6e6654" />
                    <stop offset="55%" stopColor="#ebe6dc" />
                    <stop offset="100%" stopColor="#9a8f6e" />
                  </linearGradient>
                </defs>
                <path className="signal-chart__grid" d="M 0 160 H 520 M 0 105 H 520 M 0 50 H 520" />
                <path
                  className="signal-chart__path"
                  d={path}
                  style={{ stroke: `url("#${gradientId}")` }}
                />
                <circle
                  className="signal-chart__terminal"
                  cx={terminal.x}
                  cy={terminal.y}
                  r="5"
                />
              </svg>
              <div className="signal-summary">
                <span>{compositeSignal.label}</span>
                <p>{compositeSignal.description}</p>
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
                  <li key={signal.id}>
                    <div className="regime-list__row">
                      <span>{signal.label}</span>
                      <strong>{signal.direction}</strong>
                    </div>
                    <div
                      className="regime-meter"
                      role="progressbar"
                      aria-label={`${signal.label}, ${signal.direction}`}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={signal.score}
                      aria-valuetext={`${signal.score} of 100, ${signal.direction}`}
                    >
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
                  <li key={item.id}>
                    <span className="decision-list__index" aria-hidden="true">
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
                  <div key={asset.id} className="asset-tile">
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
