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

export const weeklyTradeOutput = {
  label: "Weekly output",
  title: "One highest-quality setup, not a prediction",
  body:
    "Each week produces a research note with the chosen setup, why it ranked first, entry logic, invalidation level, risk budget, and conditions that would cancel the trade.",
  fields: [
    "Trade thesis",
    "Entry and invalidation",
    "Position risk",
    "Catalyst calendar",
    "No-trade trigger",
  ],
};
