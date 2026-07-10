export const weeklyTradeDiscovery = [
  {
    id: "market-regime",
    step: "01",
    title: "Map the weekly regime",
    summary:
      "Score liquidity, trend, volatility, and macro catalysts before a trade idea is allowed into review.",
    signals: ["Liquidity", "Volatility", "Macro events"],
  },
  {
    id: "trade-shortlist",
    step: "02",
    title: "Build the candidate stack",
    summary:
      "Compare directional, relative-value, hedge, and cash-secured setups against the same risk template.",
    signals: ["Momentum", "Carry", "Mean reversion"],
  },
  {
    id: "risk-gate",
    step: "03",
    title: "Select the best-fit trade",
    summary:
      "Rank the shortlist by expected edge, downside containment, execution quality, and clean invalidation.",
    signals: ["R/R", "Invalidation", "Execution"],
  },
];

export const recommendationScorecard = [
  {
    id: "edge-quality",
    label: "Edge quality",
    weight: "30%",
    description:
      "Evidence that the setup has a real imbalance: trend strength, relative value, carry, catalyst asymmetry, or volatility mispricing.",
  },
  {
    id: "risk-design",
    label: "Risk design",
    weight: "25%",
    description:
      "Clear invalidation, defined loss budget, position sizing logic, and no dependency on averaging down.",
  },
  {
    id: "liquidity-execution",
    label: "Liquidity and execution",
    weight: "20%",
    description:
      "Tight spread, usable depth, clean entry window, and fees/slippage small enough to preserve the expected edge.",
  },
  {
    id: "catalyst-timing",
    label: "Catalyst timing",
    weight: "15%",
    description:
      "A visible weekly reason for the trade to work or be cancelled, including macro events and volatility windows.",
  },
  {
    id: "portfolio-fit",
    label: "Portfolio fit",
    weight: "10%",
    description:
      "Low redundancy with existing exposures, manageable correlation, and no concentration that would dominate weekly risk.",
  },
];

export const recommendationTiers = [
  {
    id: "primary",
    name: "Primary recommendation",
    score: "85-100",
    guidance:
      "Eligible for the weekly note when the setup has a strong thesis, clean execution, and a predefined cancellation point.",
  },
  {
    id: "watchlist",
    name: "Watchlist only",
    score: "70-84",
    guidance:
      "Worth monitoring, but it needs a better entry, tighter risk, or a confirming catalyst before it becomes actionable.",
  },
  {
    id: "no-trade",
    name: "No-trade decision",
    score: "Below 70",
    guidance:
      "Rejected for the week. Capital preservation beats forcing a recommendation when the evidence is not strong enough.",
  },
];

export const noTradeGates = [
  "No defined invalidation before entry",
  "Reward-to-risk below 2:1 after fees and slippage",
  "Liquidity too thin for the intended size",
  "Major event risk without a hedging or sizing plan",
  "Trade duplicates an existing exposure",
];

export const exampleWeeklyTradeNote = {
  label: "Example output",
  setup: "BTC breakout continuation watchlist",
  tier: "Watchlist only",
  score: 78,
  summary:
    "A liquid trend-continuation idea that has momentum and clean invalidation, but needs confirmed breakout follow-through before it can become a primary recommendation.",
  breakdown: [
    { label: "Edge quality", score: 24, max: 30 },
    { label: "Risk design", score: 19, max: 25 },
    { label: "Liquidity and execution", score: 18, max: 20 },
    { label: "Catalyst timing", score: 10, max: 15 },
    { label: "Portfolio fit", score: 7, max: 10 },
  ],
  thesis:
    "BTC is holding above a prior resistance zone with improving momentum and strong liquidity. The setup improves only if price confirms above the weekly breakout area with volume expansion.",
  entryLogic:
    "Do not chase an intraday spike. Re-score after a confirmed close above the breakout zone and only proceed if reward-to-risk remains at least 2:1 after estimated fees and slippage.",
  invalidation:
    "Cancel the idea if price closes back below the breakout zone, volatility expands without follow-through, or liquidity thins before entry.",
  riskBudget:
    "Maximum loss capped at 0.50% of portfolio risk for the week while the idea remains below primary-recommendation status.",
  noTradeTriggers: [
    "No confirmed breakout",
    "Reward-to-risk falls below 2:1",
    "Spread or depth worsens before entry",
    "Major event risk appears without a sizing plan",
  ],
  recommendation:
    "Wait. Keep on watchlist until confirmation improves the score to 85 or higher and all no-trade gates remain clear.",
};

export const weeklyTradeOutput = {
  label: "Weekly output",
  title: "One highest-quality setup, not a prediction",
  body:
    "Each week produces a research note with the chosen setup, why it ranked first, entry logic, invalidation level, risk budget, and the conditions that would cancel the trade. If no setup clears the gates, the recommendation is to wait.",
  fields: [
    "Trade thesis",
    "Score and tier",
    "Entry and invalidation",
    "Position risk",
    "Catalyst calendar",
    "No-trade trigger",
  ],
};
