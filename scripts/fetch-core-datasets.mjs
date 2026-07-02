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

const jsonHeaders = { accept: "application/json" };
const csvHeaders = { accept: "text/csv,*/*" };

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
