# Cohort 1 Review Plan

## Purpose

Cohort 1 exists to independently evaluate the research-only Availability Engine
against redacted, frozen, human-steward-reviewed real-world cases. It is not a
launch gate for payments, transfers, custody, trading, wallets, live provider
integrations, KYC/AML, eligibility decisions, or settlement guarantees.

## Inclusion criteria

- Case follows `real_world_case_v1`.
- Evidence is collected, redacted, timestamped, and frozen before review.
- Evidence has an as-of timestamp and a separate collection timestamp.
- Case includes scenario/category, provider, corridor, and product identifiers
  where applicable, using redacted equivalents when needed.
- Frozen normalized input includes enough data for deterministic offline replay.
- Human steward independently records classification and rationale.
- Redaction status is `redacted`.
- Freeze status is `frozen`.

## Exclusion criteria

- Synthetic replay fixtures presented as real-world cases.
- Any case containing credentials, secrets, account numbers, wallet keys,
  employer data, PII, or private operational data.
- Evidence collected or altered after the cohort freeze to improve results.
- Cases requiring live provider access or mutable external state.
- Cases with missing evidence timestamps, missing provenance, missing reviewer
  identity, incomplete redaction, inconclusive human review, malformed replay
  hash, or unapproved review status.

## Evidence collection and freeze procedure

1. Collect only already-redacted, research-safe evidence.
2. Record `evidenceAsOfTimestamp` from the source.
3. Record `evidenceCollectedAt` when the redacted evidence package is captured.
4. Add evidence IDs and provenance.
5. Record evidence freshness/staleness information.
6. Freeze the redacted normalized input.
7. Compute and record `deterministicReplay.inputHash`.
8. Run the offline reviewed-case harness.
9. Capture engine classification, rationale, evidence references, policy
   version, and commit SHA.
10. Submit the frozen case to independent human-steward review.

## Independent review procedure

Where practical, separate roles:

- Evidence collector: gathers and redacts evidence, then freezes the case.
- Engine runner: runs deterministic offline replay without changing policies,
  thresholds, evidence, or classifier logic.
- Human steward: independently records classification and rationale.

The steward must not tune the classifier, policy, evidence registry, thresholds,
or case contents during a frozen cohort.

## Disagreements and inconclusive reviews

- Engine abstentions are reported separately and excluded from the agreement
  denominator.
- Human inconclusive reviews are reported separately and excluded from the
  agreement denominator.
- False-available and false-unavailable outcomes are counted separately.
- Disagreement categories must be recorded consistently.
- A high overall agreement rate must not hide false-available outcomes.

## Immutability

A cohort becomes immutable after the cohort manifest, evidence packages, frozen
inputs, replay hashes, engine outputs, and steward reviews are finalized. An
accepted case becomes immutable when its redaction, evidence package, frozen
normalized input hash, engine replay, and human review are complete.

Corrections must not silently rewrite frozen evidence or reviewed cases. Add a
new version or correction record that references the original case ID and
explains the correction.

## Metrics to publish

- Reviewed case count
- Same-day agreement rate
- Abstention rate
- False-available count and rate
- False-unavailable count and rate
- Insufficient-evidence rate
- Inconclusive-review count
- Disagreement categories
- Breakdowns by scenario/category, provider, and corridor where applicable

## Gate and claims

The `>= 90%` same-day classification threshold remains blocked until a
human-approved minimum reviewed sample size is established and met. The minimum
reviewed-sample threshold remains to be approved.

Do not claim accuracy, production availability, live capability, payment
readiness, settlement certainty, eligibility, or compliance support before the
approved sample-size and agreement gates are satisfied.
