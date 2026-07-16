import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BarChart3,
  Bell,
  CircleDollarSign,
  Home,
  Radio,
  Shield,
} from "lucide-react";
import { currencyExposure, exposureTotals } from "../data/currencyExposure";
import { fxRates } from "../data/fxRates";
import { periods, pnlCurve, portfolioPerformance } from "../data/portfolioPerformance";
import { volatilitySeries } from "../data/volatility";
import { exampleWeeklyTradeNote, noTradeGates } from "../data/weeklyTradeDiscovery";
import { Br3nRibbonMark } from "./Br3nRibbonMark";
import "./Br3nMobileApp.css";

const mobilePeriodLengths = {
  "1D": 24,
  "5D": 36,
  "1M": 54,
  "3M": 72,
  YTD: 96,
  "1Y": 120,
};

const navItems = [
  { label: "Home", icon: Home },
  { label: "Markets", icon: BarChart3 },
  { label: "Risk", icon: Shield },
  { label: "Alerts", icon: Bell },
];

const mobileStats = [
  { label: "P&L", value: "$14.2M", delta: "+1.9%", icon: CircleDollarSign },
  { label: "VaR", value: "$3.7M", delta: "-0.4%", icon: Shield },
  { label: "Hedge", value: "64%", delta: "+3 pts", icon: Activity },
];

export function Br3nMobileApp() {
  const [period, setPeriod] = useState("1M");
  const [activePair, setActivePair] = useState(fxRates[0].pair);

  const performanceData = useMemo(
    () => portfolioPerformance.FX.slice(-mobilePeriodLengths[period]),
    [period],
  );
  const pnlData = useMemo(() => pnlCurve.slice(-mobilePeriodLengths[period]), [period]);
  const selectedPair = fxRates.find((rate) => rate.pair === activePair) ?? fxRates[0];
  const latestVolatility = volatilitySeries.at(-1);

  return (
    <main className="br3n-mobile-app" aria-label="BR3N mobile finance app">
      <section className="mobile-phone-frame">
        <header className="mobile-topbar">
          <a className="mobile-brand" href="/" aria-label="Open desktop dashboard">
            <Br3nRibbonMark compact />
            <span>
              <strong>BR3N</strong>
              <small>Mobile command</small>
            </span>
          </a>
          <button className="mobile-icon-button" type="button" aria-label="Open alerts">
            <Bell size={18} />
          </button>
        </header>

        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="mobile-hero-card"
          initial={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <p>Research · Regime · Risk</p>
            <h1>Luxury market command, built for your phone.</h1>
          </div>
          <span className="mobile-live-pill">
            <Radio size={13} />
            Live-ready
          </span>
        </motion.section>

        <section className="mobile-stat-row" aria-label="Portfolio metrics">
          {mobileStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.article
                className="mobile-stat-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.45 }}
                key={stat.label}
              >
                <Icon size={15} />
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <em>{stat.delta}</em>
              </motion.article>
            );
          })}
        </section>

        <section className="mobile-control-strip" aria-label="Time period">
          {periods.map((item) => (
            <button
              className={period === item ? "is-active" : ""}
              key={item}
              onClick={() => setPeriod(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </section>

        <MobilePanel eyebrow="Portfolio" title="Performance curve">
          <div className="mobile-chart" aria-label="FX portfolio performance chart">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="mobilePerformance" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" hide />
                <YAxis domain={["dataMin - 3", "dataMax + 3"]} hide />
                <Tooltip content={<MobileTooltip />} />
                <Area dataKey="value" fill="url(#mobilePerformance)" stroke="#f7f7f2" strokeWidth={2.4} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </MobilePanel>

        <MobilePanel eyebrow="FX watchlist" title={selectedPair.pair}>
          <div className="mobile-fx-focus">
            <div>
              <span>Spot</span>
              <strong>{formatSpot(selectedPair.spot)}</strong>
            </div>
            <div>
              <span>Change</span>
              <strong className={selectedPair.change >= 0 ? "is-positive" : "is-negative"}>
                {selectedPair.change >= 0 ? "+" : ""}
                {selectedPair.change.toFixed(2)}%
              </strong>
            </div>
            <div>
              <span>Fwd pts</span>
              <strong>{selectedPair.forwardPoints.toFixed(1)}</strong>
            </div>
          </div>
          <div className="mobile-fx-list">
            {fxRates.map((rate) => (
              <button
                className={activePair === rate.pair ? "is-selected" : ""}
                key={rate.pair}
                onClick={() => setActivePair(rate.pair)}
                type="button"
              >
                <span>{rate.pair}</span>
                <strong>{formatSpot(rate.spot)}</strong>
              </button>
            ))}
          </div>
        </MobilePanel>

        <MobilePanel eyebrow="Risk cockpit" title="Drawdown / VaR / hedge">
          <div className="mobile-risk-lines">
            <RiskMeter label="Max drawdown" value="-4.8%" width="48%" />
            <RiskMeter label="VaR utilization" value="63%" width="63%" />
            <RiskMeter label="Hedge ratio" value="64%" width="64%" />
          </div>
          <div className="mobile-chart mobile-chart--compact" aria-label="P and L chart">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={pnlData}>
                <XAxis dataKey="label" hide />
                <YAxis hide />
                <Tooltip content={<MobileTooltip />} />
                <Area dataKey="pnl" fill="rgba(255,255,255,0.12)" stroke="#f7f7f2" strokeWidth={2} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </MobilePanel>

        <MobilePanel eyebrow="Exposure" title="Currency risk map">
          <div className="mobile-exposure-summary">
            <SummaryStat label="Gross" value={formatUsd(exposureTotals.gross)} />
            <SummaryStat label="Hedged" value={formatUsd(exposureTotals.hedged)} />
            <SummaryStat label="Residual" value={formatUsd(exposureTotals.residual)} />
          </div>
          <div className="mobile-chart mobile-chart--bar" aria-label="Currency exposure chart">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={currencyExposure}>
                <XAxis dataKey="currency" stroke="rgba(255,255,255,0.44)" tickLine={false} />
                <YAxis hide />
                <Tooltip content={<MobileTooltip />} />
                <Bar dataKey="exposure" fill="rgba(255,255,255,0.72)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MobilePanel>

        <MobilePanel eyebrow="Volatility" title="Realized vs implied">
          <div className="mobile-vol-card">
            <SummaryStat label="Realized" value={`${latestVolatility.realized}%`} />
            <SummaryStat label="Implied" value={`${latestVolatility.implied}%`} />
            <SummaryStat label="Spread" value={`${(latestVolatility.implied - latestVolatility.realized).toFixed(2)} pts`} />
          </div>
        </MobilePanel>

        <MobilePanel eyebrow="Weekly trade discovery" title={exampleWeeklyTradeNote.setup}>
          <article className="mobile-trade-card">
            <div>
              <span>{exampleWeeklyTradeNote.tier}</span>
              <strong>{exampleWeeklyTradeNote.score}/100</strong>
            </div>
            <p>{exampleWeeklyTradeNote.recommendation}</p>
          </article>
          <div className="mobile-gates">
            {noTradeGates.slice(0, 4).map((gate) => (
              <span key={gate}>{gate}</span>
            ))}
          </div>
        </MobilePanel>

        <nav className="mobile-bottom-nav" aria-label="Mobile app navigation">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <a className={index === 0 ? "is-active" : ""} href="#top" key={item.label}>
                <Icon size={17} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </section>
    </main>
  );
}

function MobilePanel({ children, eyebrow, title }) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="mobile-panel"
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <header>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </motion.section>
  );
}

function RiskMeter({ label, value, width }) {
  return (
    <div className="mobile-risk-meter">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <i>
        <motion.b animate={{ width }} initial={{ width: "0%" }} transition={{ duration: 0.8 }} />
      </i>
    </div>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div className="mobile-summary-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MobileTooltip({ active, label, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="mobile-tooltip">
      <span>{label}</span>
      {payload.map((item) => (
        <strong key={item.dataKey}>
          {item.name || item.dataKey}: {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
        </strong>
      ))}
    </div>
  );
}

function formatSpot(value) {
  return value > 10 ? value.toFixed(2) : value.toFixed(4);
}

function formatUsd(value) {
  return `$${(value / 1_000_000).toFixed(1)}M`;
}
