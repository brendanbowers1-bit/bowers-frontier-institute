import marketPulse from "../data/marketPulse.json";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const percent = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  signDisplay: "exceptZero",
});

const plain = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const formatPercent = (value) => `${percent.format(value)}%`;
const formatCurrency = (value) => currency.format(value);

function Metric({ label, value, detail }) {
  return (
    <article className="market-metric">
      <p className="market-metric__label">{label}</p>
      <p className="market-metric__value">{value}</p>
      {detail && <p className="market-metric__detail">{detail}</p>}
    </article>
  );
}

export function MarketPulse() {
  const [btc, eth, sol] = marketPulse.crypto;
  const [spy, qqq, iwm, gld, tlt, uup] = marketPulse.markets;

  return (
    <section id="market-pulse" className="section section--market-pulse" aria-labelledby="market-pulse-title">
      <div className="container">
        <header className="section-header">
          <p className="section-label">BFI AI data desk</p>
          <h2 id="market-pulse-title" className="section-title">
            Market pulse from free public data.
          </h2>
          <p className="section-lead">
            A first research dashboard built from the local free-data pipeline:
            crypto, ETF proxies, macro rates, filings, options, and headlines.
          </p>
        </header>

        <div className="market-pulse__status">
          <span>{marketPulse.dataRun.successfulSources}/{marketPulse.dataRun.totalSources} sources fetched</span>
          <span>Data run {marketPulse.dataRun.runDate}</span>
          <span>Research support only</span>
        </div>

        <div className="market-pulse__grid">
          <div className="market-panel market-panel--wide">
            <div className="market-panel__header">
              <h3>Crypto tape</h3>
              <p>Kraken spot, order book depth, and 24h activity.</p>
            </div>
            <div className="market-table" role="table" aria-label="Crypto market pulse">
              <div className="market-table__row market-table__row--head" role="row">
                <span>Asset</span>
                <span>Last</span>
                <span>Day</span>
                <span>Spread</span>
                <span>24h vol</span>
              </div>
              {[btc, eth, sol].map((asset) => (
                <div className="market-table__row" role="row" key={asset.symbol}>
                  <span>{asset.symbol}</span>
                  <span>{formatCurrency(asset.last)}</span>
                  <span>{formatPercent(asset.dayChangePct)}</span>
                  <span>{formatPercent(asset.spreadPct)}</span>
                  <span>{compactNumber.format(asset.volume24h)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="market-panel">
            <div className="market-panel__header">
              <h3>Rate regime</h3>
              <p>Treasury curve and SOFR context.</p>
            </div>
            <div className="market-metric-grid">
              <Metric label="10Y Treasury" value={`${plain.format(marketPulse.rates.tenYear)}%`} detail={marketPulse.rates.date} />
              <Metric label="2Y Treasury" value={`${plain.format(marketPulse.rates.twoYear)}%`} detail={`${marketPulse.rates.tenYearMinusTwoYearBps} bps 10Y-2Y`} />
              <Metric label="SOFR" value={`${plain.format(marketPulse.rates.sofr.rate)}%`} detail={marketPulse.rates.sofr.date} />
            </div>
          </div>

          <div className="market-panel">
            <div className="market-panel__header">
              <h3>Macro markers</h3>
              <p>BLS inflation and labor context.</p>
            </div>
            <div className="market-metric-grid">
              <Metric label="CPI-U" value={plain.format(marketPulse.macro.cpi.value)} detail={marketPulse.macro.cpi.date} />
              <Metric
                label="Unemployment"
                value={`${plain.format(marketPulse.macro.unemployment.value)}%`}
                detail={marketPulse.macro.unemployment.date}
              />
            </div>
          </div>

          <div className="market-panel market-panel--wide">
            <div className="market-panel__header">
              <h3>Market proxies</h3>
              <p>ETF basket for risk-on, hedge, duration, and dollar context.</p>
            </div>
            <div className="market-table" role="table" aria-label="ETF market proxies">
              <div className="market-table__row market-table__row--head" role="row">
                <span>Symbol</span>
                <span>Role</span>
                <span>Last</span>
                <span>30D</span>
                <span>YTD</span>
              </div>
              {[spy, qqq, iwm, gld, tlt, uup].map((asset) => (
                <div className="market-table__row" role="row" key={asset.symbol}>
                  <span>{asset.symbol}</span>
                  <span>{asset.role}</span>
                  <span>{formatCurrency(asset.last)}</span>
                  <span>{formatPercent(asset.return30dPct)}</span>
                  <span>{formatPercent(asset.returnYtdPct)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="market-panel">
            <div className="market-panel__header">
              <h3>Research coverage</h3>
              <p>Current public-data universe.</p>
            </div>
            <div className="market-metric-grid">
              <Metric label="SEC companies" value={marketPulse.filings.companyCount} detail={marketPulse.filings.companies.join(", ")} />
              <Metric
                label="Options chains"
                value={compactNumber.format(
                  marketPulse.options.reduce((total, chain) => total + chain.contracts, 0),
                )}
                detail={marketPulse.options.map((chain) => chain.symbol).join(", ")}
              />
              <Metric
                label="Headline feeds"
                value={marketPulse.headlines.reduce((total, feed) => total + feed.items, 0)}
                detail={marketPulse.headlines.map((feed) => feed.source).join(", ")}
              />
            </div>
          </div>
        </div>

        <p className="market-pulse__disclaimer">
          Public/free data is for prototypes and research support only. BFI AI outputs are not financial advice.
        </p>
      </div>
    </section>
  );
}
