# BFI AI Lab data foundation

This directory defines the core dataset foundation for BFI AI Lab finance intelligence research.

The goal is to make the lab reproducible before it becomes complex: every dataset should have a source, purpose, refresh path, and known limitation.

## What is available now

Run:

```bash
npm run data:fetch
```

To fetch raw public seeds, normalize them into research tables, and regenerate the compact site dashboard summary in one command:

```bash
npm run data:refresh
```

The fetcher writes timestamped public seed data into:

```text
data/raw/YYYY-MM-DD/
```

Fetched public seeds:

- Kraken crypto spot ticker snapshot for BTC/USD, ETH/USD, and SOL/USD
- Kraken daily OHLC for BTC/USD, ETH/USD, and SOL/USD
- Kraken hourly OHLC, order-book depth, and recent trades for BTC/USD, ETH/USD, and SOL/USD
- Kraken Futures public ticker data
- Yahoo Finance daily ETF chart data for SPY, QQQ, IWM, GLD, TLT, and UUP
- U.S. Treasury daily yield curve CSV for the current year
- New York Fed SOFR history
- BLS CPI-U and unemployment-rate series
- SEC EDGAR company submissions and XBRL company facts for AAPL, MSFT, NVDA, TSLA, AMZN, GOOGL, META, JPM, COIN, and MSTR
- Cboe delayed options chains for SPY, QQQ, GLD, and TLT
- Yahoo Finance and CoinDesk RSS headline feeds

Each run writes a `manifest.json` with source URLs, file names, byte counts, and errors.
The dashboard summary is written to `src/data/marketPulse.json`.
The normalized data moat summary is written to `src/data/dataMoat.json`.

## Data moat layer

Raw endpoints are not the moat. The moat starts when raw vendor-shaped files are converted into reproducible, analysis-ready tables with quality checks.

Run:

```bash
npm run data:normalize
```

This writes normalized CSV tables into:

```text
data/processed/YYYY-MM-DD/
```

Processed tables currently include:

- `crypto_ohlc_daily.csv`
- `crypto_ohlc_hourly.csv`
- `crypto_orderbook_top25.csv`
- `crypto_recent_trades.csv`
- `etf_prices_daily.csv`
- `treasury_curve.csv`
- `sofr.csv`
- `macro_bls.csv`
- `options_chain_summary.csv`
- `sec_company_summary.csv`
- `kraken_futures_tickers.csv`
- `quality_report.json`

`data/processed/` is ignored by git because it is generated and refreshable. The compact quality report is tracked at `src/data/dataMoat.json`.

Normal mode allows partial success because public data sources can time out or rate-limit. Use strict mode when every configured source must succeed:

```bash
npm run data:fetch:strict
```

## Why raw files are ignored

`data/raw/` is intentionally ignored by git. Raw market files are refreshable artifacts and can grow quickly. The repository tracks:

- `data/catalog.json`
- this README
- `scripts/fetch-core-datasets.mjs`
- `scripts/normalize-research-datasets.mjs`

This keeps the data process reproducible without turning git into data storage.

## Private data templates

Templates for private datasets live in `data/templates/`:

- `positions_template.csv`
- `transactions_template.csv`
- `watchlist_template.csv`

Actual account exports, holdings, transactions, and broker files should go under `data/private/`, which is ignored by git.

## Research use cases supported by the current seeds

The current public datasets are enough for early research notebooks or scripts such as:

- crypto volatility and drawdown studies
- BTC/ETH/SOL trend comparison
- order-book, spread, liquidity, and recent-trade inspection
- equity benchmark return analysis
- risk-on/risk-off proxy analysis using SPY, QQQ, TLT, GLD, and UUP
- rate-regime overlays using the Treasury curve and SOFR
- macro context overlays using CPI and unemployment
- company-level fundamental and filing review
- delayed options-chain hedge prototyping
- market and crypto headline review

The Yahoo Finance ETF seeds are for prototyping. Confirm usage rights or replace them with a licensed provider before distributing production research.

## Still needed for a serious finance lab

The public seeds now cover most starter categories, but they are not a complete institutional research stack. Remaining gaps:

1. Private portfolio holdings and transactions
   - Use the templates in `data/templates/`
   - Put real exports in `data/private/`
   - Never commit account-level data

2. Licensed news and sentiment
   - RSS headlines are useful for context, not a full sentiment corpus
   - Confirm rights before training models, storing article bodies, or redistributing outputs

3. Production-grade options, futures, and equities data
   - Public options chains are delayed and snapshot-based
   - CFTC public futures-positioning endpoints were blocked by browser verification from this environment
   - Institutional backtesting needs licensed history, corporate actions, survivorship-bias controls, and vendor terms

4. Real-time execution data
   - Public snapshots are not enough for live execution research
   - Use exchange or broker APIs with explicit rate-limit, storage, and compliance rules

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
