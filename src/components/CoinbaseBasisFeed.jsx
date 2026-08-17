import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock3,
  Gauge,
  Radio,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  coinbaseBasisFallbackCandidates,
  coinbaseBasisStrategy,
  rankCoinbaseBasisCandidates,
} from "../data/coinbaseBasis";
import { fetchLiveCoinbaseBasis } from "../lib/coinbaseBasisFeedClient";

const DEFAULT_ASSETS = ["BTC", "ETH", "SOL", "XRP", "DOGE"];

export function CoinbaseBasisFeed() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [feedCandidates, setFeedCandidates] = useState(() =>
    rankCoinbaseBasisCandidates(coinbaseBasisFallbackCandidates),
  );
  const [feedMeta, setFeedMeta] = useState({
    asOf: "Snapshot",
    source: "Static Coinbase INTX basis snapshot fallback",
  });
  const [feedStatus, setFeedStatus] = useState("Snapshot fallback");
  const [feedNotice, setFeedNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const refreshFeed = useCallback(async (signal) => {
    setRefreshing(true);
    try {
      const payload = await fetchLiveCoinbaseBasis({ assets: DEFAULT_ASSETS, signal });
      setFeedCandidates(payload.candidates);
      setFeedMeta({
        asOf: formatTimestamp(payload.asOf),
        source: payload.source ?? coinbaseBasisStrategy.name,
      });
      setFeedStatus(payload.degraded ? "Live partial" : "Live feed");
      setFeedNotice(
        payload.degraded
          ? "Live scan is partial - showing ranked Coinbase candidates where complete quotes are available."
          : "",
      );
    } catch {
      setFeedCandidates(rankCoinbaseBasisCandidates(coinbaseBasisFallbackCandidates));
      setFeedMeta({
        asOf: "Snapshot",
        source: "Static Coinbase INTX basis snapshot fallback",
      });
      setFeedStatus("Snapshot fallback");
      setFeedNotice("Live Coinbase scan unavailable - showing the verified snapshot fallback.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const initialRefresh = window.setTimeout(() => refreshFeed(controller.signal), 0);
    const interval = window.setInterval(() => refreshFeed(controller.signal), 30_000);
    return () => {
      controller.abort();
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, [refreshFeed]);

  const rankedCandidates = useMemo(() => {
    const filtered =
      statusFilter === "All"
        ? feedCandidates
        : feedCandidates.filter((candidate) => candidate.status === statusFilter.toLowerCase());
    return [...filtered].sort((a, b) => b.expectedProfit - a.expectedProfit || b.basis - a.basis);
  }, [feedCandidates, statusFilter]);

  const primary = rankedCandidates[0];
  const runnersUp = rankedCandidates.slice(1, 6);
  const statusCounts = useMemo(
    () => ({
      All: feedCandidates.length,
      Candidate: feedCandidates.filter((candidate) => candidate.status === "candidate").length,
      Monitor: feedCandidates.filter((candidate) => candidate.status === "monitor").length,
    }),
    [feedCandidates],
  );

  return (
    <>
      <div className="br3n-collar-terminal">
        <div className="br3n-collar-hero">
          <div>
            <p className="br3n-kicker">Coinbase basis scanner</p>
            <h2>Automated perp/spot carry monitor.</h2>
            <p>
              Computes basis as perp divided by spot minus one, then subtracts fees,
              slippage, financing carry, and a safety buffer from expected funding and
              convergence.
            </p>
          </div>
          <div aria-label="Coinbase basis feed status" aria-live="polite" className="br3n-collar-status">
            <span>
              <Radio size={14} />
              {feedStatus}
            </span>
            <strong>{rankedCandidates.length}</strong>
            <small>markets scanned</small>
          </div>
        </div>

        <div className="br3n-collar-toolbar" aria-label="Coinbase basis feed controls">
          <div>
            <Gauge size={14} />
            {Object.entries(statusCounts).map(([label, count]) => (
              <button
                aria-pressed={statusFilter === label}
                className={statusFilter === label ? "is-active" : ""}
                key={label}
                onClick={() => setStatusFilter(label)}
                type="button"
              >
                {label} ({count})
              </button>
            ))}
          </div>
          <div>
            <Activity size={14} />
            <button aria-pressed className="is-active" type="button">
              Buffered edge
            </button>
          </div>
        </div>

        <div className="br3n-collar-automation">
          <button disabled={refreshing} onClick={() => refreshFeed()} type="button">
            <RefreshCw className={refreshing ? "is-spinning" : ""} size={14} />
            {refreshing ? "Scanning" : "Refresh Coinbase"}
          </button>
          <div className="br3n-basis-formula">
            <span>{coinbaseBasisStrategy.basisFormula}</span>
            <small>{coinbaseBasisStrategy.expectedProfitFormula}</small>
          </div>
        </div>

        {feedNotice ? <div className="br3n-collar-feed-note">{feedNotice}</div> : null}

        {primary ? <PrimaryBasisCard candidate={primary} /> : <EmptyBasisState />}
      </div>

      <div className="br3n-collar-sidecar">
        <div className="br3n-collar-feed-head">
          <span>
            <Clock3 size={13} />
            {feedMeta.asOf}
          </span>
          <strong>{feedMeta.source} - 30s scanner loop</strong>
        </div>

        <div className="br3n-collar-list">
          {runnersUp.map((candidate) => (
            <BasisRow candidate={candidate} key={`${candidate.spotProduct}-${candidate.perpProduct}`} />
          ))}
        </div>

        <div className="br3n-collar-disclaimer">
          <ShieldCheck size={15} />
          <p>{coinbaseBasisStrategy.disclaimer}</p>
        </div>
      </div>
    </>
  );
}

function PrimaryBasisCard({ candidate }) {
  const totalCosts =
    candidate.spotFees +
    candidate.perpFees +
    candidate.slippage +
    candidate.financingCarry +
    candidate.safetyBuffer;

  return (
    <article className="br3n-collar-primary">
      <div className="br3n-collar-score">
        <span>{candidate.score}</span>
        <small>{candidate.scoreLabel}</small>
      </div>
      <div className="br3n-collar-primary-main">
        <div className="br3n-collar-title-row">
          <div>
            <span>{candidate.status}</span>
            <h3>
              {candidate.asset} <em>{candidate.spotProduct} / {candidate.perpProduct}</em>
            </h3>
          </div>
          <div className="br3n-collar-title-actions">
            <strong>{formatPct(candidate.expectedProfit)}</strong>
          </div>
        </div>

        <div className="br3n-collar-legs">
          <LegCard label="Spot" value={formatCurrency(candidate.spotPrice)} />
          <LegCard label="Perp" value={formatCurrency(candidate.perpPrice)} />
          <LegCard accent label="Basis" value={formatPct(candidate.basis)} />
        </div>

        <div className="br3n-collar-risk-grid">
          <RiskStat
            icon={Wallet}
            label="Expected funding"
            sub={`${formatPct(candidate.predictedFundingRate)} x funding intervals`}
            value={formatPct(candidate.expectedFunding)}
          />
          <RiskStat
            icon={TrendingUp}
            label="Convergence"
            sub="Positive basis only"
            value={formatPct(candidate.expectedBasisConvergence)}
          />
          <RiskStat
            icon={ShieldCheck}
            label="Costs + buffer"
            sub="Fees, slippage, carry, safety"
            value={formatPct(totalCosts)}
          />
        </div>

        <div className="br3n-collar-tags">
          {candidate.reviewFlags.map((flag) => (
            <span key={flag}>{flag.replaceAll("_", " ")}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function BasisRow({ candidate }) {
  return (
    <article className="br3n-collar-row">
      <div>
        <span>{candidate.score}</span>
        <strong>{candidate.asset}</strong>
        <small>{candidate.status}</small>
      </div>
      <div>
        <strong>
          {formatPct(candidate.expectedProfit)} <small>expected</small>
        </strong>
        <span>{candidate.spotProduct} / {candidate.perpProduct}</span>
        <small>
          basis {formatPct(candidate.basis)} - funding {formatPct(candidate.expectedFunding)}
        </small>
      </div>
      <div className="br3n-basis-row-badge">{candidate.direction === "long_spot_short_perp" ? "carry" : "skip"}</div>
    </article>
  );
}

function LegCard({ accent = false, label, value }) {
  return (
    <div className={accent ? "is-accent" : ""}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{accent ? "perp / spot - 1" : "Coinbase quote"}</small>
    </div>
  );
}

function RiskStat({ icon: Icon, label, sub, value }) {
  return (
    <div>
      <Icon size={15} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

function EmptyBasisState() {
  return (
    <div className="br3n-collar-empty">
      No Coinbase basis markets match the current filter. Switch filters or refresh the scan.
    </div>
  );
}

function formatCurrency(value) {
  if (value >= 100) {
    return `$${Math.round(value).toLocaleString()}`;
  }
  return `$${value.toFixed(value >= 1 ? 2 : 4)}`;
}

function formatPct(value) {
  return `${(value * 100).toFixed(3)}%`;
}

function formatTimestamp(value) {
  if (!value || value === "Snapshot") return value || "Snapshot";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
