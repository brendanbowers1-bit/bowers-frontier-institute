import { useMemo, useState } from "react";
import { Clock3, Radio, ShieldCheck, SlidersHorizontal, TrendingDown, Zap } from "lucide-react";
import {
  collarFeedMeta,
  collarOptimizationProfiles,
  creditCollarCandidates,
  optimizeCreditCollars,
} from "../data/creditCollars";

const allUniverses = ["All", ...new Set(creditCollarCandidates.map((candidate) => candidate.universe))];

export function CreditCollarFeed() {
  const [profileId, setProfileId] = useState("balanced");
  const [universe, setUniverse] = useState("All");

  const rankedCollars = useMemo(() => {
    const source =
      universe === "All"
        ? creditCollarCandidates
        : creditCollarCandidates.filter((candidate) => candidate.universe === universe);
    return optimizeCreditCollars(source, profileId);
  }, [profileId, universe]);

  const primary = rankedCollars[0];
  const runnersUp = rankedCollars.slice(1, 7);

  return (
    <>
      <div className="br3n-collar-terminal">
        <div className="br3n-collar-hero">
          <div>
            <p className="br3n-kicker">Credit collar optimizer</p>
            <h2>Mobile feed for positive-credit downside hedges.</h2>
            <p>
              Ranks collars by received credit, protected floor, liquidity, and upside room. Built for
              owned-stock or ETF hedging research, not uncovered call selling.
            </p>
          </div>
          <div className="br3n-collar-status" aria-label="Feed status">
            <span>
              <Radio size={14} />
              {collarFeedMeta.cadence}
            </span>
            <strong>{rankedCollars.length}</strong>
            <small>qualified structures</small>
          </div>
        </div>

        <div className="br3n-collar-toolbar" aria-label="Credit collar feed controls">
          <div>
            <SlidersHorizontal size={14} />
            {collarOptimizationProfiles.map((profile) => (
              <button
                className={profile.id === profileId ? "is-active" : ""}
                key={profile.id}
                onClick={() => setProfileId(profile.id)}
                title={profile.description}
                type="button"
              >
                {profile.label}
              </button>
            ))}
          </div>
          <div>
            {allUniverses.map((item) => (
              <button
                className={item === universe ? "is-active" : ""}
                key={item}
                onClick={() => setUniverse(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {primary ? <PrimaryCollarCard collar={primary} /> : <EmptyCollarState />}
      </div>

      <div className="br3n-collar-sidecar">
        <div className="br3n-collar-feed-head">
          <span>
            <Clock3 size={13} />
            {collarFeedMeta.asOf}
          </span>
          <strong>{collarFeedMeta.source}</strong>
        </div>

        <div className="br3n-collar-list">
          {runnersUp.map((collar) => (
            <CollarRow collar={collar} key={collar.id} />
          ))}
        </div>

        <div className="br3n-collar-disclaimer">
          <ShieldCheck size={15} />
          <p>{collarFeedMeta.disclaimer}</p>
        </div>
      </div>
    </>
  );
}

function PrimaryCollarCard({ collar }) {
  return (
    <article className="br3n-collar-primary">
      <div className="br3n-collar-score">
        <span>{collar.score}</span>
        <small>{collar.scoreLabel}</small>
      </div>
      <div className="br3n-collar-primary-main">
        <div className="br3n-collar-title-row">
          <div>
            <span>{collar.universe}</span>
            <h3>
              {collar.symbol} <em>{collar.name}</em>
            </h3>
          </div>
          <strong>{formatCurrency(collar.spot)}</strong>
        </div>

        <div className="br3n-collar-legs">
          <LegCard label="Buy put" strike={collar.putStrike} value={collar.putAsk} />
          <LegCard label="Sell call" strike={collar.callStrike} value={collar.callBid} />
          <LegCard accent label="Net credit" strike={collar.netCredit} value={collar.netCreditPct} />
        </div>

        <div className="br3n-collar-risk-grid">
          <RiskStat icon={TrendingDown} label="Protected floor" value={formatCurrency(collar.floorValue)} sub={`${collar.floorDrawdownPct}% below spot`} />
          <RiskStat icon={Zap} label="Max upside at call" value={`${collar.maxUpsidePct}%`} sub={`${collar.upsideToCallPct}% to assignment`} />
          <RiskStat icon={ShieldCheck} label="Liquidity score" value={`${collar.liquidityScore}/100`} sub={`OI ${formatInteger(Math.min(collar.putOpenInterest, collar.callOpenInterest))}+`} />
        </div>

        <div className="br3n-collar-tags">
          {collar.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function CollarRow({ collar }) {
  return (
    <article className="br3n-collar-row">
      <div>
        <span>{collar.score}</span>
        <strong>{collar.symbol}</strong>
        <small>{collar.expiration}</small>
      </div>
      <div>
        <strong>
          +{formatCurrency(collar.netCredit)} <small>credit</small>
        </strong>
        <span>
          {collar.putStrike}P / {collar.callStrike}C
        </span>
        <small>
          floor {collar.floorDrawdownPct}% · cap {collar.upsideToCallPct}%
        </small>
      </div>
    </article>
  );
}

function LegCard({ accent = false, label, strike, value }) {
  return (
    <div className={accent ? "is-accent" : ""}>
      <span>{label}</span>
      <strong>{accent ? `+${formatCurrency(strike)}` : strike}</strong>
      <small>{accent ? `${value.toFixed(2)}% of spot` : `@ ${formatCurrency(value)}`}</small>
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

function EmptyCollarState() {
  return (
    <div className="br3n-collar-empty">
      No positive-credit structures passed the current filter. Widen the universe or select a different
      optimization profile.
    </div>
  );
}

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function formatInteger(value) {
  return Math.round(value).toLocaleString();
}
