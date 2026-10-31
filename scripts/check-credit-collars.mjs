import {
  collarOptimizationProfiles,
  creditCollarCandidates,
  optimizeCreditCollars,
} from "../src/data/creditCollars.js";

const failures = [];
const fail = (message) => failures.push(message);

if (creditCollarCandidates.length < 8) {
  fail("Credit collar feed must include at least eight candidates.");
}

for (const profile of collarOptimizationProfiles) {
  const weightTotal = Object.values(profile.weights).reduce((total, weight) => total + weight, 0);
  if (Math.abs(weightTotal - 1) > 0.001) {
    fail(`Optimization profile "${profile.id}" weights must total 1.0.`);
  }

  const ranked = optimizeCreditCollars(creditCollarCandidates, profile.id);
  if (ranked.length === 0) {
    fail(`Optimization profile "${profile.id}" returned no ranked collars.`);
  }

  for (const candidate of ranked) {
    if (candidate.netCredit <= 0) {
      fail(`${candidate.symbol} ${candidate.expiration} is not a positive-credit collar.`);
    }

    if (candidate.putStrike >= candidate.spot) {
      fail(`${candidate.symbol} put strike must sit below spot for downside protection.`);
    }

    if (candidate.callStrike <= candidate.spot) {
      fail(`${candidate.symbol} call strike must sit above spot to preserve upside room.`);
    }

    if (candidate.floorDrawdownPct <= 0 || candidate.floorDrawdownPct > 15) {
      fail(`${candidate.symbol} floor drawdown ${candidate.floorDrawdownPct}% is outside feed limits.`);
    }

    if (candidate.score < 0 || candidate.score > 100) {
      fail(`${candidate.symbol} optimizer score ${candidate.score} is outside 0-100.`);
    }
  }
}

const prohibitedClaims = [/guaranteed/i, /risk[- ]?free/i, /will profit/i, /must buy/i];
const combinedCopy = JSON.stringify({ collarOptimizationProfiles, creditCollarCandidates });
for (const pattern of prohibitedClaims) {
  if (pattern.test(combinedCopy)) {
    fail(`Credit collar copy contains prohibited claim pattern: ${pattern}.`);
  }
}

if (failures.length > 0) {
  console.error("Credit collar check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Credit collar check passed.");
