export const coinbaseBasisStrategy = {
  id: "coinbase-basis-carry",
  name: "Coinbase perp/spot basis scanner",
  basisFormula: "basis = (perp / spot) - 1",
  expectedProfitFormula:
    "expected_profit = expected_funding + expected_basis_convergence - spot_fees - perp_fees - slippage - financing_carry - safety_buffer",
  direction: "Long spot and short perpetual when positive basis clears costs.",
  disclaimer:
    "Research scanner only. Validate market access, borrow/cash availability, live depth, funding mechanics, tax impact, and account suitability before any manual trade decision.",
};

export const coinbaseBasisDefaults = {
  fundingIntervals: 3,
  basisConvergenceFraction: 0.65,
  spotFeeRate: 0.0008,
  perpFeeRate: 0.0006,
  slippageRate: 0.0007,
  financingCarryRate: 0.0002,
  safetyBufferRate: 0.0015,
  minimumBasis: 0.0025,
  minimumExpectedProfit: 0.002,
};

export const coinbaseBasisFallbackCandidates = [
  {
    asset: "BTC",
    spotProduct: "BTC-USDC",
    perpProduct: "BTC-PERP",
    spotPrice: 64250,
    perpPrice: 64610,
    predictedFundingRate: 0.00014,
    spotSpreadRate: 0.00012,
    perpSpreadRate: 0.00016,
    source: "Static Coinbase INTX-style snapshot",
  },
  {
    asset: "ETH",
    spotProduct: "ETH-USDC",
    perpProduct: "ETH-PERP",
    spotPrice: 3480,
    perpPrice: 3495,
    predictedFundingRate: 0.00011,
    spotSpreadRate: 0.00016,
    perpSpreadRate: 0.0002,
    source: "Static Coinbase INTX-style snapshot",
  },
  {
    asset: "SOL",
    spotProduct: "SOL-USDC",
    perpProduct: "SOL-PERP",
    spotPrice: 184.2,
    perpPrice: 184.92,
    predictedFundingRate: 0.00009,
    spotSpreadRate: 0.00022,
    perpSpreadRate: 0.0003,
    source: "Static Coinbase INTX-style snapshot",
  },
  {
    asset: "XRP",
    spotProduct: "XRP-USDC",
    perpProduct: "XRP-PERP",
    spotPrice: 0.614,
    perpPrice: 0.6152,
    predictedFundingRate: 0.00005,
    spotSpreadRate: 0.0003,
    perpSpreadRate: 0.00038,
    source: "Static Coinbase INTX-style snapshot",
  },
];

export function rankCoinbaseBasisCandidates(candidates, options = {}) {
  return candidates
    .map((candidate) => enrichCoinbaseBasisCandidate(candidate, options))
    .filter((candidate) => Number.isFinite(candidate.expectedProfit))
    .sort((a, b) => b.expectedProfit - a.expectedProfit || b.basis - a.basis);
}

export function enrichCoinbaseBasisCandidate(candidate, options = {}) {
  const config = { ...coinbaseBasisDefaults, ...options };
  const spotPrice = positiveNumber(candidate.spotPrice);
  const perpPrice = positiveNumber(candidate.perpPrice);
  const basis = calculateCoinbaseBasis({ spotPrice, perpPrice });
  const predictedFundingRate = numberOrDefault(candidate.predictedFundingRate, 0);
  const expectedFunding = numberOrDefault(
    candidate.expectedFunding,
    predictedFundingRate * config.fundingIntervals,
  );
  const basisConvergenceFraction = numberOrDefault(
    candidate.basisConvergenceFraction,
    config.basisConvergenceFraction,
  );
  const expectedBasisConvergence =
    Math.max(basis, 0) * clamp(basisConvergenceFraction, 0, 1);
  const spotFees = numberOrDefault(candidate.spotFees, config.spotFeeRate);
  const perpFees = numberOrDefault(candidate.perpFees, config.perpFeeRate);
  const slippage =
    numberOrDefault(candidate.slippage, config.slippageRate) +
    numberOrDefault(candidate.spotSpreadRate, 0) / 2 +
    numberOrDefault(candidate.perpSpreadRate, 0) / 2;
  const financingCarry = numberOrDefault(
    candidate.financingCarry,
    config.financingCarryRate,
  );
  const safetyBuffer = numberOrDefault(candidate.safetyBuffer, config.safetyBufferRate);
  const expectedProfit = calculateExpectedProfit({
    expectedFunding,
    expectedBasisConvergence,
    spotFees,
    perpFees,
    slippage,
    financingCarry,
    safetyBuffer,
  });
  const reviewFlags = buildBasisReviewFlags({
    basis,
    expectedFunding,
    expectedProfit,
    spotSpreadRate: numberOrDefault(candidate.spotSpreadRate, 0),
    perpSpreadRate: numberOrDefault(candidate.perpSpreadRate, 0),
    config,
  });

  return {
    ...candidate,
    asset: String(candidate.asset ?? "").toUpperCase(),
    spotPrice,
    perpPrice,
    basis,
    basisPct: roundPct(basis),
    predictedFundingRate,
    expectedFunding,
    expectedFundingPct: roundPct(expectedFunding),
    expectedBasisConvergence,
    expectedBasisConvergencePct: roundPct(expectedBasisConvergence),
    spotFees,
    perpFees,
    slippage,
    financingCarry,
    safetyBuffer,
    expectedProfit,
    expectedProfitPct: roundPct(expectedProfit),
    score: scoreBasisCandidate({ basis, expectedFunding, expectedProfit, config }),
    scoreLabel: getBasisScoreLabel(expectedProfit, config),
    direction: basis >= 0 ? "long_spot_short_perp" : "skip_negative_basis",
    status:
      basis >= config.minimumBasis && expectedProfit >= config.minimumExpectedProfit
        ? "candidate"
        : "monitor",
    reviewFlags: reviewFlags.length ? reviewFlags : ["none"],
    calculation: {
      basis: "(perp / spot) - 1",
      expectedProfit:
        "expectedFunding + expectedBasisConvergence - spotFees - perpFees - slippage - financingCarry - safetyBuffer",
    },
  };
}

export function calculateCoinbaseBasis({ spotPrice, perpPrice }) {
  const spot = positiveNumber(spotPrice);
  const perp = positiveNumber(perpPrice);
  return perp / spot - 1;
}

export function calculateExpectedProfit({
  expectedFunding,
  expectedBasisConvergence,
  spotFees,
  perpFees,
  slippage,
  financingCarry,
  safetyBuffer,
}) {
  return (
    expectedFunding +
    expectedBasisConvergence -
    spotFees -
    perpFees -
    slippage -
    financingCarry -
    safetyBuffer
  );
}

function buildBasisReviewFlags({
  basis,
  expectedFunding,
  expectedProfit,
  spotSpreadRate,
  perpSpreadRate,
  config,
}) {
  const flags = [];
  if (basis < 0) flags.push("negative_basis");
  if (basis < config.minimumBasis) flags.push("basis_below_threshold");
  if (expectedFunding < 0) flags.push("funding_cost_to_short_perp");
  if (expectedProfit < config.minimumExpectedProfit) {
    flags.push("expected_profit_below_buffered_hurdle");
  }
  if (spotSpreadRate + perpSpreadRate > 0.0025) flags.push("wide_combined_spread");
  return flags;
}

function scoreBasisCandidate({ basis, expectedFunding, expectedProfit, config }) {
  const profitScore = clamp(
    (expectedProfit / Math.max(config.minimumExpectedProfit * 2, 0.0001)) * 58,
    0,
    58,
  );
  const basisScore = clamp((Math.max(basis, 0) / 0.015) * 24, 0, 24);
  const fundingScore = clamp(((expectedFunding + 0.0005) / 0.002) * 12, 0, 12);
  const hurdleBonus =
    basis >= config.minimumBasis && expectedProfit >= config.minimumExpectedProfit ? 6 : 0;
  return Math.round(clamp(profitScore + basisScore + fundingScore + hurdleBonus, 0, 100));
}

function getBasisScoreLabel(expectedProfit, config) {
  if (expectedProfit >= config.minimumExpectedProfit * 2) return "Prime carry";
  if (expectedProfit >= config.minimumExpectedProfit) return "Qualified";
  return "Monitor";
}

function positiveNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive market price, received ${value}.`);
  }
  return parsed;
}

function numberOrDefault(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundPct(value) {
  return Math.round((value * 100 + Number.EPSILON) * 1000) / 1000;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
