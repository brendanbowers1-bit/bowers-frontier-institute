import { Fragment, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  Gauge,
  Layers,
  Menu,
  Radio,
  Shield,
  X,
} from "lucide-react";
import { correlations, correlationAssets } from "../data/correlations";
import { currencyExposure, exposureTotals } from "../data/currencyExposure";
import { fxRates } from "../data/fxRates";
import { assetClasses, periods, pnlCurve, portfolioPerformance } from "../data/portfolioPerformance";
import { ohlcSeries, volatilitySeries } from "../data/volatility";
import {
  exampleWeeklyTradeNote,
  noTradeGates,
  recommendationScorecard,
  recommendationTiers,
  weeklyTradeOutput,
} from "../data/weeklyTradeDiscovery";
import { yieldCurve } from "../data/yieldCurve";
import { Br3nCrest } from "./Br3nCrest";
import { Br3nRibbonMark } from "./Br3nRibbonMark";
import { CreditCollarFeed } from "./CreditCollarFeed";
import { PwaInstallPrompt } from "./PwaInstallPrompt";
import "./Br3nDashboard.css";

const periodLengths = {
  "1D": 24,
  "5D": 42,
  "1M": 70,
  "3M": 96,
  YTD: 124,
  "1Y": 160,
};

const navItems = ["Overview", "Collars", "Markets", "Risk", "Exposure", "Signals"];

const metrics = [
  { label: "Capital observed", value: "$2.84B", delta: "+4.8%", icon: CircleDollarSign },
  { label: "Research P&L", value: "$14.2M", delta: "+1.9%", icon: Activity },
  { label: "Collar candidates", value: "10", delta: "screened", icon: Shield },
  { label: "Hedge posture", value: "64%", delta: "+3 pts", icon: Gauge },
];

const thesisPoints = [
  "Read the regime before optimizing the trade.",
  "Keep data lineage close to every recommendation.",
  "Make uncertainty visible enough to govern.",
];

export function Br3nDashboard() {
  const [period, setPeriod] = useState("3M");
  const [assetClass, setAssetClass] = useState("FX");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 720);
    return () => window.clearTimeout(timeout);
  }, []);

  const performanceData = useMemo(() => {
    const series = portfolioPerformance[assetClass] ?? portfolioPerformance.FX;
    return series.slice(-periodLengths[period]);
  }, [assetClass, period]);

  const volatilityData = useMemo(
    () => volatilitySeries.slice(-Math.min(periodLengths[period], volatilitySeries.length)),
    [period],
  );

  if (loading) {
    return <Br3nLoader />;
  }

  return (
    <div className="br3n-shell">
      <div className="br3n-ambient br3n-ambient--one" />
      <div className="br3n-ambient br3n-ambient--two" />

      <aside className={`br3n-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="br3n-brand">
          <Br3nCrest compact />
          <div>
            <div className="br3n-wordmark">BR3N</div>
            <div className="br3n-brandline">Research Systems</div>
          </div>
        </div>
        <nav className="br3n-nav">
          {navItems.map((item, index) => (
            <a className={index === 0 ? "is-active" : ""} href={`#${item.toLowerCase()}`} key={item}>
              <span>0{index + 1}</span>
              {item}
            </a>
          ))}
        </nav>
        <div className="br3n-sidebar-card">
          <Radio size={16} />
          <span>Evidence first</span>
          <small>Adapters for Bloomberg, Snowflake, FRED, and internal data can sit behind the research layer.</small>
        </div>
      </aside>

      <button className="br3n-mobile-toggle" onClick={() => setSidebarOpen((open) => !open)}>
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <main className="br3n-main">
        <motion.header
          animate={{ opacity: 1, y: 0 }}
          className="br3n-hero"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <div className="br3n-hero-brand">
              <Br3nCrest />
            </div>
            <p className="br3n-kicker">BFI · Research systems</p>
            <h1>A calmer way to read macro risk.</h1>
            <p className="br3n-hero-copy">
              BR3N turns market data, credit-collar discovery, and hedge posture into a
              disciplined workspace for reasoning about capital. It is built to clarify
              the question before it accelerates the answer.
            </p>
            <div className="br3n-hero-principles" aria-label="Research principles">
              {thesisPoints.map((point, index) => (
                <span key={point}>
                  <strong>0{index + 1}</strong>
                  {point}
                </span>
              ))}
            </div>
          </div>
          <div className="br3n-hero-right">
            <motion.div
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              className="br3n-ribbon-stage"
              initial={{ opacity: 0, rotate: -8, scale: 0.94 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <Br3nRibbonMark />
            </motion.div>
            <div className="br3n-hero-tape" aria-label="Market overview">
              {fxRates.slice(0, 4).map((rate) => (
                <motion.div className="br3n-tape-item" key={rate.pair} whileHover={{ y: -3 }}>
                  <span>{rate.pair}</span>
                  <strong>{formatSpot(rate.spot)}</strong>
                  <em className={rate.change >= 0 ? "is-positive" : "is-negative"}>
                    {rate.change >= 0 ? "+" : ""}
                    {rate.change.toFixed(2)}%
                  </em>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.header>

        <section className="br3n-controls" id="overview">
          <div className="br3n-filter-group">
            {periods.map((item) => (
              <button
                className={period === item ? "is-active" : ""}
                key={item}
                onClick={() => setPeriod(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="br3n-filter-group br3n-filter-group--asset">
            {assetClasses.map((item) => (
              <button
                className={assetClass === item ? "is-active" : ""}
                key={item}
                onClick={() => setAssetClass(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="br3n-command-strip"
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div>
            <BarChart3 size={16} />
            <span>Evidence</span>
            <strong>Credit collars ranked by observable inputs</strong>
          </div>
          <div>
            <Activity size={16} />
            <span>Reasoning</span>
            <strong>Profit, floor, liquidity, and fit separated</strong>
          </div>
          <div>
            <Shield size={16} />
            <span>Guardrails</span>
            <strong>Research only · no autonomous execution</strong>
          </div>
        </motion.section>

        <PwaInstallPrompt />

        <section className="br3n-grid br3n-grid--collars" id="collars">
          <CreditCollarFeed />
        </section>

        <section className="br3n-metric-grid">
          {metrics.map((metric, index) => (
            <MetricCard index={index} key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="br3n-grid br3n-grid--market" id="markets">
          <Panel className="br3n-panel--wide" eyebrow="Market overview" title={`${assetClass} performance`}>
            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(8px)" }}
                initial={{ opacity: 0, filter: "blur(8px)" }}
                key={`${assetClass}-${period}`}
                transition={{ duration: 0.35 }}
              >
                <ChartFrame height={330}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="br3nArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.34)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" hide />
                    <YAxis domain={["dataMin - 4", "dataMax + 4"]} hide />
                    <Tooltip content={<PremiumTooltip />} />
                    <Area dataKey="value" fill="url(#br3nArea)" stroke="#f8f8f2" strokeWidth={2.4} type="monotone" />
                    <Line dataKey="benchmark" dot={false} stroke="rgba(255,255,255,0.28)" strokeDasharray="4 6" strokeWidth={1.4} type="monotone" />
                  </AreaChart>
                </ChartFrame>
              </motion.div>
            </AnimatePresence>
          </Panel>

          <Panel eyebrow="OHLC" title="EUR/USD candle tape">
            <CandleChart data={ohlcSeries.slice(-28)} />
          </Panel>
        </section>

        <section className="br3n-grid br3n-grid--three">
          <Panel eyebrow="Foreign exchange" title="FX rates">
            <div className="br3n-fx-list">
              {fxRates.map((rate) => (
                <motion.div className="br3n-fx-row" key={rate.pair} whileHover={{ x: 4 }}>
                  <span>{rate.pair}</span>
                  <strong>{formatSpot(rate.spot)}</strong>
                  <em className={rate.change >= 0 ? "is-positive" : "is-negative"}>
                    {rate.change >= 0 ? "+" : ""}
                    {rate.change.toFixed(2)}%
                  </em>
                </motion.div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Rates" title="Yield curve">
            <ChartFrame height={250}>
              <LineChart data={yieldCurve}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="tenor" stroke="rgba(255,255,255,0.34)" tickLine={false} />
                <YAxis hide />
                <Tooltip content={<PremiumTooltip />} />
                <Line dataKey="usd" dot={false} stroke="#f7f7f2" strokeWidth={2} type="monotone" />
                <Line dataKey="eur" dot={false} stroke="rgba(255,255,255,0.46)" strokeWidth={1.6} type="monotone" />
                <Line dataKey="gbp" dot={false} stroke="rgba(180,180,180,0.34)" strokeWidth={1.3} type="monotone" />
              </LineChart>
            </ChartFrame>
          </Panel>

          <Panel eyebrow="Volatility" title="Realized vs implied">
            <ChartFrame height={250}>
              <ComposedChart data={volatilityData}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" hide />
                <YAxis hide />
                <Tooltip content={<PremiumTooltip />} />
                <Bar dataKey="realized" fill="rgba(255,255,255,0.12)" radius={[3, 3, 0, 0]} />
                <Line dataKey="implied" dot={false} stroke="#f8f8f2" strokeWidth={2} type="monotone" />
              </ComposedChart>
            </ChartFrame>
          </Panel>
        </section>

        <section className="br3n-grid br3n-grid--risk" id="risk">
          <Panel eyebrow="Risk dashboard" title="Drawdown / VaR / hedge posture">
            <div className="br3n-risk-stack">
              <RiskLine label="Max drawdown" value="-4.8%" width="48%" />
              <RiskLine label="VaR utilization" value="63%" width="63%" />
              <RiskLine label="Hedge ratio" value="64%" width="64%" />
            </div>
            <ChartFrame height={220}>
              <AreaChart data={pnlCurve.slice(-periodLengths[period])}>
                <defs>
                  <linearGradient id="pnlGlow" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <YAxis hide />
                <Tooltip content={<PremiumTooltip />} />
                <Area dataKey="pnl" fill="url(#pnlGlow)" stroke="#f8f8f2" strokeWidth={2} type="monotone" />
              </AreaChart>
            </ChartFrame>
          </Panel>

          <Panel eyebrow="Correlation" title="Cross-asset heatmap">
            <CorrelationHeatmap />
          </Panel>
        </section>

        <section className="br3n-grid br3n-grid--exposure" id="exposure">
          <Panel eyebrow="Exposure" title="Currency exposure">
            <ChartFrame height={300}>
              <BarChart data={currencyExposure} layout="vertical">
                <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis hide type="number" />
                <YAxis axisLine={false} dataKey="currency" stroke="rgba(255,255,255,0.52)" tickLine={false} type="category" />
                <Tooltip content={<PremiumTooltip />} />
                <Bar dataKey="exposure" radius={[0, 5, 5, 0]}>
                  {currencyExposure.map((entry) => (
                    <Cell fill={entry.exposure > 20 ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.34)"} key={entry.currency} />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>
          </Panel>

          <Panel eyebrow="Capital at work" title="Exposure structure">
            <div className="br3n-exposure-summary">
              <SummaryRow label="Gross exposure" value={formatUsd(exposureTotals.gross)} />
              <SummaryRow label="Hedged notional" value={formatUsd(exposureTotals.hedged)} />
              <SummaryRow label="Residual risk" value={formatUsd(exposureTotals.residual)} />
            </div>
            <div className="br3n-metal-card">
              <Layers size={18} />
              <span>Auditable data architecture</span>
              <p>FX, performance, exposure, rates, volatility, and correlations remain separated so live sources can be reviewed, replaced, and governed independently.</p>
            </div>
          </Panel>
        </section>

        <section className="br3n-grid br3n-grid--signals" id="signals">
          <Panel className="br3n-panel--wide" eyebrow="Weekly trade discovery" title="Best-fit setup workflow">
            <h3 className="br3n-signal-subhead">Weighted scorecard</h3>
            <div className="br3n-signal-grid">
              {recommendationScorecard.map((metric) => (
                <motion.div className="br3n-signal-card" key={metric.id} whileHover={{ y: -3 }}>
                  <span>{metric.weight}</span>
                  <strong>{metric.label}</strong>
                  <p>{metric.description}</p>
                </motion.div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow={weeklyTradeOutput.label} title={weeklyTradeOutput.title}>
            <div className="br3n-trade-note">
              <div>
                <span>{exampleWeeklyTradeNote.tier}</span>
                <strong>{exampleWeeklyTradeNote.score}/100</strong>
              </div>
              <h3>{exampleWeeklyTradeNote.setup}</h3>
              <p>{exampleWeeklyTradeNote.recommendation}</p>
            </div>
            <h3 className="br3n-signal-subhead">Recommendation tiers</h3>
            <div className="br3n-tier-list">
              {recommendationTiers.map((tier) => (
                <span key={tier.id}>
                  <strong>{tier.name}</strong>
                  <small>{tier.score}</small>
                </span>
              ))}
            </div>
            <h3 className="br3n-signal-subhead">Hard no-trade gates</h3>
            <div className="br3n-gate-list">
              {noTradeGates.map((gate) => (
                <span key={gate}>{gate}</span>
              ))}
            </div>
          </Panel>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ metric, index }) {
  const Icon = metric.icon;
  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="br3n-metric"
      initial={{ opacity: 0, y: 18 }}
      transition={{ delay: index * 0.06, duration: 0.45 }}
      whileHover={{ y: -4 }}
    >
      <Icon size={18} />
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
      <em>{metric.delta}</em>
    </motion.article>
  );
}

function Panel({ children, className = "", eyebrow, title }) {
  return (
    <motion.article className={`br3n-panel ${className}`} transition={{ duration: 0.25 }} whileHover={{ y: -2 }}>
      <div className="br3n-panel-head">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <ArrowUpRight size={16} />
      </div>
      {children}
    </motion.article>
  );
}

function ChartFrame({ children, height }) {
  return (
    <div className="br3n-chart" style={{ height }}>
      <ResponsiveContainer height="100%" width="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function PremiumTooltip({ active, label, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="br3n-tooltip">
      <span>{label}</span>
      {payload.map((item) => (
        <strong key={item.dataKey}>
          {item.name || item.dataKey}: {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
        </strong>
      ))}
    </div>
  );
}

function CandleChart({ data }) {
  const min = Math.min(...data.map((item) => item.low));
  const max = Math.max(...data.map((item) => item.high));
  const range = max - min;

  return (
    <div className="br3n-candles">
      {data.map((item) => {
        const high = ((max - item.high) / range) * 100;
        const low = ((max - item.low) / range) * 100;
        const open = ((max - item.open) / range) * 100;
        const close = ((max - item.close) / range) * 100;
        const top = Math.min(open, close);
        const height = Math.max(Math.abs(close - open), 2);
        const positive = item.close >= item.open;
        return (
          <div className="br3n-candle" key={item.session}>
            <span className="wick" style={{ top: `${high}%`, height: `${low - high}%` }} />
            <span
              className={`body ${positive ? "is-up" : "is-down"}`}
              style={{ top: `${top}%`, height: `${height}%` }}
              title={`O ${item.open} H ${item.high} L ${item.low} C ${item.close}`}
            />
          </div>
        );
      })}
    </div>
  );
}

function CorrelationHeatmap() {
  return (
    <div className="br3n-heatmap">
      <div />
      {correlationAssets.map((asset) => (
        <span className="axis" key={asset}>
          {asset}
        </span>
      ))}
      {correlations.map((row, rowIndex) => (
        <Fragment key={`${correlationAssets[rowIndex]}-row`}>
          <span className="axis" key={`${correlationAssets[rowIndex]}-axis`}>
            {correlationAssets[rowIndex]}
          </span>
          {row.map((value, columnIndex) => (
            <motion.span
              className="cell"
              key={`${rowIndex}-${columnIndex}`}
              style={{ background: heatColor(value) }}
              title={`${correlationAssets[rowIndex]} / ${correlationAssets[columnIndex]}: ${value}`}
              whileHover={{ scale: 1.08 }}
            >
              {value.toFixed(2)}
            </motion.span>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

function Br3nLoader() {
  return (
    <div className="br3n-loader">
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="br3n-loader-card"
        initial={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <Br3nCrest />
        <Br3nRibbonMark compact />
        <div className="br3n-loader-lines">
          <span />
          <span />
          <span />
        </div>
        <p>Preparing research workspace</p>
      </motion.div>
    </div>
  );
}

function RiskLine({ label, value, width }) {
  return (
    <div className="br3n-risk-line">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <i>
        <motion.b animate={{ width }} initial={{ width: "0%" }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
      </i>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="br3n-summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function heatColor(value) {
  const alpha = Math.min(0.85, 0.12 + Math.abs(value) * 0.62);
  return value >= 0 ? `rgba(245,245,240,${alpha})` : `rgba(120,126,138,${alpha})`;
}

function formatSpot(value) {
  return value > 10 ? value.toFixed(2) : value.toFixed(4);
}

function formatUsd(value) {
  return `$${(value / 1_000_000).toFixed(1)}M`;
}
