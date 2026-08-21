import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BanknoteArrowDown,
  Clock3,
  ExternalLink,
  LockKeyhole,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import {
  customerSegments,
  faqs,
  guardrails,
  productSteps,
  settlementRails,
} from "../data/goodFunds";
import "./GoodFundsLanding.css";

const assetOptions = {
  BTC: {
    label: "Bitcoin",
    network: "Bitcoin mainnet",
    illustrativeRate: 118400,
    decimals: 8,
  },
  USDC: {
    label: "USDC",
    network: "Base or Solana",
    illustrativeRate: 1,
    decimals: 2,
  },
};

const railFeeRates = {
  "rtp-fednow": 0.006,
  wire: 0.008,
  "direct-deposit": 0.004,
  "debit-card": 0.026,
  ach: 0.003,
};

const statusLabels = {
  good: "Good funds",
  review: "Risk-limited",
  hold: "Hold required",
};

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function GoodFundsMark() {
  return (
    <span className="goodfunds-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function RailStatus({ status }) {
  return <span className={`rail-status rail-status--${status}`}>{statusLabels[status]}</span>;
}

export function GoodFundsLanding() {
  const [selectedRailId, setSelectedRailId] = useState("rtp-fednow");
  const [asset, setAsset] = useState("USDC");
  const [amount, setAmount] = useState(2500);
  const [walletAddress, setWalletAddress] = useState("");
  const [pilotSubmitted, setPilotSubmitted] = useState(false);

  const selectedRail = settlementRails.find((rail) => rail.id === selectedRailId) ?? settlementRails[0];
  const selectedAsset = assetOptions[asset];

  const quote = useMemo(() => {
    const normalizedAmount = Number.isFinite(Number(amount)) ? Math.max(Number(amount), 0) : 0;
    const fee = normalizedAmount * railFeeRates[selectedRail.id];
    const net = Math.max(normalizedAmount - fee, 0);
    const units = net / selectedAsset.illustrativeRate;
    const locked = selectedRail.status === "hold";

    return {
      fee,
      locked,
      net,
      units,
      delivery: locked ? "Unlocks after bank settlement" : selectedRail.walletAccess,
    };
  }, [amount, selectedAsset.illustrativeRate, selectedRail]);

  const canPreview = walletAddress.trim().length >= 12 && Number(amount) > 0;

  function handlePilotSubmit(event) {
    event.preventDefault();
    setPilotSubmitted(true);
  }

  return (
    <main className="goodfunds" id="overview">
      <header className="goodfunds-nav" aria-label="GoodFunds navigation">
        <a className="goodfunds-brand" href="#overview" aria-label="GoodFunds home">
          <GoodFundsMark />
          <span>GoodFunds</span>
        </a>
        <nav className="goodfunds-nav__links" aria-label="Primary">
          <a href="#rails">Rails</a>
          <a href="#product">Product</a>
          <a href="#pilot">Pilot</a>
          <a href="#dashboard">BR3N</a>
        </nav>
      </header>

      <section className="goodfunds-hero">
        <div className="goodfunds-hero__copy">
          <p className="goodfunds-eyebrow">Same-day fiat to self-custody</p>
          <h1>If the money is settled, the crypto is yours immediately.</h1>
          <p className="goodfunds-hero__lead">
            GoodFunds is a settlement-aware on-ramp for people and businesses that need bank
            money converted into BTC or USDC and delivered to an external wallet today.
          </p>
          <div className="goodfunds-hero__actions">
            <a className="goodfunds-button goodfunds-button--primary" href="#pilot">
              Join the pilot <ArrowRight size={16} />
            </a>
            <a className="goodfunds-button" href="#rails">
              See settlement rails
            </a>
          </div>
          <div className="goodfunds-proof">
            <span>
              <ShieldCheck size={16} /> Honest holds
            </span>
            <span>
              <BanknoteArrowDown size={16} /> Good-funds routing
            </span>
            <span>
              <WalletCards size={16} /> External wallet delivery
            </span>
          </div>
        </div>

        <aside className="quote-card" aria-label="GoodFunds quote preview">
          <div className="quote-card__header">
            <p>Live product logic</p>
            <RailStatus status={selectedRail.status} />
          </div>
          <div className="quote-card__amount">
            <span>Send</span>
            <strong>{formatUsd(Number(amount) || 0)}</strong>
          </div>
          <div className="quote-grid">
            <div>
              <span>Rail</span>
              <strong>{selectedRail.name}</strong>
            </div>
            <div>
              <span>Asset</span>
              <strong>{asset}</strong>
            </div>
            <div>
              <span>Fee</span>
              <strong>{formatUsd(quote.fee)}</strong>
            </div>
            <div>
              <span>Delivery</span>
              <strong>{quote.delivery}</strong>
            </div>
          </div>
          <div className="quote-card__result">
            <span>Estimated wallet receipt</span>
            <strong>
              {quote.units.toLocaleString("en-US", {
                maximumFractionDigits: selectedAsset.decimals,
              })}{" "}
              {asset}
            </strong>
            <small>Illustrative quote only. No trade is executed in this demo.</small>
          </div>
        </aside>
      </section>

      <section className="goodfunds-section goodfunds-section--tight" id="rails">
        <div className="goodfunds-section__header">
          <p className="goodfunds-eyebrow">The missing distinction</p>
          <h2>Instant trading credit is not the same as withdrawable crypto.</h2>
          <p>
            The MVP makes settlement status visible before a user commits. Good rails release
            today. Reversible rails show a clear hold and unlock date.
          </p>
        </div>
        <div className="rail-grid">
          {settlementRails.map((rail) => (
            <button
              className={`rail-card ${rail.id === selectedRailId ? "is-selected" : ""}`}
              key={rail.id}
              onClick={() => setSelectedRailId(rail.id)}
              type="button"
            >
              <div className="rail-card__top">
                <span>{rail.label}</span>
                <RailStatus status={rail.status} />
              </div>
              <h3>{rail.name}</h3>
              <dl>
                <div>
                  <dt>Speed</dt>
                  <dd>{rail.speed}</dd>
                </div>
                <div>
                  <dt>Wallet</dt>
                  <dd>{rail.walletAccess}</dd>
                </div>
                <div>
                  <dt>Cost</dt>
                  <dd>{rail.fee}</dd>
                </div>
              </dl>
              <p>{rail.risk}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="goodfunds-section settlement-simulator" id="product">
        <div className="goodfunds-section__header">
          <p className="goodfunds-eyebrow">MVP simulator</p>
          <h2>Quote, disclose, and release based on settlement quality.</h2>
        </div>
        <div className="simulator-panel">
          <form className="simulator-form">
            <label>
              Funding amount
              <input
                min="100"
                onChange={(event) => setAmount(event.target.value)}
                step="100"
                type="number"
                value={amount}
              />
            </label>
            <label>
              Crypto asset
              <select onChange={(event) => setAsset(event.target.value)} value={asset}>
                {Object.entries(assetOptions).map(([symbol, option]) => (
                  <option key={symbol} value={symbol}>
                    {symbol} - {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              External wallet address
              <input
                onChange={(event) => setWalletAddress(event.target.value)}
                placeholder="Paste wallet address"
                type="text"
                value={walletAddress}
              />
            </label>
          </form>

          <div className="settlement-ticket">
            <div className="settlement-ticket__row">
              <span>Network</span>
              <strong>{selectedAsset.network}</strong>
            </div>
            <div className="settlement-ticket__row">
              <span>Settlement rule</span>
              <strong>{quote.locked ? "Hold funds" : "Release today"}</strong>
            </div>
            <div className="settlement-ticket__row">
              <span>Net conversion</span>
              <strong>{formatUsd(quote.net)}</strong>
            </div>
            <div className="settlement-ticket__notice">
              {quote.locked ? <LockKeyhole size={18} /> : <BadgeCheck size={18} />}
              <p>
                {quote.locked
                  ? "ACH can lock price now, but GoodFunds will not send crypto externally until settlement risk clears."
                  : "This rail is treated as good funds in the MVP, so external wallet release can happen after compliance checks."}
              </p>
            </div>
            <button className="goodfunds-button goodfunds-button--wide" disabled={!canPreview} type="button">
              {canPreview ? "Preview compliant release" : "Enter amount and wallet"}
            </button>
          </div>
        </div>
      </section>

      <section className="goodfunds-section">
        <div className="process-grid">
          {productSteps.map((step, index) => (
            <article className="process-card" key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{step.eyebrow}</p>
              <h3>{step.title}</h3>
              <small>{step.body}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="goodfunds-section split-section">
        <div>
          <p className="goodfunds-eyebrow">Who needs it first</p>
          <h2>Start where the hold is most painful.</h2>
        </div>
        <div className="segment-list">
          {customerSegments.map((segment) => (
            <article className="segment-card" key={segment.name}>
              <h3>{segment.name}</h3>
              <p>{segment.pain}</p>
              <strong>{segment.promise}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="goodfunds-section guardrail-section">
        <div className="goodfunds-section__header">
          <p className="goodfunds-eyebrow">Operating doctrine</p>
          <h2>Move fast by refusing to blur settlement risk.</h2>
        </div>
        <ul className="guardrail-list">
          {guardrails.map((guardrail) => (
            <li key={guardrail}>
              <ShieldCheck size={18} />
              <span>{guardrail}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="goodfunds-section faq-section">
        <div className="goodfunds-section__header">
          <p className="goodfunds-eyebrow">Founder brief</p>
          <h2>The wedge is narrow, but the platform expands.</h2>
        </div>
        <div className="faq-grid">
          {faqs.map((faq) => (
            <article className="faq-card" key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="goodfunds-section pilot-section" id="pilot">
        <div className="pilot-card">
          <div>
            <p className="goodfunds-eyebrow">Pilot intake</p>
            <h2>Build the first same-day self-custody rail with good funds only.</h2>
            <p>
              The next implementation step is wiring this interface to onboarding, quotes, partner
              liquidity, and payment rails. This form captures intent locally for now.
            </p>
          </div>
          <form className="pilot-form" onSubmit={handlePilotSubmit}>
            <label>
              Work email
              <input placeholder="founder@company.com" required type="email" />
            </label>
            <label>
              Use case
              <select required>
                <option value="">Select one</option>
                <option>Consumer self-custody</option>
                <option>Contractor payouts</option>
                <option>Business treasury</option>
                <option>On-ramp API</option>
              </select>
            </label>
            <button className="goodfunds-button goodfunds-button--primary goodfunds-button--wide" type="submit">
              Request pilot access <ExternalLink size={16} />
            </button>
            {pilotSubmitted ? (
              <p className="pilot-form__success">
                Pilot request captured in this prototype. Backend intake comes next.
              </p>
            ) : null}
          </form>
        </div>
      </section>

      <footer className="goodfunds-footer">
        <span>GoodFunds</span>
        <span>
          <Clock3 size={14} /> Settlement-aware crypto delivery
        </span>
      </footer>
    </main>
  );
}
