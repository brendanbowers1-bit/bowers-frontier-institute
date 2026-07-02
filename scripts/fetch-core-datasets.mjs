import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const runDate = new Date().toISOString().slice(0, 10);
const fetchedAt = new Date().toISOString();
const outputDir = join(process.cwd(), "data", "raw", runDate);
const strictMode = process.argv.includes("--strict");
const defaultTimeoutMs = 15_000;
const currentYear = new Date().getUTCFullYear();
const macroStartYear = currentYear - 6;
const marketStartEpoch = Math.floor(Date.UTC(macroStartYear, 0, 1) / 1000);
const marketEndEpoch = Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000);
const secUserAgent =
  process.env.SEC_USER_AGENT ?? "bowers-frontier-institute/1.0 research-data-fetcher";

const jsonHeaders = { accept: "application/json" };
const csvHeaders = { accept: "text/csv,*/*" };
const secHeaders = { accept: "application/json", "user-agent": secUserAgent };
const xmlHeaders = { accept: "application/rss+xml,text/xml,*/*" };

const krakenSpotPairs = [
  { symbol: "btcusd", pair: "XBTUSD" },
  { symbol: "ethusd", pair: "ETHUSD" },
  { symbol: "solusd", pair: "SOLUSD" },
];

const secCompanies = [
  { ticker: "aapl", cik: "0000320193" },
  { ticker: "msft", cik: "0000789019" },
  { ticker: "nvda", cik: "0001045810" },
  { ticker: "tsla", cik: "0001318605" },
  { ticker: "amzn", cik: "0001018724" },
  { ticker: "googl", cik: "0001652044" },
  { ticker: "meta", cik: "0001326801" },
  { ticker: "jpm", cik: "0000019617" },
  { ticker: "coin", cik: "0001679788" },
  { ticker: "mstr", cik: "0001050446" },
];

const optionSymbols = ["SPY", "QQQ", "GLD", "TLT"];

const targets = [
  {
    id: "kraken-crypto-ticker",
    filename: "kraken_crypto_ticker.json",
    url: "https://api.kraken.com/0/public/Ticker?pair=XBTUSD,ETHUSD,SOLUSD",
    format: "json",
    headers: jsonHeaders,
  },
  {
    id: "kraken-btcusd-ohlc-daily",
    filename: "kraken_btcusd_ohlc_daily.json",
    url: "https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=1440",
    format: "json",
    headers: jsonHeaders,
  },
  {
    id: "kraken-ethusd-ohlc-daily",
    filename: "kraken_ethusd_ohlc_daily.json",
    url: "https://api.kraken.com/0/public/OHLC?pair=ETHUSD&interval=1440",
    format: "json",
    headers: jsonHeaders,
  },
  {
    id: "kraken-solusd-ohlc-daily",
    filename: "kraken_solusd_ohlc_daily.json",
    url: "https://api.kraken.com/0/public/OHLC?pair=SOLUSD&interval=1440",
    format: "json",
    headers: jsonHeaders,
  },
  ...krakenSpotPairs.flatMap(({ symbol, pair }) => [
    {
      id: `kraken-${symbol}-ohlc-hourly`,
      filename: `kraken_${symbol}_ohlc_hourly.json`,
      url: `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=60`,
      format: "json",
      headers: jsonHeaders,
    },
    {
      id: `kraken-${symbol}-orderbook`,
      filename: `kraken_${symbol}_orderbook_25.json`,
      url: `https://api.kraken.com/0/public/Depth?pair=${pair}&count=25`,
      format: "json",
      headers: jsonHeaders,
    },
    {
      id: `kraken-${symbol}-trades`,
      filename: `kraken_${symbol}_recent_trades.json`,
      url: `https://api.kraken.com/0/public/Trades?pair=${pair}`,
      format: "json",
      headers: jsonHeaders,
    },
  ]),
  {
    id: "kraken-futures-tickers",
    filename: "kraken_futures_tickers.json",
    url: "https://futures.kraken.com/derivatives/api/v3/tickers",
    format: "json",
    headers: jsonHeaders,
  },
  {
    id: "yahoo-spy-daily",
    filename: "yahoo_spy_daily.json",
    url: `https://query1.finance.yahoo.com/v8/finance/chart/SPY?period1=${marketStartEpoch}&period2=${marketEndEpoch}&interval=1d&events=history`,
    format: "json",
    headers: jsonHeaders,
  },
  {
    id: "yahoo-qqq-daily",
    filename: "yahoo_qqq_daily.json",
    url: `https://query1.finance.yahoo.com/v8/finance/chart/QQQ?period1=${marketStartEpoch}&period2=${marketEndEpoch}&interval=1d&events=history`,
    format: "json",
    headers: jsonHeaders,
  },
  {
    id: "yahoo-iwm-daily",
    filename: "yahoo_iwm_daily.json",
    url: `https://query1.finance.yahoo.com/v8/finance/chart/IWM?period1=${marketStartEpoch}&period2=${marketEndEpoch}&interval=1d&events=history`,
    format: "json",
    headers: jsonHeaders,
  },
  {
    id: "yahoo-gld-daily",
    filename: "yahoo_gld_daily.json",
    url: `https://query1.finance.yahoo.com/v8/finance/chart/GLD?period1=${marketStartEpoch}&period2=${marketEndEpoch}&interval=1d&events=history`,
    format: "json",
    headers: jsonHeaders,
  },
  {
    id: "yahoo-tlt-daily",
    filename: "yahoo_tlt_daily.json",
    url: `https://query1.finance.yahoo.com/v8/finance/chart/TLT?period1=${marketStartEpoch}&period2=${marketEndEpoch}&interval=1d&events=history`,
    format: "json",
    headers: jsonHeaders,
  },
  {
    id: "yahoo-uup-daily",
    filename: "yahoo_uup_daily.json",
    url: `https://query1.finance.yahoo.com/v8/finance/chart/UUP?period1=${marketStartEpoch}&period2=${marketEndEpoch}&interval=1d&events=history`,
    format: "json",
    headers: jsonHeaders,
  },
  {
    id: "treasury-yield-curve",
    filename: "treasury_yield_curve.csv",
    url: `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${currentYear}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${currentYear}&page&_format=csv`,
    format: "csv",
    headers: csvHeaders,
  },
  {
    id: "nyfed-sofr",
    filename: "nyfed_sofr.json",
    url: `https://markets.newyorkfed.org/api/rates/secured/sofr/search.json?startDate=${macroStartYear}-01-01&endDate=${runDate}&type=rate`,
    format: "json",
    headers: jsonHeaders,
  },
  {
    id: "bls-cpi-u",
    filename: "bls_cpi_u.json",
    url: `https://api.bls.gov/publicAPI/v2/timeseries/data/CUUR0000SA0?startyear=${macroStartYear}&endyear=${currentYear}`,
    format: "json",
    headers: jsonHeaders,
  },
  {
    id: "bls-unemployment-rate",
    filename: "bls_unemployment_rate.json",
    url: `https://api.bls.gov/publicAPI/v2/timeseries/data/LNS14000000?startyear=${macroStartYear}&endyear=${currentYear}`,
    format: "json",
    headers: jsonHeaders,
  },
  {
    id: "sec-company-tickers",
    filename: "sec_company_tickers.json",
    url: "https://www.sec.gov/files/company_tickers.json",
    format: "json",
    headers: secHeaders,
    timeoutMs: 30_000,
  },
  ...secCompanies.flatMap(({ ticker, cik }) => [
    {
      id: `sec-${ticker}-submissions`,
      filename: `sec_${ticker}_submissions.json`,
      url: `https://data.sec.gov/submissions/CIK${cik}.json`,
      format: "json",
      headers: secHeaders,
      timeoutMs: 30_000,
    },
    {
      id: `sec-${ticker}-companyfacts`,
      filename: `sec_${ticker}_companyfacts.json`,
      url: `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,
      format: "json",
      headers: secHeaders,
      timeoutMs: 30_000,
    },
  ]),
  ...optionSymbols.map((symbol) => ({
    id: `cboe-${symbol.toLowerCase()}-options`,
    filename: `cboe_${symbol.toLowerCase()}_options.json`,
    url: `https://cdn.cboe.com/api/global/delayed_quotes/options/${symbol}.json`,
    format: "json",
    headers: jsonHeaders,
    timeoutMs: 30_000,
  })),
  {
    id: "yahoo-finance-headlines",
    filename: "yahoo_finance_headlines.xml",
    url: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=SPY,QQQ,BTC-USD,ETH-USD,GLD,TLT&region=US&lang=en-US",
    format: "xml",
    headers: xmlHeaders,
  },
  {
    id: "coindesk-headlines",
    filename: "coindesk_headlines.xml",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    format: "xml",
    headers: xmlHeaders,
  },
];

async function fetchTarget(target) {
  const controller = new AbortController();
  const timeoutMs = target.timeoutMs ?? defaultTimeoutMs;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  let text;

  try {
    response = await fetch(target.url, {
      headers: target.headers,
      signal: controller.signal,
    });
    text = await response.text();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`${target.id} timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`${target.id} returned HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  if (target.format === "json") {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed.error) && parsed.error.length > 0) {
      throw new Error(`${target.id} returned API errors: ${parsed.error.join(", ")}`);
    }
    if (parsed.result === "error") {
      throw new Error(`${target.id} returned API result error`);
    }
    if (parsed.status && parsed.status !== "REQUEST_SUCCEEDED") {
      throw new Error(`${target.id} returned status ${parsed.status}`);
    }
    if (parsed.chart?.error) {
      throw new Error(`${target.id} returned chart error: ${parsed.chart.error.description}`);
    }
    if (parsed.chart && !Array.isArray(parsed.chart.result)) {
      throw new Error(`${target.id} returned chart data without result rows`);
    }
    const pretty = `${JSON.stringify(parsed, null, 2)}\n`;
    await writeFile(join(outputDir, target.filename), pretty);
    return { ...target, bytes: Buffer.byteLength(pretty), status: "ok" };
  }

  if (target.format === "xml") {
    if (!/<rss|<feed|<\?xml/i.test(text)) {
      throw new Error(`${target.id} returned non-feed XML payload`);
    }
    await writeFile(join(outputDir, target.filename), text.endsWith("\n") ? text : `${text}\n`);
    return { ...target, bytes: Buffer.byteLength(text), status: "ok" };
  }

  if (/^\s*</.test(text)) {
    throw new Error(`${target.id} returned HTML instead of CSV`);
  }

  if (!text.includes("\n")) {
    throw new Error(`${target.id} returned an unexpectedly small CSV payload`);
  }

  await writeFile(join(outputDir, target.filename), text.endsWith("\n") ? text : `${text}\n`);
  return { ...target, bytes: Buffer.byteLength(text), status: "ok" };
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const results = [];
  for (const target of targets) {
    process.stdout.write(`Fetching ${target.id}... `);
    try {
      const result = await fetchTarget(target);
      results.push({
        id: result.id,
        filename: result.filename,
        url: result.url,
        format: result.format,
        status: result.status,
        bytes: result.bytes,
      });
      process.stdout.write("ok\n");
    } catch (error) {
      results.push({
        id: target.id,
        filename: target.filename,
        url: target.url,
        format: target.format,
        status: "error",
        error: error.message,
      });
      process.stdout.write(`error: ${error.message}\n`);
    }
  }

  const manifest = {
    runDate,
    fetchedAt,
    outputDir,
    total: results.length,
    ok: results.filter((result) => result.status === "ok").length,
    errors: results.filter((result) => result.status === "error").length,
    results,
  };

  await writeFile(join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  if (manifest.errors > 0 && (strictMode || manifest.ok === 0)) {
    process.exitCode = 1;
  }

  console.log(`Wrote manifest to ${join("data", "raw", runDate, "manifest.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
