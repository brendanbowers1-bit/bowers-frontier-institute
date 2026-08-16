import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Clock3,
  Radio,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  TrendingDown,
  Zap,
} from "lucide-react";
import {
  collarFeedMeta,
  collarOptimizationProfiles,
  creditCollarCandidates,
  optimizeCreditCollars,
} from "../data/creditCollars";
import { fetchLiveCreditCollars } from "../lib/creditCollarFeedClient";

const WATCHLIST_KEY = "br3n-collar-watchlist";
const ALERTS_KEY = "br3n-collar-alerts";
const ALERT_THRESHOLD_KEY = "br3n-collar-alert-threshold";

export function CreditCollarFeed() {
  const [profileId, setProfileId] = useState("balanced");
  const [universe, setUniverse] = useState("All");
  const [feedCandidates, setFeedCandidates] = useState(creditCollarCandidates);
  const [feedMeta, setFeedMeta] = useState(collarFeedMeta);
  const [feedStatus, setFeedStatus] = useState("Snapshot fallback");
  const [feedNotice, setFeedNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [watchlist, setWatchlist] = useState(() => readStoredArray(WATCHLIST_KEY));
  const [alertsEnabled, setAlertsEnabled] = useState(() => window.localStorage.getItem(ALERTS_KEY) === "enabled");
  const [alertThreshold, setAlertThreshold] = useState(
    () => Number(window.localStorage.getItem(ALERT_THRESHOLD_KEY)) || 82,
  );
  const lastAlertRef = useRef("");

  const refreshFeed = useCallback(async (signal) => {
    setRefreshing(true);
    try {
      const payload = await fetchLiveCreditCollars({ signal });
      setFeedCandidates(payload.candidates);
      setFeedMeta({
        ...collarFeedMeta,
        asOf: formatTimestamp(payload.asOf),
        source: payload.source ?? collarFeedMeta.source,
      });
      setFeedStatus(payload.degraded ? "Live partial" : "Live feed");
      setFeedNotice(payload.degraded ? "Live feed is partial — showing verified snapshot coverage where needed." : "");
    } catch {
      setFeedStatus("Snapshot fallback");
      setFeedNotice("Live feed unavailable — showing the verified snapshot fallback.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const initialRefresh = window.setTimeout(() => refreshFeed(controller.signal), 0);
    const interval = window.setInterval(() => refreshFeed(controller.signal), 45_000);
    return () => {
      controller.abort();
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, [refreshFeed]);

  const rankedCollars = useMemo(() => {
    const source = filterCandidates(feedCandidates, universe, watchlist);
    return optimizeCreditCollars(source, profileId);
  }, [feedCandidates, profileId, universe, watchlist]);

  const allUniverses = useMemo(
    () => ["All", "Watchlist", ...new Set(feedCandidates.map((candidate) => candidate.universe))],
    [feedCandidates],
  );

  const primary = rankedCollars[0];
  const runnersUp = rankedCollars.slice(1, 7);

  useEffect(() => {
    if (!primary || !alertsEnabled || primary.score < alertThreshold || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const alertKey = `${primary.id}-${profileId}-${alertThreshold}`;
    if (lastAlertRef.current === alertKey) return;

    lastAlertRef.current = alertKey;
    new Notification(`BR3N collar: ${primary.symbol} scored ${primary.score}`, {
      body: `+${formatCurrency(primary.netCredit)} credit, floor ${primary.floorDrawdownPct}% below spot, cap ${primary.upsideToCallPct}%.`,
      icon: `${import.meta.env.BASE_URL}app-icon.svg`,
      tag: alertKey,
    });
  }, [alertThreshold, alertsEnabled, primary, profileId]);

  const toggleWatchlist = (symbol) => {
    setWatchlist((current) => {
      const next = current.includes(symbol)
        ? current.filter((item) => item !== symbol)
        : [...current, symbol];
      window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleAlerts = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
    }
    const next = !alertsEnabled;
    window.localStorage.setItem(ALERTS_KEY, next ? "enabled" : "disabled");
    setAlertsEnabled(next);
  };

  const updateAlertThreshold = (event) => {
    const next = Number(event.target.value);
    window.localStorage.setItem(ALERT_THRESHOLD_KEY, String(next));
    setAlertThreshold(next);
  };

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
          <div aria-label="Feed status" aria-live="polite" className="br3n-collar-status">
            <span>
              <Radio size={14} />
              {feedStatus}
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
                aria-pressed={profile.id === profileId}
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
                aria-pressed={item === universe}
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

        <div className="br3n-collar-automation">
          <button disabled={refreshing} onClick={() => refreshFeed()} type="button">
            <RefreshCw className={refreshing ? "is-spinning" : ""} size={14} />
            {refreshing ? "Refreshing" : "Refresh live feed"}
          </button>
          <button className={alertsEnabled ? "is-active" : ""} onClick={toggleAlerts} type="button">
            <Bell size={14} />
            {alertsEnabled ? "Alerts on" : "Enable alerts"}
          </button>
          <label>
            Alert score
            <input
              aria-valuemax="95"
              aria-valuemin="70"
              aria-valuenow={alertThreshold}
              aria-valuetext={`${alertThreshold} minimum score`}
              max="95"
              min="70"
              onChange={updateAlertThreshold}
              type="range"
              value={alertThreshold}
            />
            <span>{alertThreshold}+</span>
          </label>
        </div>

        {feedNotice ? <div className="br3n-collar-feed-note">{feedNotice}</div> : null}

        {primary ? (
          <PrimaryCollarCard
            collar={primary}
            isWatched={watchlist.includes(primary.symbol)}
            onToggleWatchlist={toggleWatchlist}
          />
        ) : (
          <EmptyCollarState />
        )}
      </div>

      <div className="br3n-collar-sidecar">
        <div className="br3n-collar-feed-head">
          <span>
            <Clock3 size={13} />
            {feedMeta.asOf}
          </span>
          <strong>
            {feedMeta.source} · {feedMeta.cadence}
          </strong>
        </div>

        <div className="br3n-collar-list">
          {runnersUp.map((collar) => (
            <CollarRow
              collar={collar}
              isWatched={watchlist.includes(collar.symbol)}
              key={collar.id}
              onToggleWatchlist={toggleWatchlist}
            />
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

function PrimaryCollarCard({ collar, isWatched, onToggleWatchlist }) {
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
          <div className="br3n-collar-title-actions">
            <button
              aria-label={`${isWatched ? "Remove" : "Add"} ${collar.symbol} ${isWatched ? "from" : "to"} watchlist`}
              className={isWatched ? "is-active" : ""}
              onClick={() => onToggleWatchlist(collar.symbol)}
              type="button"
            >
              <Star size={14} />
            </button>
            <strong>{formatCurrency(collar.spot)}</strong>
          </div>
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

function CollarRow({ collar, isWatched, onToggleWatchlist }) {
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
      <button
        aria-label={`${isWatched ? "Remove" : "Add"} ${collar.symbol} ${isWatched ? "from" : "to"} watchlist`}
        className={isWatched ? "is-active" : ""}
        onClick={() => onToggleWatchlist(collar.symbol)}
        type="button"
      >
        <Star size={13} />
      </button>
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

function filterCandidates(candidates, universe, watchlist) {
  if (universe === "Watchlist") {
    return candidates.filter((candidate) => watchlist.includes(candidate.symbol));
  }

  if (universe === "All") return candidates;
  return candidates.filter((candidate) => candidate.universe === universe);
}

function readStoredArray(key) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatTimestamp(value) {
  if (!value) return collarFeedMeta.asOf;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
