import {
  exampleWeeklyTradeNote,
  noTradeGates,
  recommendationScorecard,
  recommendationTiers,
  weeklyTradeOutput,
} from "../src/data/weeklyTradeDiscovery.js";

const failures = [];

const fail = (message) => failures.push(message);
const parseWeight = (weight) => Number.parseInt(weight.replace("%", ""), 10);

const weightTotal = recommendationScorecard.reduce(
  (total, metric) => total + parseWeight(metric.weight),
  0,
);
if (weightTotal !== 100) {
  fail(`Scorecard weights must total 100%, received ${weightTotal}%.`);
}

const scorecardLabels = new Set(recommendationScorecard.map((metric) => metric.label));
for (const item of exampleWeeklyTradeNote.breakdown) {
  if (!scorecardLabels.has(item.label)) {
    fail(`Example breakdown metric "${item.label}" does not exist in the scorecard.`);
  }
  if (item.score > item.max) {
    fail(`Example score for "${item.label}" exceeds its maximum.`);
  }
}

const breakdownTotal = exampleWeeklyTradeNote.breakdown.reduce(
  (total, item) => total + item.score,
  0,
);
if (breakdownTotal !== exampleWeeklyTradeNote.score) {
  fail(
    `Example score ${exampleWeeklyTradeNote.score} must equal breakdown total ${breakdownTotal}.`,
  );
}

const tierNames = new Set(recommendationTiers.map((tier) => tier.name));
for (const requiredTier of ["Primary recommendation", "Watchlist only", "No-trade decision"]) {
  if (!tierNames.has(requiredTier)) {
    fail(`Missing recommendation tier: ${requiredTier}.`);
  }
}

if (exampleWeeklyTradeNote.score < 85 && exampleWeeklyTradeNote.tier === "Primary recommendation") {
  fail("Primary recommendations must score at least 85.");
}

if (exampleWeeklyTradeNote.score >= 85 && exampleWeeklyTradeNote.tier !== "Primary recommendation") {
  fail("Scores of 85 or higher must be marked as primary recommendations.");
}

if (noTradeGates.length < 5) {
  fail("At least five hard no-trade gates are required.");
}

if (exampleWeeklyTradeNote.noTradeTriggers.length < 4) {
  fail("Example output must include at least four no-trade triggers.");
}

const outputFields = new Set(weeklyTradeOutput.fields);
for (const requiredField of [
  "Trade thesis",
  "Score and tier",
  "Entry and invalidation",
  "Position risk",
  "No-trade trigger",
]) {
  if (!outputFields.has(requiredField)) {
    fail(`Weekly output field is missing: ${requiredField}.`);
  }
}

const prohibitedClaims = [
  /guaranteed/i,
  /risk[- ]?free/i,
  /must buy/i,
  /will profit/i,
  /personalized financial advice/i,
];
const combinedCopy = JSON.stringify({
  exampleWeeklyTradeNote,
  noTradeGates,
  recommendationScorecard,
  recommendationTiers,
  weeklyTradeOutput,
});
for (const pattern of prohibitedClaims) {
  if (pattern.test(combinedCopy)) {
    fail(`Trading framework contains prohibited claim pattern: ${pattern}.`);
  }
}

if (failures.length > 0) {
  console.error("Trade framework check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Trade framework check passed.");
