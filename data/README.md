# BFI AI Lab data foundation

This directory defines the core dataset foundation for BFI AI Lab finance intelligence research.

The goal is to make the lab reproducible before it becomes complex: every dataset should have a source, purpose, refresh path, and known limitation.

## What is available now

Run:

```bash
npm run data:fetch
```

The fetcher writes timestamped public seed data into:

```text
data/raw/YYYY-MM-DD/
```

Fetched public seeds:

- Kraken crypto spot ticker snapshot for BTC/USD, ETH/USD, and SOL/USD
- Kraken daily OHLC for BTC/USD, ETH/USD, and SOL/USD
- Yahoo Finance daily ETF chart data for SPY, QQQ, IWM, GLD, TLT, and UUP
- U.S. Treasury daily yield curve CSV for the current year
- New York Fed SOFR history
- BLS CPI-U and unemployment-rate series

Each run writes a `manifest.json` with source URLs, file names, byte counts, and errors.

Normal mode allows partial success because public data sources can time out or rate-limit. Use strict mode when every configured source must succeed:

```bash
npm run data:fetch:strict
```

## Why raw files are ignored

`data/raw/` is intentionally ignored by git. Raw market files are refreshable artifacts and can grow quickly. The repository tracks:

- `data/catalog.json`
- this README
- `scripts/fetch-core-datasets.mjs`

This keeps the data process reproducible without turning git into data storage.

## Research use cases supported by the current seeds

The current public datasets are enough for early research notebooks or scripts such as:

- crypto volatility and drawdown studies
- BTC/ETH/SOL trend comparison
- equity benchmark return analysis
- risk-on/risk-off proxy analysis using SPY, QQQ, TLT, GLD, and UUP
- rate-regime overlays using the Treasury curve and SOFR
- macro context overlays using CPI and unemployment

The Yahoo Finance ETF seeds are for prototyping. Confirm usage rights or replace them with a licensed provider before distributing production research.

## Still needed for a serious finance lab

The public seeds are a start, not a complete institutional research stack. Next datasets should be added deliberately:

1. Company fundamentals and filings
   - Candidate source: SEC EDGAR company facts and filings
   - Needed for equity research, screens, and earnings risk

2. Portfolio holdings and transactions
   - Source: private brokerage, exchange, or portfolio exports
   - Needed for portfolio risk, hedge sizing, and P&L attribution
   - Never commit account-level data

3. News and sentiment
   - Source: licensed or API-key provider
   - Needed for event studies and risk alerts
   - Confirm usage rights before model ingestion

4. Higher-resolution crypto market structure
   - Source: exchange APIs or data vendors
   - Needed for spread, liquidity, slippage, and execution research

5. Options and derivatives data
   - Source: licensed provider
   - Needed for volatility surfaces, hedge design, and scenario testing

## Minimum research standards

Every added dataset should define:

- source URL or provider
- license or usage constraints
- symbol universe
- timestamp convention and timezone
- refresh cadence
- raw storage path
- transformation rules
- missing-value policy
- known survivorship or lookahead-bias risks

BFI AI Lab outputs should be framed as research and decision support, not financial advice.
