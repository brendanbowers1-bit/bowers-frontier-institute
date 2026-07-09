export const dashboardMetrics = [
  {
    label: "Market pulse",
    value: "Risk-on",
    detail: "Liquidity and trend conditions are constructive.",
    tone: "positive",
  },
  {
    label: "Macro pressure",
    value: "Moderate",
    detail: "Rates remain the main constraint on duration.",
    tone: "watch",
  },
  {
    label: "FX hedge mode",
    value: "Selective",
    detail: "Hedge adverse exposure first; avoid blanket action.",
    tone: "neutral",
  },
  {
    label: "Data quality",
    value: "Ready",
    detail: "Core feeds pass freshness and completeness checks.",
    tone: "positive",
  },
];

export const regimeSignals = [
  { label: "Liquidity", score: 82, direction: "Improving" },
  { label: "Momentum", score: 76, direction: "Positive" },
  { label: "Volatility", score: 41, direction: "Contained" },
  { label: "Credit stress", score: 34, direction: "Low" },
  { label: "Policy risk", score: 58, direction: "Elevated" },
];

export const intelligenceQueue = [
  {
    title: "Watch real yields before adding duration.",
    meta: "Macro",
    priority: "High",
  },
  {
    title: "Rank weekly setups only after volatility filter clears.",
    meta: "Trading",
    priority: "High",
  },
  {
    title: "Run hedge doctor before memo generation.",
    meta: "Treasury",
    priority: "Medium",
  },
  {
    title: "Refresh market pulse snapshot before publishing.",
    meta: "Data",
    priority: "Medium",
  },
];

export const assetReadings = [
  { name: "BTC", change: "+3.8%", state: "Leadership" },
  { name: "ETH", change: "+2.1%", state: "Confirming" },
  { name: "USD", change: "-0.4%", state: "Softening" },
  { name: "10Y", change: "+6bp", state: "Pressure" },
];

export const sparklinePoints = [
  18, 23, 21, 29, 34, 31, 39, 43, 41, 48, 52, 49, 57, 61, 65, 63, 70, 74,
];
