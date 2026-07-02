import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const rawRoot = join(process.cwd(), "data", "raw");
const outputPath = join(process.cwd(), "src", "data", "marketPulse.json");

const cryptoPairs = [
  { symbol: "BTC", tickerKey: "XXBTZUSD", orderbookFile: "kraken_btcusd_orderbook_25.json" },
  { symbol: "ETH", tickerKey: "XETHZUSD", orderbookFile: "kraken_ethusd_orderbook_25.json" },
  { symbol: "SOL", tickerKey: "SOLUSD", orderbookFile: "kraken_solusd_orderbook_25.json" },
];

const etfFiles = [
  { symbol: "SPY", file: "yahoo_spy_daily.json", role: "US equity benchmark" },
  { symbol: "QQQ", file: "yahoo_qqq_daily.json", role: "Growth benchmark" },
  { symbol: "IWM", file: "yahoo_iwm_daily.json", role: "Small-cap benchmark" },
  { symbol: "GLD", file: "yahoo_gld_daily.json", role: "Gold hedge proxy" },
  { symbol: "TLT", file: "yahoo_tlt_daily.json", role: "Duration hedge proxy" },
  { symbol: "UUP", file: "yahoo_uup_daily.json", role: "US dollar proxy" },
];

const optionFiles = [
  { symbol: "SPY", file: "cboe_spy_options.json" },
  { symbol: "QQQ", file: "cboe_qqq_options.json" },
  { symbol: "GLD", file: "cboe_gld_options.json" },
  { symbol: "TLT", file: "cboe_tlt_options.json" },
];

const secTickers = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "JPM", "COIN", "MSTR"];

const pct = (current, previous) => {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

const numberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

async function latestRawDir() {
  const entries = await readdir(rawRoot, { withFileTypes: true });
  const dates = entries
    .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  if (dates.length === 0) {
    throw new Error("No data/raw/YYYY-MM-DD directory found. Run npm run data:fetch first.");
  }

  return join(rawRoot, dates.at(-1));
}

async function readJson(rawDir, filename) {
  return JSON.parse(await readFile(join(rawDir, filename), "utf8"));
}

async function readText(rawDir, filename) {
  return readFile(join(rawDir, filename), "utf8");
}

function latestClose(chartData) {
  const result = chartData.chart.result[0];
  const timestamps = result.timestamp ?? [];
  const closes = result.indicators.quote[0].close ?? [];
  const volumes = result.indicators.quote[0].volume ?? [];
  const rows = timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      close: closes[index],
      volume: volumes[index],
    }))
    .filter((row) => Number.isFinite(row.close));

  const latest = rows.at(-1);
  const previous30 = rows.at(-31) ?? rows[0];
  const firstThisYear = rows.find((row) => row.date.startsWith(`${new Date().getUTCFullYear()}-`)) ?? rows[0];

  return {
    date: latest.date,
    last: latest.close,
    volume: latest.volume ?? null,
    return30dPct: pct(latest.close, previous30.close),
    returnYtdPct: pct(latest.close, firstThisYear.close),
  };
}

function parseTreasuryCsv(csv) {
  const [headerLine, firstDataLine] = csv.trim().split("\n");
  const headers = headerLine.split(",").map((header) => header.replaceAll('"', ""));
  const values = firstDataLine.split(",").map((value) => value.replaceAll('"', ""));
  return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
}

function latestBlsValue(seriesData) {
  const latest = seriesData.Results.series[0].data[0];
  return {
    date: `${latest.periodName} ${latest.year}`,
    value: numberOrNull(latest.value),
  };
}

function countFeedItems(xml) {
  return (xml.match(/<item\b/g) ?? []).length;
}

async function main() {
  const rawDir = await latestRawDir();
  const manifest = await readJson(rawDir, "manifest.json");
  const ticker = await readJson(rawDir, "kraken_crypto_ticker.json");

  const crypto = await Promise.all(
    cryptoPairs.map(async (pair) => {
      const item = ticker.result[pair.tickerKey];
      const orderbook = await readJson(rawDir, pair.orderbookFile);
      const book = Object.values(orderbook.result)[0];
      const bid = numberOrNull(item.b?.[0]);
      const ask = numberOrNull(item.a?.[0]);
      const last = numberOrNull(item.c?.[0]);

      return {
        symbol: pair.symbol,
        last,
        bid,
        ask,
        spreadPct: pct(ask, bid),
        dayChangePct: pct(last, numberOrNull(item.o)),
        dayHigh: numberOrNull(item.h?.[0]),
        dayLow: numberOrNull(item.l?.[0]),
        volume24h: numberOrNull(item.v?.[1]),
        orderbookDepth: {
          asks: book.asks.length,
          bids: book.bids.length,
        },
      };
    }),
  );

  const markets = await Promise.all(
    etfFiles.map(async (asset) => ({
      symbol: asset.symbol,
      role: asset.role,
      ...(latestClose(await readJson(rawDir, asset.file))),
    })),
  );

  const treasury = parseTreasuryCsv(await readText(rawDir, "treasury_yield_curve.csv"));
  const sofr = (await readJson(rawDir, "nyfed_sofr.json")).refRates[0];
  const cpi = latestBlsValue(await readJson(rawDir, "bls_cpi_u.json"));
  const unemployment = latestBlsValue(await readJson(rawDir, "bls_unemployment_rate.json"));

  const options = await Promise.all(
    optionFiles.map(async (asset) => {
      const chain = await readJson(rawDir, asset.file);
      return {
        symbol: asset.symbol,
        timestamp: chain.timestamp,
        contracts: chain.data.options.length,
      };
    }),
  );

  const yahooHeadlines = await readText(rawDir, "yahoo_finance_headlines.xml");
  const coinDeskHeadlines = await readText(rawDir, "coindesk_headlines.xml");

  const marketPulse = {
    generatedAt: new Date().toISOString(),
    dataRun: {
      runDate: manifest.runDate,
      fetchedAt: manifest.fetchedAt,
      totalSources: manifest.total,
      successfulSources: manifest.ok,
      errors: manifest.errors,
    },
    crypto,
    markets,
    rates: {
      date: treasury.Date,
      oneMonth: numberOrNull(treasury["1 Mo"]),
      twoYear: numberOrNull(treasury["2 Yr"]),
      tenYear: numberOrNull(treasury["10 Yr"]),
      thirtyYear: numberOrNull(treasury["30 Yr"]),
      tenYearMinusTwoYearBps: Math.round((numberOrNull(treasury["10 Yr"]) - numberOrNull(treasury["2 Yr"])) * 100),
      sofr: {
        date: sofr.effectiveDate,
        rate: sofr.percentRate,
      },
    },
    macro: {
      cpi,
      unemployment,
    },
    options,
    filings: {
      companies: secTickers,
      companyCount: secTickers.length,
      datasetsPerCompany: ["submissions", "companyfacts"],
    },
    headlines: [
      { source: "Yahoo Finance", items: countFeedItems(yahooHeadlines) },
      { source: "CoinDesk", items: countFeedItems(coinDeskHeadlines) },
    ],
    limits: [
      "Public/free data is suitable for prototypes and research support, not investment advice.",
      "ETF, options, and headline feeds may require rights review before distribution or model training.",
      "Private portfolio files belong in data/private/ and should not be committed.",
    ],
  };

  await writeFile(outputPath, `${JSON.stringify(marketPulse, null, 2)}\n`);
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
