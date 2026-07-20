export const collarOptimizationProfiles = [
  {
    id: "balanced",
    label: "Balanced",
    description: "Balances positive credit, downside floor, liquidity, and room before assignment.",
    maxFloorDrawdownPct: 12,
    targetCreditPct: 1.2,
    minUpsidePct: 6,
    weights: {
      credit: 0.3,
      protection: 0.34,
      liquidity: 0.2,
      upside: 0.16,
    },
  },
  {
    id: "protection",
    label: "Downside first",
    description: "Ranks tighter floors higher, even when the received credit is smaller.",
    maxFloorDrawdownPct: 9,
    targetCreditPct: 0.7,
    minUpsidePct: 4.5,
    weights: {
      credit: 0.18,
      protection: 0.52,
      liquidity: 0.18,
      upside: 0.12,
    },
  },
  {
    id: "income",
    label: "Credit first",
    description: "Prioritizes larger net credits while still rejecting weak protection.",
    maxFloorDrawdownPct: 14,
    targetCreditPct: 1.8,
    minUpsidePct: 5,
    weights: {
      credit: 0.48,
      protection: 0.22,
      liquidity: 0.18,
      upside: 0.12,
    },
  },
];

export const collarFeedMeta = {
  asOf: "2026-07-20 11:12 UTC",
  cadence: "45s optimizer loop",
  source: "Delayed Cboe option snapshot; live adapter-ready",
  disclaimer:
    "Research candidates only. Quotes can move quickly; validate live bid/ask, tax impact, assignment risk, and portfolio fit before acting.",
};

export const creditCollarCandidates = [
  {
    id: "qqq-oct-620-745",
    symbol: "QQQ",
    name: "Nasdaq 100 ETF",
    universe: "Index",
    spot: 700.42,
    iv30: 26.16,
    expiration: "2026-10-16",
    dte: 88,
    putStrike: 620,
    putBid: 11.86,
    putAsk: 12.35,
    callStrike: 745,
    callBid: 14.61,
    callAsk: 15.22,
    putOpenInterest: 9914,
    callOpenInterest: 2448,
    putVolume: 254,
    callVolume: 70,
    tags: ["Nasdaq", "Mega-cap tech", "Index hedge"],
  },
  {
    id: "spy-oct-670-780",
    symbol: "SPY",
    name: "S&P 500 ETF",
    universe: "Index",
    spot: 745.95,
    iv30: 15.09,
    expiration: "2026-10-16",
    dte: 88,
    putStrike: 670,
    putBid: 6.92,
    putAsk: 7.08,
    callStrike: 780,
    callBid: 7.89,
    callAsk: 8.12,
    putOpenInterest: 1088,
    callOpenInterest: 2582,
    putVolume: 146,
    callVolume: 272,
    tags: ["S&P 500", "Core beta", "Index hedge"],
  },
  {
    id: "nvda-oct-180-220",
    symbol: "NVDA",
    name: "NVIDIA",
    universe: "AI leaders",
    spot: 204.25,
    iv30: 41.32,
    expiration: "2026-10-16",
    dte: 88,
    putStrike: 180,
    putBid: 7.55,
    putAsk: 7.9,
    callStrike: 220,
    callBid: 11.2,
    callAsk: 11.65,
    putOpenInterest: 11695,
    callOpenInterest: 69162,
    putVolume: 1002,
    callVolume: 1106,
    tags: ["AI compute", "Semiconductor", "High liquidity"],
  },
  {
    id: "msft-sep-350-420",
    symbol: "MSFT",
    name: "Microsoft",
    universe: "AI leaders",
    spot: 392.42,
    iv30: 45.27,
    expiration: "2026-09-18",
    dte: 60,
    putStrike: 350,
    putBid: 8.35,
    putAsk: 8.6,
    callStrike: 420,
    callBid: 16.65,
    callAsk: 17.2,
    putOpenInterest: 11085,
    callOpenInterest: 10908,
    putVolume: 305,
    callVolume: 2843,
    tags: ["AI platform", "Cloud", "Mega-cap"],
  },
  {
    id: "googl-sep-310-370",
    symbol: "GOOGL",
    name: "Alphabet",
    universe: "AI leaders",
    spot: 348.12,
    iv30: 39.85,
    expiration: "2026-09-18",
    dte: 60,
    putStrike: 310,
    putBid: 7.0,
    putAsk: 7.2,
    callStrike: 370,
    callBid: 12.25,
    callAsk: 12.8,
    putOpenInterest: 4630,
    callOpenInterest: 3173,
    putVolume: 340,
    callVolume: 279,
    tags: ["AI search", "Cloud", "Mega-cap"],
  },
  {
    id: "meta-sep-570-685",
    symbol: "META",
    name: "Meta Platforms",
    universe: "AI leaders",
    spot: 643.65,
    iv30: 54.61,
    expiration: "2026-09-18",
    dte: 60,
    putStrike: 570,
    putBid: 18.4,
    putAsk: 19.05,
    callStrike: 685,
    callBid: 37.8,
    callAsk: 39.05,
    putOpenInterest: 2418,
    callOpenInterest: 1198,
    putVolume: 28,
    callVolume: 54,
    tags: ["AI infrastructure", "Ad tech", "Higher credit"],
  },
  {
    id: "amzn-sep-220-265",
    symbol: "AMZN",
    name: "Amazon",
    universe: "AI leaders",
    spot: 247.4,
    iv30: 42.94,
    expiration: "2026-09-18",
    dte: 60,
    putStrike: 220,
    putBid: 5.05,
    putAsk: 5.25,
    callStrike: 265,
    callBid: 9.5,
    callAsk: 9.9,
    putOpenInterest: 13745,
    callOpenInterest: 6572,
    putVolume: 452,
    callVolume: 271,
    tags: ["AWS", "AI services", "Retail beta"],
  },
  {
    id: "avgo-sep-330-400",
    symbol: "AVGO",
    name: "Broadcom",
    universe: "Semiconductors",
    spot: 374.5,
    iv30: 52.57,
    expiration: "2026-09-18",
    dte: 60,
    putStrike: 330,
    putBid: 15.7,
    putAsk: 16.35,
    callStrike: 400,
    callBid: 23.05,
    callAsk: 24.05,
    putOpenInterest: 5755,
    callOpenInterest: 8506,
    putVolume: 401,
    callVolume: 685,
    tags: ["AI networking", "Semiconductor", "Infrastructure"],
  },
  {
    id: "pltr-sep-120-140",
    symbol: "PLTR",
    name: "Palantir",
    universe: "AI software",
    spot: 130.91,
    iv30: 67.27,
    expiration: "2026-09-18",
    dte: 60,
    putStrike: 120,
    putBid: 7.25,
    putAsk: 7.5,
    callStrike: 140,
    callBid: 10.3,
    callAsk: 10.7,
    putOpenInterest: 18010,
    callOpenInterest: 5840,
    putVolume: 600,
    callVolume: 289,
    tags: ["AI software", "High beta", "Tighter floor"],
  },
  {
    id: "tsla-sep-340-405",
    symbol: "TSLA",
    name: "Tesla",
    universe: "AI high beta",
    spot: 381.99,
    iv30: 48.11,
    expiration: "2026-09-18",
    dte: 60,
    putStrike: 340,
    putBid: 11.2,
    putAsk: 11.6,
    callStrike: 405,
    callBid: 20.2,
    callAsk: 21.05,
    putOpenInterest: 9687,
    callOpenInterest: 1855,
    putVolume: 633,
    callVolume: 67,
    tags: ["AI autonomy", "High beta", "Event risk"],
  },
];

export function enrichCreditCollar(candidate, profileId = "balanced") {
  const profile = getCollarProfile(profileId);
  const netCredit = round(candidate.callBid - candidate.putAsk, 2);
  const netCreditPct = percent(netCredit, candidate.spot);
  const downsideGapPct = percent(candidate.spot - candidate.putStrike, candidate.spot);
  const upsideToCallPct = percent(candidate.callStrike - candidate.spot, candidate.spot);
  const floorValue = candidate.putStrike + netCredit;
  const floorDrawdownPct = percent(candidate.spot - floorValue, candidate.spot);
  const maxUpsidePct = percent(candidate.callStrike - candidate.spot + netCredit, candidate.spot);
  const liquidityScore = scoreLiquidity(candidate);
  const creditScore = clamp((netCreditPct / profile.targetCreditPct) * 100, 0, 100);
  const protectionScore = clamp(
    ((profile.maxFloorDrawdownPct - floorDrawdownPct) / profile.maxFloorDrawdownPct) * 100,
    0,
    100,
  );
  const upsideScore = clamp((maxUpsidePct / profile.minUpsidePct) * 72, 0, 100);
  const score = Math.round(
    creditScore * profile.weights.credit +
      protectionScore * profile.weights.protection +
      liquidityScore * profile.weights.liquidity +
      upsideScore * profile.weights.upside,
  );

  return {
    ...candidate,
    score,
    netCredit,
    netCreditPct: round(netCreditPct, 2),
    downsideGapPct: round(downsideGapPct, 1),
    floorValue: round(floorValue, 2),
    floorDrawdownPct: round(floorDrawdownPct, 1),
    upsideToCallPct: round(upsideToCallPct, 1),
    maxUpsidePct: round(maxUpsidePct, 1),
    liquidityScore: Math.round(liquidityScore),
    creditScore: Math.round(creditScore),
    protectionScore: Math.round(protectionScore),
    upsideScore: Math.round(upsideScore),
    scoreLabel: getScoreLabel(score),
  };
}

export function optimizeCreditCollars(candidates = creditCollarCandidates, profileId = "balanced") {
  return candidates
    .map((candidate) => enrichCreditCollar(candidate, profileId))
    .filter((candidate) => candidate.netCredit > 0)
    .sort((a, b) => b.score - a.score || b.netCreditPct - a.netCreditPct);
}

export function getCollarProfile(profileId) {
  return (
    collarOptimizationProfiles.find((profile) => profile.id === profileId) ??
    collarOptimizationProfiles[0]
  );
}

function scoreLiquidity(candidate) {
  const minimumOpenInterest = Math.min(candidate.putOpenInterest, candidate.callOpenInterest);
  const minimumVolume = Math.min(candidate.putVolume, candidate.callVolume);
  const openInterestScore = clamp((Math.sqrt(minimumOpenInterest) / Math.sqrt(2500)) * 72, 0, 72);
  const volumeScore = clamp((Math.sqrt(minimumVolume) / Math.sqrt(300)) * 28, 0, 28);
  return openInterestScore + volumeScore;
}

function getScoreLabel(score) {
  if (score >= 82) return "Prime feed";
  if (score >= 72) return "Watchlist";
  return "Needs review";
}

function percent(numerator, denominator) {
  return (numerator / denominator) * 100;
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
