# Western Union Agent Settlement Pricing Platform

This document defines a first production-ready shape for a pricing database that helps authorized
Western Union agents understand expected settlement economics, compare them with actual settlement
statements, and maintain an auditable history of pricing assumptions.

The platform should only ingest data an agent is contractually permitted to use: the agent's own
settlement statements, approved partner/API exports, manually entered contract terms, or public price
quotes that are legally reusable. Do not represent the product as affiliated with Western Union unless
that relationship is formally approved.

## Product goal

Give agents a single source of truth for:

- Current and historical settlement pricing by corridor, payout method, currency, and amount band.
- Expected net settlement for each transaction or batch.
- Variance between expected settlement and the official settlement statement.
- Agent commission, fee revenue, FX spread, and exceptions that need finance review.
- Auditable updates to pricing rules and source data.

## Primary users

- **Agent owner / finance lead:** reviews profitability and settlement accuracy.
- **Operations analyst:** uploads statements, resolves exceptions, and manages corridor setup.
- **Pricing manager:** updates amount bands, fees, commissions, FX markups, and effective dates.
- **Auditor / compliance reviewer:** inspects immutable source, change, and reconciliation history.

## Data boundaries

The system stores pricing intelligence and reconciliation records. It should not perform money movement,
customer onboarding, sanctions screening, KYC, or payment execution. If transaction-level customer data is
imported, minimize and tokenize personally identifiable information unless there is a clear compliance need
to retain it.

## Core entities

| Entity | Purpose |
| --- | --- |
| Agent | A Western Union agent, branch, or sub-agent that receives settlement. |
| Corridor | Origin country/currency to destination country/currency plus payout method. |
| Pricing source | Where a price or settlement term came from, with licensing/permission metadata. |
| Amount band | Send amount range used for fees, commission, and markup rules. |
| Pricing snapshot | Point-in-time expected economics for a corridor and amount band. |
| Settlement batch | Official settlement statement or batch imported from a statement/API. |
| Settlement item | Transaction-level settlement economics when available. |
| Reconciliation exception | Difference between expected and actual settlement requiring review. |
| Audit event | Immutable record of pricing and exception changes. |

## Minimum viable workflow

1. Configure agents, branches, countries, currencies, corridors, and payout methods.
2. Enter or import pricing rules for each corridor/amount band.
3. Upload Western Union settlement statements as CSV/XLSX/PDF-extracted rows.
4. Normalize records into settlement batches and items.
5. Calculate expected economics from the active pricing snapshot as of transaction time.
6. Compare expected net settlement, commission, fee, and FX spread against actual records.
7. Flag variances over configured thresholds.
8. Review, resolve, and audit exceptions.

## Pricing calculation model

At quote or reconciliation time, select the active `pricing_snapshot` where:

- `agent_id` matches the agent or is `NULL` for a platform default.
- `corridor_id` matches origin, destination, currencies, and payout method.
- transaction amount is inside the linked `amount_band`.
- `effective_from <= priced_at < effective_to`, with open-ended current rows using `NULL effective_to`.

Suggested calculations:

```text
customer_total = send_amount + customer_fee
payout_amount = send_amount * customer_fx_rate
settlement_amount = send_amount * settlement_fx_rate
fx_margin = send_amount * (customer_fx_rate - settlement_fx_rate)
agent_commission = customer_fee * commission_rate + fixed_commission
expected_net_settlement = settlement_amount - agent_commission_adjustments
variance = actual_net_settlement - expected_net_settlement
```

Use decimal types for money and rates. Avoid floating point for persisted financial calculations.

## REST API contract

Use JSON over HTTPS. All write endpoints should require an authenticated user and should emit an audit
event with request metadata.

### Corridors

#### `GET /api/settlement-pricing/corridors`

Query parameters:

- `originCountry`
- `destinationCountry`
- `sendCurrency`
- `payoutCurrency`
- `payoutMethod`
- `active=true|false`

Response:

```json
{
  "corridors": [
    {
      "id": "cor_01h...",
      "originCountry": "US",
      "destinationCountry": "MX",
      "sendCurrency": "USD",
      "payoutCurrency": "MXN",
      "payoutMethod": "cash",
      "active": true
    }
  ]
}
```

#### `POST /api/settlement-pricing/corridors`

Creates a supported corridor.

```json
{
  "originCountry": "US",
  "destinationCountry": "MX",
  "sendCurrency": "USD",
  "payoutCurrency": "MXN",
  "payoutMethod": "cash"
}
```

### Pricing snapshots

#### `GET /api/settlement-pricing/prices`

Query parameters:

- `agentId`
- `corridorId`
- `amount`
- `pricedAt`
- `includeExpired=false`

Response:

```json
{
  "price": {
    "id": "ps_01h...",
    "agentId": "agt_01h...",
    "corridorId": "cor_01h...",
    "amountBand": {
      "minAmount": "0.00",
      "maxAmount": "500.00"
    },
    "customerFee": "5.99",
    "customerFxRate": "17.142500",
    "settlementFxRate": "17.020000",
    "commissionRateBps": 1200,
    "fixedCommission": "0.00",
    "effectiveFrom": "2026-07-24T00:00:00Z",
    "effectiveTo": null,
    "sourceId": "src_01h..."
  }
}
```

#### `POST /api/settlement-pricing/prices`

Creates a new effective-dated price row. The service should close any overlapping active row for the same
agent/corridor/amount band before inserting the new row.

```json
{
  "agentId": "agt_01h...",
  "corridorId": "cor_01h...",
  "amountBandId": "band_01h...",
  "customerFee": "5.99",
  "customerFxRate": "17.142500",
  "settlementFxRate": "17.020000",
  "commissionRateBps": 1200,
  "fixedCommission": "0.00",
  "effectiveFrom": "2026-07-24T00:00:00Z",
  "sourceId": "src_01h..."
}
```

### Settlement import

#### `POST /api/settlement-pricing/settlement-batches`

Creates a settlement batch from a statement upload or normalized import. For large files, use a two-step
upload flow where the file is stored first and this endpoint receives the parsed manifest.

```json
{
  "agentId": "agt_01h...",
  "statementReference": "WU-2026-07-24-001",
  "settlementDate": "2026-07-24",
  "currency": "USD",
  "sourceId": "src_01h...",
  "items": [
    {
      "externalTransactionId": "txn_123",
      "corridorId": "cor_01h...",
      "transactionTime": "2026-07-23T18:14:00Z",
      "sendAmount": "250.00",
      "customerFee": "5.99",
      "payoutAmount": "4285.63",
      "customerFxRate": "17.142500",
      "settlementFxRate": "17.020000",
      "agentCommission": "0.72",
      "actualNetSettlement": "4254.28"
    }
  ]
}
```

Response:

```json
{
  "batchId": "bat_01h...",
  "itemCount": 1,
  "exceptionCount": 0,
  "status": "imported"
}
```

### Reconciliation

#### `POST /api/settlement-pricing/reconciliations/run`

Runs reconciliation for a batch or date range.

```json
{
  "agentId": "agt_01h...",
  "batchId": "bat_01h...",
  "varianceThresholdAmount": "1.00",
  "varianceThresholdBps": 25
}
```

Response:

```json
{
  "batchId": "bat_01h...",
  "status": "completed",
  "checkedItems": 245,
  "exceptionsCreated": 3,
  "totalVariance": "-14.72"
}
```

#### `GET /api/settlement-pricing/reconciliation-exceptions`

Query parameters:

- `agentId`
- `batchId`
- `status=open|resolved|waived`
- `severity=low|medium|high`

#### `PATCH /api/settlement-pricing/reconciliation-exceptions/{id}`

Updates review status with an audit trail.

```json
{
  "status": "resolved",
  "resolutionReason": "Statement correction confirmed by finance",
  "assignedTo": "user_01h..."
}
```

### Analytics

#### `GET /api/settlement-pricing/analytics/margins`

Query parameters:

- `agentId`
- `from`
- `to`
- `groupBy=corridor|country|currency|payoutMethod|day`

Response:

```json
{
  "asOf": "2026-07-24T09:10:00Z",
  "currency": "USD",
  "rows": [
    {
      "group": "US-MX-cash",
      "transactionCount": 245,
      "sendVolume": "61250.00",
      "feeRevenue": "1467.55",
      "fxMargin": "750.31",
      "agentCommission": "176.11",
      "netMargin": "2041.75"
    }
  ]
}
```

## Security and compliance controls

- Role-based access control by agent, branch, and action.
- Encryption at rest for uploaded statements and sensitive transaction fields.
- Immutable source file retention with hash verification.
- PII minimization; avoid storing sender/receiver names unless required.
- Full audit logging for price changes, imports, exception resolutions, and exports.
- Data retention settings per jurisdiction and contract requirement.
- Explicit source licensing/permission fields before data can be shared externally.

## Operational quality gates

- Validate ISO 4217 currencies and ISO 3166-1 alpha-2 countries.
- Prevent overlapping active price rows for the same agent/corridor/amount band.
- Reject settlement imports with duplicate external transaction IDs inside an agent scope.
- Reconcile using the pricing snapshot active at transaction time, not import time.
- Require reviewer comments when waiving high-severity exceptions.
- Run daily checks for missing prices on active corridors.

## Dashboard modules

The current BR3N dashboard can later expose the pricing product through new modules:

- Settlement variance tape.
- Corridor profitability leaderboard.
- Active pricing matrix by amount band.
- Agent statement import status.
- Exception review queue.
- FX spread and commission trend charts.

