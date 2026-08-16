# Supplier Currency and Settlement Currency Database

This module defines the supplier-side currency database for the settlement pricing platform. It answers
three operational questions:

1. Which currencies can a supplier invoice in?
2. Which currencies can the platform settle that supplier in?
3. Which rule, account, FX source, and quote should be used for a specific settlement?

The database is designed for treasury, supplier operations, and finance reconciliation. It does not move
funds by itself; payment execution should remain in a separate, controlled payments service.

## Product goal

Create a controlled source of truth for supplier currency configuration:

- Supplier master data and jurisdiction.
- Supported invoice currencies.
- Allowed and preferred settlement currencies.
- Verified payout accounts by currency and rail.
- Effective-dated settlement rules.
- FX quote sources, markups, fees, and expected settlement amounts.
- Settlement batches and item-level reconciliation.
- Auditable changes to supplier currency preferences and payout details.

## Core entities

| Entity | Purpose |
| --- | --- |
| Currency | ISO 4217 currency metadata, minor units, and operational status. |
| Supplier | Legal supplier or vendor profile. |
| Supplier currency profile | Default invoice and settlement currency behavior for a supplier. |
| Supplier currency | The invoice/refund currencies a specific supplier is allowed to use. |
| Settlement currency | The currencies, countries, and rails the platform can use for supplier settlement. |
| Supplier settlement currency pair | Approved mapping from one supplier currency to one settlement currency option. |
| Supplier settlement account | Verified payout destination for a supplier/currency/rail. |
| Settlement currency rule | Effective-dated mapping from invoice currency to settlement currency. |
| FX rate source | Approved market, treasury, or bank source used for conversion. |
| Settlement quote | Point-in-time conversion and fee calculation for a supplier payable. |
| Supplier settlement batch | Group of supplier settlement items sent for approval/reconciliation. |
| Supplier settlement item | Payable-level settlement result and expected vs actual values. |
| Supplier currency audit event | Immutable record of configuration and settlement changes. |

## Database table map

The database has tables for both sides of the currency relationship:

### Supplier currency tables

| Table | Purpose |
| --- | --- |
| `suppliers` | Supplier master record. |
| `supplier_currency_profiles` | Supplier-level default invoice and settlement settings. |
| `supplier_currencies` | Explicit list of currencies each supplier can invoice or refund in. |

### Settlement currency tables

| Table | Purpose |
| --- | --- |
| `settlement_currencies` | Explicit list of settlement currencies by country, rail, limits, and treasury status. |
| `supplier_settlement_accounts` | Verified supplier payout accounts for settlement currencies. |
| `supplier_fx_rate_sources` | Approved sources for FX rates. |
| `supplier_fx_rates` | Observed FX rates for converting supplier currency into settlement currency. |

### Tables that connect both sides

| Table | Purpose |
| --- | --- |
| `supplier_settlement_currency_pairs` | Approved mapping from supplier currency to settlement currency. |
| `supplier_settlement_currency_rules` | Effective-dated rule that selects the settlement currency, rail, fee, and markup. |
| `supplier_settlement_quotes` | Point-in-time quote from invoice currency to settlement currency. |
| `supplier_settlement_batches` | Batch of approved supplier settlements. |
| `supplier_settlement_items` | Payable-level settlement result and variance tracking. |
| `supplier_currency_audit_events` | Audit history for both supplier-currency and settlement-currency changes. |

## Currency decision flow

When a payable is ready to settle:

1. Load the supplier and confirm `status = active`.
2. Validate the invoice currency exists in `supplier_currencies` and is enabled for that supplier.
3. Select an active `supplier_settlement_currency_pairs` row for the supplier currency.
4. Resolve the current supplier settlement rule for `supplier_id + invoice_currency`.
5. Choose the highest-priority rule that is active at `quoted_at`.
6. Confirm the selected `settlement_currencies` row is active and treasury-approved.
7. Confirm the supplier has a verified settlement account for the settlement currency and rail.
8. Pull the approved FX rate source for the currency pair.
9. Apply spread/markup and settlement fees.
10. Store a settlement quote with an expiry timestamp.
11. Reconcile actual settlement against the quote and payout confirmation.

## Rule precedence

Use this precedence when multiple rules could apply:

1. Supplier-specific fixed currency rule.
2. Supplier-specific pass-through rule where invoice currency equals settlement currency.
3. Supplier jurisdiction rule.
4. Platform treasury override.
5. Platform default settlement currency.

Rules should be effective-dated instead of overwritten. Close the current rule by setting `effective_to`,
then insert the new rule.

## REST API contract

All write endpoints should emit audit events. Responses should use decimal strings for money and rates.

### Currencies

#### `GET /api/supplier-settlements/currencies`

Response:

```json
{
  "currencies": [
    {
      "code": "USD",
      "name": "US Dollar",
      "minorUnits": 2,
      "status": "active",
      "settlementEnabled": true
    }
  ]
}
```

#### `PATCH /api/supplier-settlements/currencies/{code}`

Updates operational status.

```json
{
  "status": "active",
  "settlementEnabled": true,
  "reason": "Treasury approved USD supplier settlement"
}
```

### Suppliers

#### `POST /api/supplier-settlements/suppliers`

```json
{
  "legalName": "Acme Supplies Ltd",
  "displayName": "Acme Supplies",
  "countryCode": "GB",
  "defaultInvoiceCurrency": "GBP",
  "defaultSettlementCurrency": "USD",
  "settlementFrequency": "weekly"
}
```

#### `GET /api/supplier-settlements/suppliers/{id}/currency-profile`

Response:

```json
{
  "supplierId": "sup_01h...",
  "defaultInvoiceCurrency": "GBP",
  "defaultSettlementCurrency": "USD",
  "settlementFrequency": "weekly",
  "minimumSettlementAmount": "100.00",
  "rules": [
    {
      "id": "scr_01h...",
      "invoiceCurrency": "GBP",
      "settlementCurrency": "USD",
      "ruleType": "fixed",
      "priority": 10,
      "fxMarkupBps": 35,
      "effectiveFrom": "2026-07-24T00:00:00Z",
      "effectiveTo": null
    }
  ],
  "accounts": [
    {
      "id": "acct_01h...",
      "currency": "USD",
      "rail": "swift",
      "accountCountryCode": "US",
      "maskedAccountReference": "****1234",
      "verificationStatus": "verified"
    }
  ]
}
```

### Supplier currencies

#### `POST /api/supplier-settlements/suppliers/{id}/currencies`

Adds a currency the supplier can invoice or refund in.

```json
{
  "currencyCode": "GBP",
  "currencyRole": "invoice",
  "isDefaultInvoice": true,
  "minimumInvoiceAmount": "0.00",
  "maximumInvoiceAmount": null,
  "effectiveFrom": "2026-07-24T00:00:00Z",
  "reason": "Supplier invoices are issued in GBP"
}
```

#### `GET /api/supplier-settlements/suppliers/{id}/currencies`

Response:

```json
{
  "supplierId": "sup_01h...",
  "currencies": [
    {
      "id": "scur_01h...",
      "currencyCode": "GBP",
      "currencyRole": "invoice",
      "status": "active",
      "isDefaultInvoice": true,
      "effectiveFrom": "2026-07-24T00:00:00Z",
      "effectiveTo": null
    }
  ]
}
```

### Settlement currencies

#### `POST /api/supplier-settlements/settlement-currencies`

Adds a currency/rail/country option the platform can use for supplier settlement.

```json
{
  "currencyCode": "USD",
  "settlementCountryCode": "US",
  "rail": "swift",
  "status": "pending_treasury_approval",
  "treasuryOwner": "treasury-ops",
  "minimumSettlementAmount": "25.00",
  "maximumSettlementAmount": null,
  "reason": "Enable USD settlement for international suppliers"
}
```

#### `GET /api/supplier-settlements/settlement-currencies`

Response:

```json
{
  "settlementCurrencies": [
    {
      "id": "setcur_01h...",
      "currencyCode": "USD",
      "settlementCountryCode": "US",
      "rail": "swift",
      "status": "active",
      "minimumSettlementAmount": "25.00",
      "maximumSettlementAmount": null
    }
  ]
}
```

### Supplier-to-settlement currency pairs

#### `POST /api/supplier-settlements/currency-pairs`

Links one supplier invoice/refund currency to one settlement currency option.

```json
{
  "supplierId": "sup_01h...",
  "supplierCurrencyId": "scur_01h...",
  "settlementCurrencyId": "setcur_01h...",
  "priority": 10,
  "isPreferred": true,
  "fxMarkupBps": 35,
  "settlementFee": "4.00",
  "effectiveFrom": "2026-07-24T00:00:00Z",
  "reason": "Preferred GBP invoice to USD settlement path"
}
```

### Settlement currency rules

#### `POST /api/supplier-settlements/rules`

Creates a new effective-dated invoice-to-settlement currency rule.

```json
{
  "supplierId": "sup_01h...",
  "invoiceCurrency": "GBP",
  "settlementCurrency": "USD",
  "settlementRail": "swift",
  "ruleType": "fixed",
  "priority": 10,
  "fxMarkupBps": 35,
  "effectiveFrom": "2026-07-24T00:00:00Z",
  "source": "supplier_contract",
  "reason": "Supplier contract requires USD settlement"
}
```

#### `GET /api/supplier-settlements/rules/resolve`

Query parameters:

- `supplierId`
- `invoiceCurrency`
- `amount`
- `quotedAt`

Response:

```json
{
  "supplierId": "sup_01h...",
  "invoiceCurrency": "GBP",
  "settlementCurrency": "USD",
  "settlementRail": "swift",
  "ruleId": "scr_01h...",
  "priority": 10,
  "fxMarkupBps": 35,
  "requiresFx": true
}
```

### Settlement accounts

#### `POST /api/supplier-settlements/accounts`

Stores a tokenized or masked payout account reference. Raw bank details should be encrypted or held by a
payment provider vault, not logged in application traces.

```json
{
  "supplierId": "sup_01h...",
  "currency": "USD",
  "rail": "swift",
  "accountCountryCode": "US",
  "beneficiaryName": "Acme Supplies Ltd",
  "maskedAccountReference": "****1234",
  "accountToken": "vault_tok_01h...",
  "verificationStatus": "pending"
}
```

### Settlement quotes

#### `POST /api/supplier-settlements/quotes`

```json
{
  "supplierId": "sup_01h...",
  "externalPayableId": "bill_123",
  "invoiceCurrency": "GBP",
  "invoiceAmount": "1000.00",
  "quotedAt": "2026-07-24T09:29:00Z"
}
```

Response:

```json
{
  "quoteId": "sq_01h...",
  "supplierId": "sup_01h...",
  "invoiceCurrency": "GBP",
  "invoiceAmount": "1000.00",
  "settlementCurrency": "USD",
  "baseFxRate": "1.28750000",
  "appliedFxRate": "1.28299375",
  "fxMarkupBps": 35,
  "settlementFee": "4.00",
  "expectedSettlementAmount": "1278.99",
  "expiresAt": "2026-07-24T09:44:00Z"
}
```

### Supplier settlement batches

#### `POST /api/supplier-settlements/batches`

```json
{
  "supplierId": "sup_01h...",
  "settlementCurrency": "USD",
  "settlementDate": "2026-07-25",
  "items": [
    {
      "quoteId": "sq_01h...",
      "externalPayableId": "bill_123",
      "invoiceAmount": "1000.00",
      "expectedSettlementAmount": "1278.99"
    }
  ]
}
```

## Operational controls

- Require treasury approval before enabling a new settlement currency.
- Require account verification before a rule can select an account.
- Store raw bank data only in an approved vault; persist masked values and vault tokens in this database.
- Prevent overlapping current rules for the same supplier/invoice currency/settlement currency/rail.
- Require a reason for settlement currency changes and account changes.
- Re-quote expired settlement quotes before batching.
- Reconcile actual settlement amount, FX rate, and fees against the quote used for approval.

## Dashboard modules

Useful dashboard modules for this database:

- Supplier currency matrix.
- Missing settlement account queue.
- Active FX markup table.
- Expiring quote queue.
- Settlement batch approval status.
- Settlement variance by supplier and currency pair.

