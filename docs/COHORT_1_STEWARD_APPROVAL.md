# Cohort 1 steward approval

This document is the approval checklist for a later real-world review
cohort. **This pull request does not add real-world cases.** Reviewed
real-world case count remains `0`. Do not treat any number in this file as
an accuracy result.

The Availability Engine stays research-only and read-only. Approving this
protocol does not approve payments, transfers, custody, live provider
access, KYC/AML, eligibility decisions, or production availability claims.

## What you would need to approve later

Three decisions, and nothing else:

1. **Case format** — every later case must follow `real_world_case_v1`.
2. **Redaction rules** — a case is rejected if it is not fully redacted.
3. **Minimum sample size** — the 90% same-day gate stays closed until the
   approved minimum is met.

Synthetic replay fixtures are not real-world cases and must not be
relabeled as such.

## Case format

Use `data/real_world_case_v1.template.json` and
`data/real_world_case_v1.schema.json`. A case is eligible only when all of
the following are present and valid:

- Stable case ID
- Fixed evaluation timestamp
- Evidence as-of timestamp and a separate collection timestamp
- Scenario, provider, corridor, and product identifiers, using redacted
  equivalents when needed
- Redacted frozen normalized input
- Evidence IDs, requirements, dates, freshness, and safe provenance
- Offline engine replay: classification, rationale, evidence references,
  policy version, and commit SHA
- Independent human-steward classification and rationale
- Review status `approved`, reviewer ID, and review timestamp
- Redaction status `redacted`
- Freeze status `frozen`
- Deterministic replay ID and input hash that matches the frozen input
- Disagreement category and same-day agreement result

Start from the template. Do not invent cases to fill the registry.

## Redaction rules

A case may be stored or scored only when `redactionStatus` is `redacted`
and the package contains none of the following:

- Credentials, passwords, API keys, or secrets
- Account numbers, routing numbers, or wallet keys
- Employer data or other workplace identifiers
- Customer IDs, SSNs, or other personally identifying information
- Live provider connections or mutable external state
- Payment, transfer, trade, or settlement instructions

Evidence must be redacted before freeze. Do not collect extra evidence
after freeze to improve results. Do not rewrite a frozen case; add a new
version that points at the original ID.

The harness already rejects unredacted, unapproved, unfrozen, hash-mismatched,
and unsafe-provenance cases.

## Recommended minimum sample size

Recommend you approve these numbers before any case is added:

| Gate | Recommended threshold | What it is for |
| --- | --- | --- |
| Minimum same-day denominator | **30** approved, determinate cases | Smallest research floor before the 90% gate may be considered |
| First published cohort target | **50** cases across at least 3 scenario/provider/corridor combinations | Enough to publish breakdowns that are not empty cells |
| False-available | **0** in the scored denominator | Blocks any accuracy claim even if headline agreement is high |

Only approved, determinate cases count. Engine abstentions and human
inconclusive reviews are excluded from the 30/50 denominators.

Thirty is a research floor, not a production sample. At 27/30 agreement
the uncertainty band is still wide, so even a passing 90% result would
remain a preliminary research finding. Do not claim production accuracy,
live capability, or payment readiness from Cohort 1.

These numbers are **proposed**. They are not in force until you approve
them. Until then the harness reports `insufficient-reviewed-cases` and
`accuracy: null`.

## What this pull request does not do

- Does not add real-world cases
- Does not mark the 90% gate passed
- Does not claim empirical accuracy
- Does not change the public evaluate endpoint beyond exact synthetic
  scenario replay
- Does not ask you to approve cases yet — only to review the protocol
  so later intake has an explicit bar
