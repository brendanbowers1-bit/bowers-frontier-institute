# Real-world review intake checklist

Use this checklist only for research-only, human-steward-reviewed evaluation.
Do not add credentials, secrets, account numbers, wallet keys, employer data,
PII, live provider connections, payment instructions, transfer instructions, or
settlement guarantees.

See `docs/COHORT_1_REVIEW_PLAN.md` for the freeze, no-tuning, disagreement,
immutability, and publication rules for Cohort 1. See
`docs/COHORT_1_STEWARD_APPROVAL.md` for the exact case format, redaction
rules, and recommended minimum sample size a steward would need to approve
before any real-world case is added.

## Before adding a case

1. Start from `data/real_world_case_v1.template.json`.
2. Confirm the source evidence is already redacted.
3. Confirm the case contains no direct identifiers or account-level data.
4. Confirm a human steward has reviewed the source evidence and classification.
5. Confirm the case remains research-only and read-only.

## Required fields

Each real-world reviewed case must include:

- stable case ID
- fixed evaluation timestamp
- evidence timestamp/as-of dates
- scenario/provider/corridor/product or equivalent identifiers
- redacted normalized input
- evidence IDs, evidence requirements, and provenance
- engine classification, rationale, evidence references, and version
- human steward classification and rationale
- review status, reviewer ID, and review timestamp
- disagreement category
- redaction status
- same-day agreement result

## Metrics tracked by the protocol

The `real_world_case_v1` protocol supports:

- reviewed case count
- same-day agreement rate
- abstention rate
- false-available rate
- false-unavailable rate
- insufficient-evidence rate
- disagreement categories
- scenario/provider/corridor breakdowns

## Current status

- Reviewed real-world cases: `0`
- Gate status: `insufficient-reviewed-cases`
- Accuracy claim: none
- Proposed minimum sample size: `30` determinate cases, pending steward approval
- Proposed first cohort target: `50` cases, pending steward approval

The first cohort should be added only after a human steward supplies redacted,
independently reviewed cases. Do not use synthetic replay scenarios as
real-world cases.
