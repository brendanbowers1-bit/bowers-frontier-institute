export const marketPulseSnapshot = {
  isIllustrative: true,
  label: "Illustrative intelligence concept",
  disclaimer: "Sample dashboard state - not live market data.",
  title: "Executive cockpit",
  verdict:
    "Sample read: constructive risk appetite with rate pressure still defining the edge of the map.",
  lead:
    "A prototype executive pulse layout for fast interpretation. Live feeds, timestamps, and source validation can be wired in later.",
  status: "Concept preview",
  metrics: [
    {
      id: "market-pulse",
      label: "Market pulse",
      value: "Risk-on",
      detail: "Sample liquidity and trend conditions are constructive.",
      tone: "positive",
    },
    {
      id: "macro-pressure",
      label: "Macro pressure",
      value: "Moderate",
      detail: "Rates remain the main constraint on duration.",
      tone: "watch",
    },
    {
      id: "fx-hedge-mode",
      label: "FX hedge mode",
      value: "Selective",
      detail: "Hedge adverse exposure first; avoid blanket action.",
      tone: "neutral",
    },
    {
      id: "data-quality",
      label: "Data quality",
      value: "Concept",
      detail: "Designed to show future feed freshness and completeness checks.",
      tone: "neutral",
    },
  ],
  compositeSignal: {
    label: "Constructive",
    title: "Risk appetite trend",
    description:
      "Sample trend quality is firm enough to rank opportunities, but not strong enough to ignore macro pressure.",
    points: [18, 23, 21, 29, 34, 31, 39, 43, 41, 48, 52, 49, 57, 61, 65, 63, 70, 74],
  },
  regimeSignals: [
    { id: "liquidity", label: "Liquidity", score: 82, direction: "Improving" },
    { id: "momentum", label: "Momentum", score: 76, direction: "Positive" },
    { id: "volatility", label: "Volatility", score: 41, direction: "Contained" },
    { id: "credit-stress", label: "Credit stress", score: 34, direction: "Low" },
    { id: "policy-risk", label: "Policy risk", score: 58, direction: "Elevated" },
  ],
  intelligenceQueue: [
    {
      id: "watch-real-yields",
      title: "Watch real yields before adding duration.",
      meta: "Macro",
      priority: "High",
    },
    {
      id: "rank-weekly-setups",
      title: "Rank weekly setups only after volatility filter clears.",
      meta: "Trading",
      priority: "High",
    },
    {
      id: "run-hedge-doctor",
      title: "Run hedge doctor before memo generation.",
      meta: "Treasury",
      priority: "Medium",
    },
    {
      id: "refresh-market-pulse",
      title: "Refresh market pulse snapshot before publishing.",
      meta: "Data",
      priority: "Medium",
    },
  ],
  assetReadings: [
    { id: "btc", name: "BTC", change: "+3.8%", state: "Leadership" },
    { id: "eth", name: "ETH", change: "+2.1%", state: "Confirming" },
    { id: "usd", name: "USD", change: "-0.4%", state: "Softening" },
    { id: "ten-year", name: "10Y", change: "+6bp", state: "Pressure" },
  ],
};
